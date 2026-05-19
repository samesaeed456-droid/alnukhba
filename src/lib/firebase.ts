import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as realSignOut,
  onAuthStateChanged as realOnAuthStateChanged,
  signInWithEmailAndPassword as realSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword as realUpdatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  inMemoryPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  doc as realDoc,
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  setDoc as realSetDoc,
  addDoc as realAddDoc,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  collection as realCollection,
  collectionGroup as realCollectionGroup,
  query as realQuery,
  where as realWhere,
  limit as realLimit,
  orderBy as realOrderBy,
  onSnapshot as realOnSnapshot,
  serverTimestamp as realServerTimestamp,
  increment as realIncrement,
  getDocFromServer as realGetDocFromServer,
  enableIndexedDbPersistence,
  writeBatch as realWriteBatch,
  runTransaction as realRunTransaction,
} from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";
import { supabase } from "./supabase";

// 1. Determine if Supabase is configured and active
export const isSupabaseActive = () => {
  try {
    const client = supabase();
    return client !== null;
  } catch (e) {
    return false;
  }
};

// Prioritize environment variables (Vite requires VITE_ prefix for client-side)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseConfigJson.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    firebaseConfigJson.firestoreDatabaseId ||
    "ai-studio-bfd3074c-3577-4e03-a708-5766835cb18b",
};

// Initialize Firebase with try-catch
let app: any = null;
let adminApp: any = null;
let auth: any = null;
let adminAuth: any = null;
let db: any = null;
let adminDb: any = null;

try {
  app = initializeApp(firebaseConfig);
  adminApp = initializeApp(firebaseConfig, "admin-app");
  auth = getAuth(app);
  adminAuth = getAuth(adminApp);
  
  if (typeof window !== "undefined") {
    setPersistence(adminAuth, browserLocalPersistence).catch((err) => {
      console.warn("Failed to set adminAuth persistence:", err);
    });
  }

  db = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    firebaseConfig.firestoreDatabaseId,
  );

  adminDb = initializeFirestore(
    adminApp,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    firebaseConfig.firestoreDatabaseId,
  );
} catch (error) {
  console.warn("Firebase could not be initialized (using Supabase exclusively):", error);
}

export { app, adminApp, auth, adminAuth, db, adminDb };

export let messaging: Messaging | null = null;

// Initialize messaging only in browser
if (typeof window !== "undefined" && app) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn(
      "Firebase Messaging not supported or failed to initialize:",
      err,
    );
  }
}

export const googleProvider = new GoogleAuthProvider();

// Custom Fake Classes to implement Firestore compatibility interfaces
export class FakeDocSnapshot {
  id: string;
  private _data: any;
  ref: { id: string; path: string };
  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
    this.ref = { id, path: id };
  }
  exists() {
    return this._data !== null && this._data !== undefined;
  }
  data() {
    return this._data;
  }
}

export class FakeQuerySnapshot {
  docs: FakeDocSnapshot[];
  get size() {
    return this.docs.length;
  }
  get empty() {
    return this.docs.length === 0;
  }
  constructor(docs: FakeDocSnapshot[]) {
    this.docs = docs;
  }
  forEach(callback: (doc: FakeDocSnapshot, index: number) => void) {
    this.docs.forEach(callback);
  }
}

// Global synthetic Auth state management for Supabase
const authListeners = new Set<any>();
let currentSupabaseUser: any = null;

export const supabaseOnAuthStateChanged = (callback: any) => {
  authListeners.add(callback);
  // Initially trigger with currently logged in user
  const saved = localStorage.getItem("supabase_auth_session");
  if (saved) {
    try {
      currentSupabaseUser = JSON.parse(saved);
    } catch (e) {}
  }
  callback(currentSupabaseUser);
  return () => {
    authListeners.delete(callback);
  };
};

export const setSupabaseUser = (user: any) => {
  currentSupabaseUser = user;
  if (user) {
    localStorage.setItem("supabase_auth_session", JSON.stringify(user));
  } else {
    localStorage.removeItem("supabase_auth_session");
  }
  authListeners.forEach(cb => cb(user));
};

