// Import and configure the Firebase SDK inside the service worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

// Initialize the Firebase app in the service worker by passing VAPID configuration
firebase.initializeApp({
  apiKey: "AIzaSyD_LmxwI7934gOCqoUMI-iuYnY5QHvn_CI",
  authDomain: "countmee-cf825.firebaseapp.com",
  projectId: "countmee-cf825",
  storageBucket: "countmee-cf825.firebasestorage.app",
  messagingSenderId: "259581174185",
  appId: "1:259581174185:web:cfbe068f080fe314a8e4b8",
  measurementId: "G-6TQ7L0XQF4",
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
