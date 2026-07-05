import { createContext, useContext, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
  requestFcmToken,
  onForegroundMessage,
} from "../firebase/firebaseConfig";
import { ROLES } from "../constants";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        if (typeof socketRef.current.disconnect === "function") {
          socketRef.current.disconnect();
        }
        socketRef.current = null;
      }
      return;
    }

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:3008/api"
    ).replace(/\/api\/?$/, "");
    
    socketRef.current = io(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("[Socket] Connected to real-time notifications server");
    });

    // Set up standard notification listener
    const handleNotification = (notif) => {
      // Direct reducer dispatch to append
      dispatch({ type: "notifications/addNotification", payload: notif });

      // Show native system notification if permission is granted
      if (Notification.permission === "granted") {
        new Notification(notif.title || "New Notification", {
          body: notif.message || "",
          icon: "/countMe_logo.png",
        });
      }

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
    requestFcmToken();
    const unsubscribeFCM = onForegroundMessage(handleNotification);

    return () => {
      if (typeof unsubscribeFCM === "function") {
        unsubscribeFCM();
      }
      if (socketRef.current) {
        socketRef.current.off("notification:received", handleNotification);
        if (typeof socketRef.current.disconnect === "function") {
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