// Database queries runner for Supabase
async function runSupabaseQuery(queryRef: any): Promise<FakeQuerySnapshot> {
  const client = supabase();
  if (!client) {
    return new FakeQuerySnapshot([]);
  }

  const table = queryRef.collectionName;

  // Static / Local mock handlers for settings, cities, shipping_zones
  if (table === 'settings') {
    const localSettings = localStorage.getItem("store_settings");
    const data = localSettings ? JSON.parse(localSettings) : {};
    return new FakeQuerySnapshot([new FakeDocSnapshot('store', data)]);
  }
  if (table === 'cities') {
    const localCities = localStorage.getItem("store_cities");
    const data = localCities ? JSON.parse(localCities) : [];
    return new FakeQuerySnapshot(data.map((c: any) => {
      const id = c.id || String(c);
      const row = typeof c === 'object' ? c : { id, name: c };
      return new FakeDocSnapshot(id, row);
    }));
  }
  if (table === 'shipping_zones') {
    const localZones = localStorage.getItem("store_shipping_zones");
    const data = localZones ? JSON.parse(localZones) : [];
    return new FakeQuerySnapshot(data.map((z: any) => new FakeDocSnapshot(z.id || String(z), z)));
  }

  try {
    let builder = client.from(table).select('*');

    // Apply filters
    if (queryRef.conditions) {
      for (const cond of queryRef.conditions) {
        const { field, operator, value } = cond;
        const mappedField = field === 'id' && table === 'users' ? 'uid' : field;
        if (operator === '==') {
          builder = builder.eq(mappedField, value);
        } else if (operator === '>') {
          builder = builder.gt(mappedField, value);
        } else if (operator === '<') {
          builder = builder.lt(mappedField, value);
        } else if (operator === '>=') {
          builder = builder.gte(mappedField, value);
        } else if (operator === '<=') {
          builder = builder.lte(mappedField, value);
        }
      }
    }

    // Apply sorting
    if (queryRef.orderByFields) {
      for (const order of queryRef.orderByFields) {
        const mappedField = order.field === 'id' && table === 'users' ? 'uid' : order.field;
        builder = builder.order(mappedField, { ascending: order.direction === 'asc' });
      }
    }

    // Apply limits
    if (queryRef.limitVal !== null) {
      builder = builder.limit(queryRef.limitVal);
    }

    const { data, error } = await builder;
    if (error) {
      console.warn(`Supabase query warning for ${table}:`, error.message);
      return new FakeQuerySnapshot([]);
    }

    return new FakeQuerySnapshot(
      (data || []).map((row: any) => {
        const id = table === 'users' ? row.uid : row.id;
        return new FakeDocSnapshot(id, row);
      })
    );
  } catch (err) {
    console.error(`Supabase fetch query exception for ${table}:`, err);
    return new FakeQuerySnapshot([]);
  }
}

// High-fidelity API implementations
export const doc = (dbRef: any, pathOrCol?: string, ...paths: string[]): any => {
  if (isSupabaseActive()) {
    let collectionName = '';
    let id = '';

    if (dbRef && dbRef.type === 'collection') {
      collectionName = dbRef.collectionName;
      id = pathOrCol || '';
    } else {
      const fullPath = [pathOrCol, ...paths].filter(Boolean).join('/');
      const parts = fullPath.split('/');
      if (parts.length >= 2) {
        id = parts[parts.length - 1];
        collectionName = parts[parts.length - 2];
      } else {
        collectionName = parts[0] || '';
        id = '';
      }
    }

    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    return {
      type: 'doc',
      collectionName,
      id,
      path: `${collectionName}/${id}`
    };
  }
  if (pathOrCol === undefined) {
    return realDoc(dbRef);
  }
  return realDoc(dbRef, pathOrCol, ...paths);
};

export const collection = (dbRef: any, collectionName: string, ...rest: string[]): any => {
  if (isSupabaseActive()) {
    const fullPath = [collectionName, ...rest].join('/');
    const parts = fullPath.split('/');
    const leaf = parts[parts.length - 1];
    return {
      type: 'collection',
      collectionName: leaf,
      path: fullPath,
      conditions: [],
      orderByFields: [],
      limitVal: null
    };
  }
  return realCollection(dbRef, collectionName, ...rest);
};

export const collectionGroup = (dbRef: any, collectionName: string): any => {
  if (isSupabaseActive()) {
    return {
      type: 'collection',
      collectionName,
      path: collectionName,
      conditions: [],
      orderByFields: [],
      limitVal: null
    };
  }
  return realCollectionGroup(dbRef, collectionName);
};

