import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail, 
  updatePassword,
  updateEmail,
  EmailAuthProvider, 
  reauthenticateWithCredential,
  setPersistence,
  inMemoryPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, limit, orderBy, onSnapshot, serverTimestamp, increment, getDocFromServer, enableIndexedDbPersistence, writeBatch, runTransaction } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Prioritize environment variables (Vite requires VITE_ prefix for client-side)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || 'ai-studio-bfd3074c-3577-4e03-a708-5766835cb18b'
};

// Debug log for production (only logs keys presence, not values)
if (process.env.NODE_ENV === 'production') {
  console.log('Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    dbId: firebaseConfig.firestoreDatabaseId
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const adminApp = initializeApp(firebaseConfig, 'admin-app');

// Initialize Services
export const auth = getAuth(app);
export const adminAuth = getAuth(adminApp);

// Use local persistence for both auth instances to ensure they stay active across tabs and restarts
if (typeof window !== 'undefined') {
  const { browserLocalPersistence } = await import('firebase/auth');
  setPersistence(adminAuth, browserLocalPersistence).catch((err) => {
    console.warn('Failed to set adminAuth persistence:', err);
  });
}

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const adminDb = initializeFirestore(adminApp, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export let messaging: Messaging | null = null;

// Initialize messaging only in browser
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase Messaging not supported or failed to initialize:', err);
  }
}

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported in this browser');
    }
  });

  enableIndexedDbPersistence(adminDb).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Admin Firestore persistence failed: Multiple tabs open');
    }
  });
}

export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGoogleRedirect = () => signInWithRedirect(auth, googleProvider);
export const getGoogleRedirectResult = () => getRedirectResult(auth);

// Retry wrapper for auth functions to handle transient network errors
const withRetry = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        console.warn('Network request failed in Auth. Retrying...');
        await new Promise(r => setTimeout(r, 1000));
        return await fn(...args);
      }
      throw error;
    }
  }) as T;
};

export const loginWithEmail = withRetry((email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass));
export const signupWithEmail = withRetry((email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass));
export const resetPassword = withRetry((email: string) => sendPasswordResetEmail(auth, email));
export const changePassword = withRetry((newPass: string) => {
  if (!auth.currentUser) throw new Error('No user logged in');
  return updatePassword(auth.currentUser, newPass);
});
export const reauthenticate = withRetry((password: string) => {
  if (!auth.currentUser || !auth.currentUser.email) throw new Error('No user logged in');
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  return reauthenticateWithCredential(auth.currentUser, credential);
});
export const logout = () => signOut(auth);

// Admin User Creation Helper (Secondary Auth)
export const createAdminUserClientSide = async (email: string, pass: string) => {
  const trimmedEmail = (email || '').trim();
  const { initializeApp, deleteApp } = await import('firebase/app');
  const appName = `SecondaryApp_${Math.random().toString(36).substring(2, 10)}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, trimmedEmail, pass);
    await secondaryAuth.signOut(); // Ensure we sign out the secondary auth so it doesn't leave lingering sessions
    return userCredential.user;
  } finally {
    // Clean up the secondary app instance
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.error('Failed to delete secondary app:', e);
    }
  }
};
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth.currentUser ? auth : adminAuth;
  const currentUser = currentAuth.currentUser;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Critical: Connection Test per baseline guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log('Firestore connection verified');
  } catch (error) {
    console.warn("Firestore connection check info:", error);
  }
}
testConnection();

export {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  onAuthStateChanged,
  getDocFromServer,
  addDoc,
  writeBatch,
  runTransaction,
  getToken,
  onMessage,
  updateEmail
};
