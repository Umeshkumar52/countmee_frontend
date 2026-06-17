import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import client from "../api/client";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

try {
  // Check if we are running in a supported browser context
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  ) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } else {
    console.warn(
      "[Firebase] Push messaging is not supported in this browser environment.",
    );
  }
} catch (e) {
  console.warn(
    "[Firebase] Client initialization failed or unsupported in this browser.",
    e.message,
  );
}

export { app, messaging };

/**
 * Request notification permissions and register token with backend
 */
export const requestFcmToken = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const vapidKey =
        import.meta.env.VITE_FIREBASE_VAPID_KEY || "BFZ0G_DUMMY_VAPID_KEY";

      // Pre-validate vapidKey to prevent Firebase's internal atob() from throwing uncaught/noisy errors
      let isValidVapidKey = false;
      try {
        if (vapidKey && !vapidKey.includes("DUMMY") && vapidKey.length > 20) {
          // base64url decode test
          const standardBase64 =
            vapidKey.replace(/-/g, "+").replace(/_/g, "/") +
            "=".repeat((4 - (vapidKey.length % 4)) % 4);
          window.atob(standardBase64);
          isValidVapidKey = true;
        }
      } catch {
        // Not a valid base64url string
      }

      if (!isValidVapidKey) {
        console.warn(
          "[Firebase] FCM registration skipped: VAPID key is missing or invalid.",
        );
        return null;
      }

      const fcmToken = await getToken(messaging, { vapidKey });
      if (fcmToken) {
        console.log("[Firebase] Registered FCM Token:", fcmToken);
        // Upload token to backend via auth router
        await client.post("/auth/fcm-token", { fcmToken });
        return fcmToken;
      }
    } else {
      console.warn("[Firebase] Notification permission denied by user.");
    }
  } catch (err) {
    console.error(
      "[Firebase] Error retrieving FCM registration token:",
      err.message,
    );
  }
  return null;
};

/**
 * Setup foreground notification listener
 * @param {function} onNotificationReceived
 */
export const onForegroundMessage = (onNotificationReceived) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log(
      "[Firebase] Foreground notification payload received:",
      payload,
    );
    if (typeof onNotificationReceived === "function") {
      onNotificationReceived({
        title: payload.notification?.title || "Notification",
        message: payload.notification?.body || "",
        order_id: payload.data?.order_id || null,
        created_at: new Date().toISOString(),
      });
    }
  });
};
