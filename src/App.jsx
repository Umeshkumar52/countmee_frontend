import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("[Firebase] Notification permission granted");
        } else {
          console.log(`[Firebase] Notification permission ${permission}`);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Toaster position="top-right" />
      <AppRoutes />
    </div>
  );
}

export default App;