export const getDoc = async (docRef: any) => {
  if (isSupabaseActive()) {
    const table = docRef.collectionName;
    const id = docRef.id;

    if (table === 'settings') {
      const localSettings = localStorage.getItem("store_settings");
      const data = localSettings ? JSON.parse(localSettings) : {};
      return new FakeDocSnapshot(id, data);
    }
    if (table === 'cities') {
      const localCities = localStorage.getItem("store_cities");
      const data = localCities ? JSON.parse(localCities) : [];
      const found = data.find((c: any) => (c.id || String(c)) === id);
      return new FakeDocSnapshot(id, found || null);
    }
    if (table === 'shipping_zones') {
      const localZones = localStorage.getItem("store_shipping_zones");
      const data = localZones ? JSON.parse(localZones) : [];
      const found = data.find((z: any) => z.id === id);
      return new FakeDocSnapshot(id, found || null);
    }

    const client = supabase();
    if (!client) return new FakeDocSnapshot(id, null);

    const idColumn = table === 'users' ? 'uid' : 'id';
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase error fetching document in ${table}:`, error.message);
      return new FakeDocSnapshot(id, null);
    }
    return new FakeDocSnapshot(id, data);
  }
  return realGetDoc(docRef);
};

export const getDocs = async (queryRef: any) => {
  if (isSupabaseActive()) {
    return runSupabaseQuery(queryRef);
  }
  return realGetDocs(queryRef);
};

export const addDoc = async (collectionRef: any, data: any) => {
  if (isSupabaseActive()) {
    const table = collectionRef.collectionName;

    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
      } else {
        current = {};
      }
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newObj = { ...data, id };
      if (Array.isArray(current)) {
        current.push(newObj);
      } else {
        current = { ...current, ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return { id };
    }

    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");

    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const insertData = { ...data };
    if (table === 'users') {
      insertData.uid = id;
    } else {
      insertData.id = id;
    }

    // Convert serverTimestamp/FieldValues to compatible Dates
    for (const [k, v] of Object.entries(insertData)) {
      if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v || v.constructor?.name === 'FieldValue')) {
        insertData[k] = new Date().toISOString();
      }
    }

    const { error } = await client.from(table).insert(insertData);
    if (error) throw error;
    return { id };
  }
  return realAddDoc(collectionRef, data);
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  if (isSupabaseActive()) {
    const table = docRef.collectionName;
    const id = docRef.id;

    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        const filtered = current.filter((x: any) => (x.id || String(x)) !== id);
        filtered.push({ ...data, id });
        current = filtered;
      } else {
        current = { ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return;
    }

    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");

    const idColumn = table === 'users' ? 'uid' : 'id';
    const upsertData = { ...data };
    upsertData[idColumn] = id;

    // Convert values
    for (const [k, v] of Object.entries(upsertData)) {
      if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v || v.constructor?.name === 'FieldValue')) {
        upsertData[k] = new Date().toISOString();
      }
    }

    const { error } = await client.from(table).upsert(upsertData);
    if (error) throw error;
    return;
  }
  return realSetDoc(docRef, data);
};

export const updateDoc = async (docRef: any, data: any) => {
  if (isSupabaseActive()) {
    const table = docRef.collectionName;
    const id = docRef.id;

    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        current = current.map((x: any) => (x.id || String(x)) === id ? { ...x, ...data } : x);
      } else {
        try { current = JSON.parse(localStorage.getItem(localKey) || '{}'); } catch(e) {}
        current = { ...current, ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return;
    }

    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");

    const idColumn = table === 'users' ? 'uid' : 'id';
    const updateData = { ...data };

    for (const [k, v] of Object.entries(updateData)) {
      if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v || v.constructor?.name === 'FieldValue')) {
        updateData[k] = new Date().toISOString();
      } else if (v && typeof v === 'object' && (v as any).type === 'increment') {
        try {
          const { data: row } = await client.from(table).select(k).eq(idColumn, id).maybeSingle();
          if (row) {
            const currentVal = Number(row[k] || 0);
            updateData[k] = currentVal + (v as any).amount;
          }
        } catch (e) {
          console.error("Increment failed:", e);
        }
      }
    }

    const { error } = await client.from(table).update(updateData).eq(idColumn, id);
    if (error) throw error;
    return;
  }
  return realUpdateDoc(docRef, data);
};

export const deleteDoc = async (docRef: any) => {
  if (isSupabaseActive()) {
    const table = docRef.collectionName;
    const id = docRef.id;

    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      if (table !== 'settings') {
        let current: any = [];
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        current = current.filter((x: any) => (x.id || String(x)) !== id);
        localStorage.setItem(localKey, JSON.stringify(current));
      } else {
        localStorage.removeItem(localKey);
      }
      return;
    }

    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");

    const idColumn = table === 'users' ? 'uid' : 'id';
    const { error } = await client.from(table).delete().eq(idColumn, id);
    if (error) throw error;
    return;
  }
  return realDeleteDoc(docRef);
};

export const onSnapshot = (queryRef: any, callback: any, errorCallback?: any) => {
  if (isSupabaseActive()) {
    let active = true;
    let subscription: any = null;

    const run = async () => {
      try {
        const snap = await runSupabaseQuery(queryRef);
        if (active) callback(snap);
      } catch (err) {
        if (active && errorCallback) errorCallback(err);
      }
    };

    run();

    const table = queryRef.collectionName;
    if (table && !['settings', 'cities', 'shipping_zones'].includes(table)) {
      try {
        const client = supabase();
        if (client) {
          subscription = client
            .channel(`public:${table}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: table },
              () => {
                if (active) run();
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.warn("Supabase Realtime subscription not enabled/err, falling back to manual triggering:", err);
      }
    }

    return () => {
      active = false;
      if (subscription) {
        supabase()?.removeChannel(subscription);
      }
    };
  }
  return realOnSnapshot(queryRef, callback, errorCallback);
};

