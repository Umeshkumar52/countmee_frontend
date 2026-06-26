// Import and configure the Firebase SDK inside the service worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

// Initialize the Firebase app in the service worker by passing VAPID configuration
firebase.initializeApp({
  apiKey: "AIzaSyBnLlM15Hj1FwjUfqf4_fgI384r-0_mIf0",
  authDomain: "countmee-cd2e5.firebaseapp.com",
  projectId: "countmee-cd2e5",
  storageBucket: "countmee-cd2e5.firebasestorage.app",
  messagingSenderId: "596364310462",
  appId: "1:596364310462:web:20c3fe763b7146b6852bef",
  measurementId: "G-W1CX986CH6",
});

const messaging = firebase.messaging();

// Customize background notification handling
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload,
  );

  const notificationTitle =
    payload.notification?.title || "CountMee Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new update.",
    icon: "/logo.png", // Fallback icon path
    badge: "/badge.png", // Fallback badge path
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
