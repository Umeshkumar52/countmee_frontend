import React, { useEffect } from "react";
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
      <AppRoutes />
    </div>
  );
}

export default App;
