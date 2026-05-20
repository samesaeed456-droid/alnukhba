import { db, auth, doc, setDoc, arrayUnion, serverTimestamp } from "./firebase";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    return await setupNotifications();
  }
  return false;
}

export async function refreshNotificationToken() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }
  return await setupNotifications();
}

async function setupNotifications() {
  try {
    const mockToken = "local_notify_token_" + Math.random().toString(36).substring(2);
    console.log("Local browser notification permission granted.");
    const savedToken = localStorage.getItem("fcm_token");
    if (!savedToken || auth.currentUser) {
      await saveToken(savedToken || mockToken);
    }
    return true;
  } catch (err: any) {
    console.error("Failed to setup notifications:", err);
  }
  return false;
}

async function saveToken(token: string) {
  const user = auth.currentUser;

  // Save to general tokens collection for anonymous/guest users
  const tokenRef = doc(db, "notification_tokens", token);
  await setDoc(
    tokenRef,
    {
      token,
      uid: user?.uid || null,
      updatedAt: serverTimestamp(),
      platform: "web",
    },
    { merge: true },
  ).catch(() => {});

  // If user is logged in, also add to their user document
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        fcmTokens: arrayUnion(token),
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {});
  }

  // Store locally to avoid re-saving unnecessarily
  localStorage.setItem("fcm_token", token);
}

// Handle foreground messages optionally (can be a lightweight local wrapper or no-op)
export async function onForegroundMessage() {
  console.log("Local notification listener activated in foreground.");
}
