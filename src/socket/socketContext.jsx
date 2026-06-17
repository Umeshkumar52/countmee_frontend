import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { addNotification } from "../features/notifications/notificationSlice";
import { requestFcmToken, onForegroundMessage } from "../firebase/firebaseConfig";

const USE_MOCK = false;

const SocketContext = createContext(null);

class MockSocket {
  constructor() {
    this.listeners = {};
  }
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback,
    );
  }
  emit(event, data) {
    console.log(`[MockSocket] Emit '${event}':`, data);
  }
  // Helper to simulate incoming event from server
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        if (!USE_MOCK && typeof socketRef.current.disconnect === "function") {
          socketRef.current.disconnect();
        }
        socketRef.current = null;
      }
      return;
    }

    if (USE_MOCK) {
      const mockSocket = new MockSocket();
      socketRef.current = mockSocket;
      console.log("[Socket] Initialized Mock Socket Connection");

      // Hook up global test helpers
      window.triggerMockNotification = (title, message) => {
        const newNotif = {
          id: Math.floor(Math.random() * 100000),
          notifiable_type: user.role === "admin" ? "admin" : "pdc",
          user_id: user.id,
          title,
          message,
          read_at: null,
          created_at: new Date().toISOString(),
        };
        mockSocket.trigger("notification:received", newNotif);
      };

      window.triggerMockOrderAssign = (order) => {
        mockSocket.trigger("order:assigned", order);
      };
    } else {
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3008/api").replace(/\/api\/?$/, "");
      socketRef.current = io(baseUrl, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => {
        console.log("[Socket] Connected to real-time notifications server");
      });
    }

    // Set up standard notification listener
    const handleNotification = (notif) => {
      // Direct reducer dispatch to append
      dispatch({ type: "notifications/addNotification", payload: notif });

      // Play a soft beep sound
      try {
        const audio = new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav",
        );
        audio.volume = 0.2;
        audio.play();
      } catch (e) {
        console.log("Audio autoplay blocked by browser policy");
      }
    };

    socketRef.current.on("notification:received", handleNotification);

    // Initialize Firebase FCM token request and foreground messaging listener
    let unsubscribeFCM = null;
    if (!USE_MOCK) {
      requestFcmToken();
      unsubscribeFCM = onForegroundMessage(handleNotification);
    }

    return () => {
      if (typeof unsubscribeFCM === "function") {
        unsubscribeFCM();
      }
      if (socketRef.current) {
        socketRef.current.off("notification:received", handleNotification);
        if (!USE_MOCK && typeof socketRef.current.disconnect === "function") {
          socketRef.current.disconnect();
        }
        socketRef.current = null;
      }
    };
  }, [token, user, dispatch]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketInstance = () => {
  return useContext(SocketContext);
};
