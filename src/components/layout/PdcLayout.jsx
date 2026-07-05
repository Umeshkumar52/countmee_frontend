import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  Coins,
  History,
  PhoneCall,
  Bell,
  Menu,
  Circle,
  LogOut,
  X,
  MapPin,
  CheckCircle2,
  CheckCheck,
} from "lucide-react";
import { logoutUser, toggleOnlineStatus } from "../../features/auth/authSlice";
import {
  fetchNotifications,
  markAsRead,
} from "../../features/notifications/notificationSlice";
import useAuth from "../../hooks/useAuth";
import { updatePdcLocationCoords } from "../../api/pdc.api";
import Modal from "../common/Modal";
import Button from "../common/Button";

export const PdcLayout = () => {
  const { user, pdcDocument, isKycVerified } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationUpdateSuccess, setLocationUpdateSuccess] = useState(false);
  const { notifications } = useSelector((state) => state.notifications);
  const unreadNotifs = notifications?.filter((n) => n.read_at === null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  // Run location updates if PDC is Online
  const isOnline = pdcDocument?.online === true;

  const handleToggleOnline = async () => {
    if (!pdcDocument) return;
    const docId = pdcDocument._id || pdcDocument.id;
    if (!docId) {
      console.error("Missing PDC Document ID. Cannot toggle online status.");
      return;
    }

    const newStatus = !isOnline;
    await dispatch(toggleOnlineStatus({ id: docId, online: newStatus }));
  };

  const handleReadNotif = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    unreadNotifs.forEach((notif) => {
      dispatch(markAsRead(notif._id || notif.id));
    });
  };

  const handleUpdateLocationClick = () => {
    setIsProfileOpen(false);
    setIsLocationModalOpen(true);
    setLocationUpdateSuccess(false);
  };

  const confirmLocationUpdate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updatePdcLocationCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationUpdateSuccess(true);
        } catch (error) {
          alert(error.response?.data?.message || "Failed to update location");
        } finally {
          setIsUpdatingLocation(false);
        }
      },
      (error) => {
        setIsUpdatingLocation(false);
        alert(
          "Failed to get location. Please ensure location permissions are granted.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Close menus on path navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const pdcMenuItems = [
    { name: "Home", path: "/pdc/home", icon: <Home size={20} /> },
    { name: "Earning", path: "/pdc/earning", icon: <Coins size={20} /> },
    {
      name: "Order History",
      path: "/pdc/order_history",
      icon: <History size={20} />,
    },
    {
      name: "Contact us",
      path: "/pdc/contact_us",
      icon: <PhoneCall size={20} />,
    },
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
                        <Circle fill="#dc3545" strokeWidth={0} size={20} />{" "}
                        Offline
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
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 text-slate-800 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                        {unreadNotifs.length > 0 && (
                          <span className="text-xs bg-brand-purple-soft text-brand-purple px-2 py-0.5 rounded-full font-medium">
                            {unreadNotifs.length} new
                          </span>
                        )}
                      </div>
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[11px] text-brand-purple hover:text-brand-purple-dark font-medium flex items-center gap-1 transition-colors"
                          title="Mark all as read"
                        >
                          <CheckCheck size={14} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          No notifications found
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id || notif.id}
                            className={`p-3 text-left transition-colors relative group ${
                              notif.read_at === null
                                ? "bg-indigo-50/30 hover:bg-indigo-50/50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-xs text-slate-800 pr-6">
                                  {notif.title}
                                </h5>
                                <p className="text-slate-500 text-[11px] mt-0.5">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-400 block mt-1">
                                  {new Date(
                                    notif.created_at,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              {notif.read_at === null && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReadNotif(notif._id || notif.id);
                                  }}
                                  className="text-slate-300 hover:text-brand-purple p-1 rounded-full hover:bg-brand-purple-soft transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Mark as read"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
                    {pdcDocument?.profile_image ? (
                      <img
                        src={pdcDocument.profile_image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-brand-purple font-bold text-xs uppercase">
                        {user?.name?.slice(0, 2) || "PD"}
                      </span>
                    )}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 text-slate-800 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
                    <div className="p-4 border-b border-slate-100 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full border border-slate-200 bg-indigo-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {pdcDocument?.profile_image ? (
                          <img
                            src={pdcDocument.profile_image}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-brand-purple font-bold text-sm uppercase">
                            {user?.name?.slice(0, 2) || "PD"}
                          </span>
                        )}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.phone}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {pdcDocument && (
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500">KYC Status:</span>
                          <span
                            className={`capitalize ${isKycVerified ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}`}
                          >
                            {isKycVerified ? "Verified" : "Pending"}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      {isKycVerified && (
                        <button
                          onClick={handleUpdateLocationClick}
                          className="w-full text-left px-3 py-2 text-sm text-brand-purple hover:bg-brand-purple-soft rounded-lg flex items-center gap-2 transition-colors font-medium"
                        >
                          <MapPin size={16} /> Update Exact Location
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut size={16} /> Log Out
                      </button>
                    </div>
                  </div>
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
                      <Circle fill="#dc3545" strokeWidth={0} size={20} />{" "}
                      Offline
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

      {/* Location Confirmation Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => {
          if (!isUpdatingLocation) setIsLocationModalOpen(false);
        }}
        title={
          locationUpdateSuccess ? "Success!" : "Update Exact Store Location"
        }
        size="md"
      >
        <div className="p-2 text-center">
          {locationUpdateSuccess ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Location Updated
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Your precise GPS coordinates have been saved successfully.
                Delivery partners will now be able to find your store more
                easily.
              </p>
              <Button
                onClick={() => setIsLocationModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-left">
              <div className="w-16 h-16 bg-brand-purple-soft rounded-full flex items-center justify-center mb-4 text-brand-purple">
                <MapPin size={32} />
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed text-center">
                To ensure delivery partners can navigate directly to your
                storefront without any confusion, we need to capture your exact
                GPS coordinates.
              </p>
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold p-3 rounded-lg mb-6 text-center w-full">
                ⚠️ Please ensure you are currently standing inside your PDC
                location before proceeding.
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLocationModalOpen(false)}
                  disabled={isUpdatingLocation}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmLocationUpdate}
                  isLoading={isUpdatingLocation}
                  className="flex-1 bg-brand-purple hover:bg-brand-purple-dark text-white"
                >
                  {isUpdatingLocation ? "Capturing..." : "Confirm & Capture"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PdcLayout;