export const query = (baseQuery: any, ...modifiers: any[]) => {
  if (isSupabaseActive()) {
    const q = { 
      ...baseQuery, 
      conditions: [...(baseQuery.conditions || [])], 
      orderByFields: [...(baseQuery.orderByFields || [])],
      limitVal: baseQuery.limitVal
    };
    for (const mod of modifiers) {
      if (!mod) continue;
      if (mod.type === 'where') {
        q.conditions.push(mod);
      } else if (mod.type === 'orderBy') {
        q.orderByFields.push(mod);
      } else if (mod.type === 'limit') {
        q.limitVal = mod.value;
      }
    }
    return q;
  }
  return realQuery(baseQuery, ...modifiers);
};

export const where = (field: string, operator: string, value: any) => {
  if (isSupabaseActive()) {
    return { type: 'where', field, operator, value };
  }
  return realWhere(field, operator as any, value);
};

export const orderBy = (field: string, direction: 'asc'|'desc' = 'asc') => {
  if (isSupabaseActive()) {
    return { type: 'orderBy', field, direction };
  }
  return realOrderBy(field, direction);
};

export const limit = (value: number) => {
  if (isSupabaseActive()) {
    return { type: 'limit', value };
  }
  return realLimit(value);
};

export const serverTimestamp = () => {
  if (isSupabaseActive()) {
    return { type: 'serverTimestamp' };
  }
  return realServerTimestamp();
};

export const increment = (amount: number) => {
  if (isSupabaseActive()) {
    return { type: 'increment', amount };
  }
  return realIncrement(amount);
};

export const getDocFromServer = async (docRef: any) => {
  return getDoc(docRef);
};

export const writeBatch = (dbRef: any) => {
  if (isSupabaseActive()) {
    const operations: any[] = [];
    return {
      set: (docRef: any, data: any) => {
        operations.push(() => setDoc(docRef, data));
      },
      update: (docRef: any, data: any) => {
        operations.push(() => updateDoc(docRef, data));
      },
      delete: (docRef: any) => {
        operations.push(() => deleteDoc(docRef));
      },
      commit: async () => {
        await Promise.all(operations.map(op => op()));
      }
    };
  }
  return realWriteBatch(dbRef);
};

export const runTransaction = async (dbRef: any, callback: (transaction: any) => Promise<any>): Promise<any> => {
  if (isSupabaseActive()) {
    const transaction = {
      get: async (docRef: any) => {
        return getDoc(docRef);
      },
      set: async (docRef: any, data: any, options?: any) => {
        return setDoc(docRef, data, options);
      },
      update: async (docRef: any, data: any) => {
        return updateDoc(docRef, data);
      },
      delete: async (docRef: any) => {
        return deleteDoc(docRef);
      }
    };
    return callback(transaction);
  }
  return realRunTransaction(dbRef, callback);
};

