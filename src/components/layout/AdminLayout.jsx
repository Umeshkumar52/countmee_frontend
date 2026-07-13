import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Warehouse,
  Megaphone,
  Package,
  MessageSquareWarning,
  Landmark,
  Wallet,
  FileBarChart2,
  BadgeIndianRupee,
  Bell,
  Car,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import {
  fetchNotifications,
  markAsRead,
} from "../../features/notifications/notificationSlice";
import useAuth from "../../hooks/useAuth";

export const AdminLayout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { notifications } = useSelector((state) => state.notifications);
  const unreadNotifs = notifications.filter((n) => n.read_at === null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/adminlogin");
  };

  const handleReadNotif = (id) => {
    dispatch(markAsRead(id));
  };

  // Close menus on page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "DeliveryPartners", path: "/admin/delivery-partners", icon: Truck },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "PDC", path: "/admin/pdc-list", icon: Warehouse },
    { name: "Broadcast", path: "/admin/broadcast", icon: Megaphone },
    { name: "Orders", path: "/admin/orders", icon: Package },
    {
      name: "Scheduled Orders",
      path: "/admin/scheduled-orders",
      icon: CalendarClock,
    },
    { name: "Feedbacks", path: "/admin/feedbacks", icon: MessageSquareWarning },
    { name: "Finance", path: "/admin/finance", icon: FileBarChart2 },
    { name: "Wallets", path: "/admin/wallets", icon: Wallet },
    { name: "Reports", path: "/admin/reports", icon: Landmark },
    { name: "Charges", path: "/admin/charges", icon: BadgeIndianRupee },
    { name: "Vehicles", path: "/admin/vehicles", icon: Car },
    { name: "Cancellations", path: "/admin/cancellations", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 py-4 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="flex items-center">
                <img
                  src="/countMe_logo.png"
                  alt="CountMee Logo"
                  className="size-22 object-contain select-none"
                />
              </Link>
            </div>

            {/* Desktop Navbar menu */}
            <nav className="hide-scrollbar hidden xl:flex overflow-x-auto space-x-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-brand-purple-soft text-brand-purple"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>

            {/* Topbar Actions */}
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsProfileOpen(false);
                  }}
                  className="p-2 text-slate-500 hover:text-brand-purple hover:bg-slate-50 rounded-lg relative transition-colors"
                >
                  <Bell size={20} />

                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsNotifOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
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
                              key={notif._id || notif.id}
                              onClick={() =>
                                handleReadNotif(notif._id || notif.id)
                              }
                              className={`p-3 text-left my-2  transition-colors cursor-pointer ${
                                notif.read_at === null ? "bg-green-50" : ""
                              }`}
                            >
                              <h5 className="font-semibold text-xs text-slate-800">
                                {notif.title}
                              </h5>
                              <p className="text-slate-500 text-[11px] mt-0.5">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(notif.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-purple-light flex items-center justify-center text-white font-bold text-sm">
                    A
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-700">
                    Admin
                  </span>
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden page-transition">
                      <div className="p-4 border-b border-slate-100 text-left">
                        <p className="font-semibold text-sm text-slate-800">
                          Admin User
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-medium"
                        >
                          <span>🚪</span> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <span className="text-xl">☰</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Offcanvas */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed top-0 bottom-0 left-0 w-64 bg-white shadow-xl flex flex-col z-50 page-transition">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
              <span className="text-lg font-bold text-brand-purple">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-brand-purple-soft text-brand-purple"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CountMee. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
