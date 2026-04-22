// Give the service worker access to Firebase Messaging.
// Note: This file must be served from the root of your domain.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// Use the values from your firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyDyRzyh2uDUWqz-BpwK_LK2AQJh8U0fz1s",
  authDomain: "gen-lang-client-0484519852.firebaseapp.com",
  projectId: "gen-lang-client-0484519852",
  storageBucket: "gen-lang-client-0484519852.firebasestorage.app",
  messagingSenderId: "339149421138",
  appId: "1:339149421138:web:db601d277f2108e92ebd8b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo192.png',
    image: payload.data.image || payload.notification.image, // Support rich images
    data: {
      url: payload.data.url || '/' // Support redirect link
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the link provided in the notification data
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
