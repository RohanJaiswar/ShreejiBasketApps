// firebase-messaging-sw.js
// Background push handler for FCM (Firebase Cloud Messaging)
// This file must be at the root of your web dir

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── REPLACE WITH YOUR FIREBASE CONFIG ──────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyC-_AegH7AFgFa3csz8v4NoXUCWouwm3Mc",
  authDomain:        "shreejibasket-ad367.firebaseapp.com",
  projectId:         "shreejibasket-ad367",
  storageBucket:     "shreejibasket-ad367.firebasestorage.app",
  messagingSenderId: "423656892911",
  appId:             "1:423656892911:android:281b33799dfd393e2fae1a"
};
// ────────────────────────────────────────────────────────────────────────────

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background push messages (app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'Shreeji Basket', {
    body:    body || '',
    icon:    icon || '/assets/icon-192.png',
    badge:   '/assets/icon-192.png',
    tag:     data.tag || 'shreeji-notif',
    data:    data,
    actions: [
      { action: 'open',    title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss'  }
    ]
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
