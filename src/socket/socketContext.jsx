import { createContext, useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
  requestFcmToken,
  onForegroundMessage,
} from "../firebase/firebaseConfig";


const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !user) {
      setSocket((prevSocket) => {
        if (prevSocket && typeof prevSocket.disconnect === "function") {
          prevSocket.disconnect();
        }
        return null;
      });
      return;
    }

    const baseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:3008/api"
    ).replace(/\/api\/?$/, "");
    
    const newSocket = io(baseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to real-time notifications server");
    });

    // Set up standard notification listener
    const handleNotification = (notif) => {
      // Normalize array payload from socket to a single object to match FCM
      const normalizedNotif = Array.isArray(notif) ? notif[0] : notif;

      // Direct reducer dispatch to append
      dispatch({ type: "notifications/addNotification", payload: normalizedNotif });

      // Show native system notification if permission is granted
      if (Notification.permission === "granted") {
        new Notification(normalizedNotif.title || "New Notification", {
          body: normalizedNotif.message || "",
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

    newSocket.on("notification:received", handleNotification);

    // Initialize Firebase FCM token request and foreground messaging listener
    requestFcmToken();
    const unsubscribeFCM = onForegroundMessage(handleNotification);

    return () => {
      if (typeof unsubscribeFCM === "function") {
        unsubscribeFCM();
      }
      if (newSocket) {
        newSocket.off("notification:received", handleNotification);
        if (typeof newSocket.disconnect === "function") {
          newSocket.disconnect();
        }
      }
      setSocket(null);
    };
  }, [token, user, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketInstance = () => {
  return useContext(SocketContext);
};