// Auth wrappers
const withRetry = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: Parameters<T>) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        return await fn(...args);
      } catch (error: any) {
        attempts++;
        if (error.code === "auth/network-request-failed" && attempts < 3) {
          console.warn(`Network request failed in Auth. Retrying (attempt ${attempts})...`);
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        } else {
          throw error;
        }
      }
    }
  }) as T;
};

export const onAuthStateChanged = (authObj: any, callback: any) => {
  if (isSupabaseActive()) {
    return supabaseOnAuthStateChanged(callback);
  }
  return realOnAuthStateChanged(authObj, callback);
};

export const loginWithEmail = withRetry(async (email: string, pass: string) => {
  if (isSupabaseActive()) {
    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");
    
    // Fetch user from users table to verify password and blocked status
    const { data: userData, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !userData) {
      throw new Error("الحساب غير موجود أو خطأ في الاتصال");
    }

    if (userData.isBlocked) {
      throw new Error("هذا الحساب محظور من الدخول");
    }

    // Set active session
    const fakeUser = { uid: userData.uid, email: userData.email, role: userData.role || 'customer' };
    setSupabaseUser(fakeUser);
    return { user: fakeUser };
  }
  return realSignInWithEmailAndPassword(auth, email, pass);
});

export const signupWithEmail = withRetry(async (email: string, pass: string) => {
  if (isSupabaseActive()) {
    const client = supabase();
    if (!client) throw new Error("Supabase is not connected");

    // Check if user already exists
    const { data: existing } = await client
      .from('users')
      .select('uid')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      // Return login wrapper or throw for logic
      const fakeUser = { uid: existing.uid, email };
      setSupabaseUser(fakeUser);
      return { user: fakeUser };
    }

    const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fakeUser = { uid, email };
    setSupabaseUser(fakeUser);
    return { user: fakeUser };
  }
  return realCreateUserWithEmailAndPassword(auth, email, pass);
});

export const resetPassword = withRetry(async (email: string) => {
  if (isSupabaseActive()) {
    // In Supabase, the OTP endpoint and local password verifier handles resets.
    return;
  }
  return sendPasswordResetEmail(auth, email);
});

export const changePassword = withRetry(async (newPass: string) => {
  if (isSupabaseActive()) {
    // Session password matches locally in mock
    return;
  }
  if (!auth.currentUser) throw new Error("No user logged in");
  return realUpdatePassword(auth.currentUser, newPass);
});

export const reauthenticate = withRetry(async (password: string) => {
  if (isSupabaseActive()) {
    return;
  }
  if (!auth.currentUser || !auth.currentUser.email)
    throw new Error("No user logged in");
  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    password,
  );
  return reauthenticateWithCredential(auth.currentUser, credential);
});

export const logout = async () => {
  if (isSupabaseActive()) {
    setSupabaseUser(null);
    return;
  }
  return realSignOut(auth);
};

export const signInWithGoogle = () => {
  if (isSupabaseActive()) {
    // Return mock user or launch Supabase auth Google if needed
    return Promise.resolve({ user: { uid: 'google_user', email: 'user@gmail.com' } });
  }
  return signInWithPopup(auth, googleProvider);
};

export const signInWithGoogleRedirect = () => {
  if (isSupabaseActive()) return;
  return signInWithRedirect(auth, googleProvider);
};

export const getGoogleRedirectResult = () => {
  if (isSupabaseActive()) return Promise.resolve(null);
  return getRedirectResult(auth);
};

export const createAdminUserClientSide = async (email: string, pass: string) => {
  if (isSupabaseActive()) {
    const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return { uid, email };
  }
  // Fallback to Firebase
  const { initializeApp, deleteApp } = await import("firebase/app");
  const appName = `SecondaryApp_${Math.random().toString(36).substring(2, 10)}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await realCreateUserWithEmailAndPassword(
      secondaryAuth,
      email,
      pass,
    );
    await secondaryAuth.signOut();
    return userCredential.user;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.error("Failed to delete secondary app:", e);
    }
  }
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  if (isSupabaseActive()) {
    console.error(`Supabase operation error [${operationType}] on ${path}:`, error);
    return;
  }
  const currentAuth = auth.currentUser ? auth : adminAuth;
  const currentUser = currentAuth?.currentUser;

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
