import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Home, Coins, History, PhoneCall, Bell, Menu, Circle, LogOut, X } from "lucide-react";
import {
  logoutUser,
  toggleOnlineStatus,
  updatePdcDocumentState,
} from "../../features/auth/authSlice";
import {
  fetchNotifications,
  markAsRead,
} from "../../features/notifications/notificationSlice";
import useAuth from "../../hooks/useAuth";
import useGeolocation from "../../hooks/useGeolocation";
import { updatePdcLocationCoords } from "../../api/pdc.api";

export const PdcLayout = () => {
  const { user, pdcDocument } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Location alert banner feedback state
  const [locationStatus, setLocationStatus] = useState(null);

  const { notifications } = useSelector((state) => state.notifications);
  const unreadNotifs = notifications?.filter((n) => n.read_at === null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  const handleToggleOnline = async () => {
    if (!pdcDocument) return;
    const newStatus = pdcDocument.online === 1 ? 0 : 1;
    await dispatch(
      toggleOnlineStatus({ id: pdcDocument.id, online: newStatus }),
    );
  };

  const handleReadNotif = (id) => {
    dispatch(markAsRead(id));
  };

  // Run location updates if PDC is Online (online === 1)
  const isOnline = pdcDocument?.online === 1;

  const handleLocationUpdate = async (coords) => {
    try {
      await updatePdcLocationCoords({
        pdcAuthId: user.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setLocationStatus(
        `Location updated: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      );
      // Update local Redux state coordinate cache
      dispatch(
        updatePdcDocumentState({
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
        }),
      );

      // Auto-hide location banner after 3 seconds
      setTimeout(() => setLocationStatus(null), 3000);
    } catch (e) {
      console.error("Location update failed", e);
    }
  };

  const { error: geoError } = useGeolocation(isOnline, handleLocationUpdate);

  // Close menus on path navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const isKycVerified = Number(pdcDocument?.status) === 1;

  const pdcMenuItems = [
    { name: "Home", path: "/pdc/home", icon: <Home size={20} /> },
    { name: "Earning", path: "/pdc/earning", icon: <Coins size={20} /> },
    { name: "Order History", path: "/pdc/order_history", icon: <History size={20} /> },
    { name: "Contact us", path: "/pdc/contact_us", icon: <PhoneCall size={20} /> },
  ];

  // Onboarding pages get a simplified layout (no nav, no bottom bar)
  const onboardingPaths = [
    "/pdc/profile_setup",
    "/pdc/inner_registered",
    "/pdc/submit_pdc_documents",
    "/pdc/documentStatus",
  ];
  const isOnboardingPage = onboardingPaths.includes(location.pathname);

  return (
    <div
      className={`min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 ${isOnboardingPage ? "" : "pb-20 lg:pb-0"}`}
    >
      {/* Geolocation Alert Messages banner */}
      {locationStatus && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-slate-900/90 text-brand-success text-xs font-semibold px-4 py-2 rounded-full z-50 shadow-md">
          🟢 {locationStatus}
        </div>
      )}
      {geoError && isOnline && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-xs font-semibold px-4 py-2 rounded-full z-50 shadow-md">
          ⚠️ {geoError}
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#522e90] border-b-[3px] border-[#4a2a82] text-white shadow-[0_4px_6px_rgba(0,0,0,0.1)] rounded-b-[15px]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-[100px]">
            {/* Mobile Sidebar toggle button — hide on onboarding */}
            {!isOnboardingPage && (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
              >
                <Menu size={28} />
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/countMe_logo.png"
                alt="CountMee Logo"
                className="w-[120px] h-[70px] object-contain bg-white rounded-[10px] p-2 select-none shadow-sm"
              />
            </div>

            {/* Desktop Navigation Links — hidden during onboarding */}
            {!isOnboardingPage && (
              <nav className="hidden lg:flex items-center justify-evenly flex-1 mx-8">
                {pdcMenuItems.slice(0, 2).map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `text-base font-normal flex items-center gap-1.5 px-3 transition-colors ${
                        isActive
                          ? "bg-[#e7edfe] text-[#5d87ff] h-[37px] rounded-[7px]"
                          : "text-white/80 hover:text-white"
                      }`
                    }
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </NavLink>
                ))}

                {/* Online/Offline status Toggle */}
                {pdcDocument && (
                  <button
                    onClick={handleToggleOnline}
                    className={`px-4 py-2 rounded-[6px] text-[15px] font-[500] transition-all flex items-center gap-2 cursor-pointer border-0 ${
                      isOnline
                        ? "bg-[#522e90] text-white"
                        : "bg-[#212529] text-white"
                    }`}
                  >
                    {isOnline ? (
                      <>
                        Online <Circle fill="white" strokeWidth={0} size={20} />
                      </>
                    ) : (
                      <>
                        <Circle fill="#dc3545" strokeWidth={0} size={20} /> Offline
                      </>
                    )}
                  </button>
                )}

                {pdcMenuItems.slice(2).map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `text-base font-normal flex items-center gap-1.5 px-3 transition-colors ${
                        isActive
                          ? "bg-[#e7edfe] text-[#5d87ff] h-[37px] rounded-[7px]"
                          : "text-white/80 hover:text-white"
                      }`
                    }
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* User notifications & profile */}
            <div className="flex items-center gap-4">
              {/* Notification drop list */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg relative transition-colors"
                >
                  <Bell size={24} />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 text-slate-800 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        <span className="text-xs bg-brand-purple-soft text-brand-purple px-2 py-0.5 rounded-full font-medium">
                          {unreadNotifs.length} new
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No notifications found
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleReadNotif(notif.id)}
                              className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                                notif.read_at === null ? "bg-indigo-50/30" : ""
                              }`}
                            >
                              <h5 className="font-semibold text-xs text-slate-800">
                                {notif.title}
                              </h5>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(notif.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-1.5 p-1 hover:bg-white/10 rounded-lg transition-colors border border-transparent"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-200 overflow-hidden flex items-center justify-center">
                    <span className="text-brand-purple font-bold text-xs uppercase">
                      {user?.name?.slice(0, 2) || "PD"}
                    </span>
                  </div>
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 text-slate-800 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
                      <div className="p-4 border-b border-slate-100 text-left">
                        <p className="font-semibold text-sm text-slate-800">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500">{user?.phone}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                        {pdcDocument && (
                          <div className="mt-2 flex items-center justify-between text-[11px] font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-slate-500">KYC Status:</span>
                            <span
                              className={`capitalize ${isOnline ? "text-emerald-600 font-bold" : "text-slate-600"}`}
                            >
                              {pdcDocument.aadhar_status === "approved"
                                ? "Verified"
                                : "Pending"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-medium"
                        >
                          <LogOut size={16} /> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Offcanvas Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed top-0 bottom-0 left-0 w-64 bg-white shadow-xl flex flex-col z-50 page-transition">
            <div className="h-[100px] px-6 bg-[#522e90] text-white flex items-center justify-between border-b-[3px] border-[#4a2a82]">
              <span className="text-lg font-bold">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={28} />
              </button>
            </div>

            {/* Quick Online Status toggle on mobile drawer */}
            {pdcDocument && (
              <div className="p-4 border-b border-slate-100">
                <button
                  onClick={handleToggleOnline}
                  className={`w-full py-2.5 rounded-[6px] text-[15px] font-[500] transition-all flex items-center justify-center gap-2 border-0 ${
                    isOnline
                      ? "bg-[#522e90] text-white"
                      : "bg-[#212529] text-white"
                  }`}
                >
                  {isOnline ? (
                    <>
                      Online <Circle fill="white" strokeWidth={0} size={20} />
                    </>
                  ) : (
                    <>
                      <Circle fill="#dc3545" strokeWidth={0} size={20} /> Offline
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {pdcMenuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-normal transition-colors ${
                      isActive
                        ? "bg-brand-purple-soft text-brand-purple"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Sticky Navigation Bar — hidden during onboarding */}
      {!isOnboardingPage && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#9073be] to-[#522f89] text-white h-16 border-t border-white/10 flex lg:hidden shadow-lg rounded-t-2xl overflow-hidden">
          {pdcMenuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? "bg-white/10 text-white font-bold"
                    : "text-white/70 text-xs"
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </NavLink>
          ))}
        </footer>
      )}
    </div>
  );
};

export default PdcLayout;
