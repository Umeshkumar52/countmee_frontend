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
  Radio,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import {
  fetchNotifications,
  markAsRead,
} from "../../features/notifications/notificationSlice";
import useAuth from "../../hooks/useAuth";
import { fetchDashboard } from "../../api/admin.api";
import { fetchScheduledStats, fetchActiveBundles } from "../../api/orders.api";
import toast from "react-hot-toast";

export const AdminLayout = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [metrics, setMetrics] = useState({
    deliveryPartnersCount: 0,
    customersCount: 0,
    pdcsCount: 0,
    ordersCount: 0,
    totalScheduled: 0,
    scheduledPending: 0,
    scheduledCompleted: 0,
    activeBundles: 0,
  });

  const { notifications } = useSelector((state) => state.notifications);
  const unreadNotifs = notifications.filter((n) => n.read_at === null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [dashRes, schedRes, bundlesRes] = await Promise.all([
          fetchDashboard(),
          fetchScheduledStats(),
          fetchActiveBundles(),
        ]);
        const dData = dashRes.data.data || dashRes.data;
        setMetrics({
          deliveryPartnersCount: dData.deliveryPartnerCount || 0,
          customersCount: dData.customersCount || 0,
          pdcsCount: dData.pdcCount || 0,
          ordersCount: dData.ordersCount || 0,
          totalScheduled: schedRes?.total || 0,
          scheduledPending: schedRes?.pending || 0,
          scheduledCompleted: schedRes?.completed || 0,
          activeBundles: bundlesRes?.bundles?.length || 0,
        });
      } catch (e) {
        console.error("Failed to fetch global metrics", e);
        toast.error("Failed to fetch global metrics");
      }
    };
    fetchAllStats();
  }, []); // Refresh stats on navigation

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
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Desktop Left Sidebar */}
      <aside className="hidden xl:flex flex-col w-64 bg-white border-r border-slate-100 flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center">
            <img
              src="/countMe_logo.png"
              alt="CountMee Logo"
              className="h-10 object-contain select-none"
            />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar">
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
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header / Metrics Bar */}
        <header className="flex-shrink-0 z-40 bg-white border-b border-slate-100 shadow-sm py-2 px-4 sm:px-6 flex justify-between items-center min-h-[64px]">
          {/* Mobile Hamburger & Logo (Visible only on small screens) */}
          <div className="flex items-center xl:hidden gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <span className="text-xl">☰</span>
            </button>
            <Link to="/admin/dashboard" className="flex items-center">
              <img
                src="/countMe_logo.png"
                alt="CountMee Logo"
                className="h-8 object-contain select-none"
              />
            </Link>
          </div>

          {/* Global Metrics Cards (Scrolls horizontally if needed) */}
          <div className="flex flex-1 items-center gap-3 overflow-x-auto hide-scrollbar px-4">
            <div
              className="flex items-center gap-3 bg-blue-50/50 border border-blue-200 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-blue-100"
              onClick={() => navigate("/admin/scheduled-orders")}
            >
              <CalendarClock size={14} className="text-blue-700" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  Scheduled
                  {/* <span className=" text-slate-800 leading-none">
                    {metrics.totalScheduled} Total
                  </span> */}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-800 leading-none">
                    {metrics.totalScheduled} Total
                  </span>
                  <span className="text-slate-300 mx-0.5 leading-none">|</span>
                  <span className="text-xs font-semibold text-orange-600 leading-none whitespace-nowrap">
                    Pending: {metrics.scheduledPending}
                  </span>
                  <span className="text-slate-300 mx-0.5 leading-none">|</span>
                  <span className="text-xs font-semibold text-emerald-600 leading-none whitespace-nowrap">
                    Completed: {metrics.scheduledCompleted}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-rose-50/50 border border-rose-200 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-rose-100"
              onClick={() => navigate("/admin/scheduled-orders/broadcasts")}
            >
              <Radio size={14} className="text-rose-700" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  Broadcasts
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none mt-1">
                  {metrics.activeBundles}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-orange-50/50 border border-orange-100 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-orange-50"
              onClick={() => navigate("/admin/orders")}
            >
              <Package size={14} className="text-orange-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  Orders
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none mt-1">
                  {metrics.ordersCount}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-purple-50/50 border border-purple-100 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-purple-50"
              onClick={() => navigate("/admin/delivery-partners")}
            >
              <Truck size={14} className="text-purple-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  Partners
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none mt-1">
                  {metrics.deliveryPartnersCount}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-blue-50"
              onClick={() => navigate("/admin/customers")}
            >
              <Users size={14} className="text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  Customers
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none mt-1">
                  {metrics.customersCount}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer hover:bg-emerald-50"
              onClick={() => navigate("/admin/pdc-list")}
            >
              <Warehouse size={14} className="text-emerald-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none">
                  PDC
                </span>
                <span className="text-sm font-bold text-slate-800 leading-none mt-1">
                  {metrics.pdcsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
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
                              {new Date(notif.created_at).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                },
                              )}
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
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />

          {/* Footer */}
          <footer className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CountMee. All rights reserved.
          </footer>
        </main>
      </div>

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
    </div>
  );
};

export default AdminLayout;
