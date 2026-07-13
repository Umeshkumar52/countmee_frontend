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
  // Check if we have the minimum required config
  if (!firebaseConfig.apiKey) {
    console.warn(
      "[Firebase] Client initialization skipped. Missing VITE_FIREBASE_API_KEY in environment variables.",
    );
  }
  // Check if we are running in a supported browser context
  else if (
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

export const getFcmToken = async () => {
  if (!messaging) return null;

  try {
    if (Notification.permission === "granted") {
      const vapidKey =
        import.meta.env.VITE_FIREBASE_VAPID_KEY || "BFZ0G_DUMMY_VAPID_KEY";

      let isValidVapidKey = false;
      try {
        if (vapidKey && !vapidKey.includes("DUMMY") && vapidKey.length > 20) {
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

      let registration;
      try {
        registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        console.log(
          "[Firebase] Service Worker registered explicitly with scope:",
          registration.scope,
        );
      } catch (swError) {
        console.error(
          "[Firebase] Service Worker explicit registration failed:",
          swError,
        );
      }

      const fcmToken = await getToken(messaging, { 
        vapidKey,
        serviceWorkerRegistration: registration 
      });
      if (fcmToken) {
        console.log("[Firebase] Generated FCM Token:", fcmToken);
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
 * Request notification permissions and register token with backend
 */
export const requestFcmToken = async () => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[Firebase] User denied notification permission.");
          return null;
        }
      } catch (e) {
        console.error("Failed to request permission:", e);
      }
    }
  }

  const fcmToken = await getFcmToken();
  if (fcmToken) {
    try {
      // Upload token to backend via auth router
      await client.post("/auth/fcm-token", { fcmToken });
      console.log("[Firebase] FCM Token synced with backend.");
      return fcmToken;
    } catch (err) {
      console.error("[Firebase] Failed to sync FCM token:", err.message);
    }
  }
  return null;
};

export const onForegroundMessage = (onNotificationReceived) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log(
      "[Firebase] Foreground notification payload received:",
      payload,
    );
    if (typeof onNotificationReceived === "function") {
      onNotificationReceived({
        id: payload.data?.notification_id || Math.floor(Math.random() * 100000).toString(),
        title: payload.notification?.title || "Notification",
        message: payload.notification?.body || "",
        order_id: payload.data?.order_id || null,
        created_at: new Date().toISOString(),
      });
    }
  });
};
