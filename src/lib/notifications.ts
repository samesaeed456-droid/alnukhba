import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { db, auth } from "./firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

// VAPID key is required for Web Push.
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

if (!VAPID_KEY) {
  console.warn("FCM VAPID Key is missing! Push notifications registration will fail. Please add VITE_FIREBASE_VAPID_KEY to your environment variables.");
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    return await setupNotifications();
  }
  return false;
}

export async function refreshNotificationToken() {
  if (!("Notification" in window) || Notification.permission !== 'granted') {
    return false;
  }
  return await setupNotifications();
}

async function setupNotifications() {
  try {
    const { messaging } = await import("./firebase");
    if (!messaging) return false;

    // Register service worker if not already done
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token current:', token);
        const savedToken = localStorage.getItem('fcm_token');
        // Only save if it's a new token or if we haven't associated it with the current user
        if (token !== savedToken || auth.currentUser) {
          await saveToken(token);
        }
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to setup notifications:', err);
  }
  return false;
}

async function saveToken(token: string) {
  const user = auth.currentUser;
  
  // Save to general tokens collection for anonymous/guest users
  const tokenRef = doc(db, 'notification_tokens', token);
  await setDoc(tokenRef, {
    token,
    uid: user?.uid || null,
    updatedAt: new Date().toISOString(),
    platform: 'web'
  }, { merge: true });

  // If user is logged in, also add to their user document
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      fcmTokens: arrayUnion(token),
      notificationsEnabled: true
    }, { merge: true });
  }

  // Store locally to avoid re-saving unnecessarily
  localStorage.setItem('fcm_token', token);
}

// Handle foreground messages
export async function onForegroundMessage() {
  try {
    const { messaging } = await import("./firebase");
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      
      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      const isAdminAuth = typeof window !== 'undefined' && window.localStorage.getItem('admin_auth') === 'true';
      if (isAdminPath || isAdminAuth) {
        console.log('Foreground message blocked for admin to avoid cluttering control panel.');
        return;
      }

      if (payload.notification) {
        const { title, body, icon } = payload.notification;
        // Use payload.data for deep link and images in foreground
        const urlToOpen = payload.data?.url || '/';
        const imageUrl = payload.data?.image || payload.notification.image;

        new Notification(title || 'إشعار جديد', {
          body,
          icon: icon || '/icon-192x192.png',
          image: imageUrl,
          data: { url: urlToOpen }
        } as any);
      }
    });
  } catch (err) {
    console.error('Error in onForegroundMessage:', err);
  }
}
