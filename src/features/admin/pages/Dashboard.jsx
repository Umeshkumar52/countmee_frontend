import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchDashboard } from "../../../api/admin.api";
import Badge from "../../../components/common/Badge";
import { Truck, Building2, Warehouse, User, Package } from "lucide-react";

const AnimatedCounter = ({ end, duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);

      setCount(Math.floor(easeOutQuad * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
};

export const Dashboard = () => {
  const [stats, setStats] = useState({
    deliveryPartnersCount: 0,
    customersCount: 0,
    pdcsCount: 0,
    ordersCount: 0,
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDashboard();
        const data = response.data.data || response.data;
        setStats({
          deliveryPartnersCount: data.deliveryPartnerCount || 0,
          customersCount: data.customersCount || 0,
          pdcsCount: data.pdcCount || 0,
          ordersCount: data.ordersCount || 0,
          recentOrders: (data.rec_orders || []).slice(0, 5).map((o) => ({
            id: o._id,
            orderNumber: o.orderNumber || `order_${o._id?.slice(0, 10)}`,
            order_number: o.order_id || o._id,
            customer_name: o.user_id?.name || o.sender_name || "N/A",
            pdc_name: o.pdc_id?.shop_name || "Direct",
            date: o.createdAt
              ? new Date(o.createdAt).toLocaleDateString()
              : "N/A",
            status: o.status,
          })),
        });
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      name: "Delivery Partners",
      count: stats.deliveryPartnersCount,
      color: "bg-purple-50/50 border-purple-200 hover:bg-purple-50 hover:border-purple-300",
      textColor: "text-purple-700",
      link: "/admin/delivery-partners",
      icon: Truck,
    },
    {
      name: "Active Customers",
      count: stats.customersCount,
      color: "bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:border-blue-300",
      textColor: "text-blue-700",
      link: "/admin/customers",
      icon: User,
    },
    {
      name: "PDC Centers",
      count: stats.pdcsCount,
      color: "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300",
      textColor: "text-emerald-700",
      link: "/admin/pdc-list",
      icon: Building2,
    },
    {
      name: "Total Orders",
      count: stats.ordersCount,
      color: "bg-orange-50/50 border-orange-200 hover:bg-orange-50 hover:border-orange-300",
      textColor: "text-orange-700",
      link: "/admin/orders",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">
          Overview of CountMee platform metrics and operations
        </p>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const { icon: Icon } = card;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`flex flex-col items-center justify-center p-5 border rounded-xl cursor-pointer transition-all transform hover:-translate-y-0.5 ${card.color} hover:shadow-md text-center`}
            >
              <div className={`${card.textColor} font-bold text-sm mb-1 flex items-center justify-center gap-1.5`}>
                <Icon size={16} strokeWidth={2.5} />
                {card.name}
              </div>
              <h3 className="text-3xl font-extrabold font-display text-slate-800 my-2">
                {isLoading ? "..." : <AnimatedCounter end={card.count} />}
              </h3>
              <div className="text-slate-400 text-[10px] mt-1">
                Click &rarr; View List
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main layout widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders table widget */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Recent Shipments
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-brand-purple hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2">Order Id</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">PDC Point</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Loading recent list...
                    </td>
                  </tr>
                ) : stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      No recent orders yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 font-bold text-slate-500">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {o.customer_name}
                      </td>
                      <td className="py-3 text-slate-600">{o.pdc_name}</td>
                      <td className="py-3 text-slate-500 text-xs">{o.date}</td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            o.status === "delivered"
                              ? "success"
                              : o.status === "assigned"
                                ? "primary"
                                : "warning"
                          }
                        >
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Shortcuts */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              System Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/admin/broadcast")}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>🌐</span> Configure Broadcast Parameters
              </button>
              <button
                onClick={() => navigate("/admin/wallets")}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>💳</span> Perform Mass Promotional Credits
              </button>
              <button
                onClick={() => navigate("/admin/charges")}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>🪙</span> Adjust Global Fee Charges
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mt-6 flex gap-2.5 text-[11px] text-indigo-800">
            <span>💡</span>
            <p className="leading-relaxed">
              Use the **Wallets** tab to view log ledgers, credit individuals,
              and change joining bonuses with secure OTP validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
