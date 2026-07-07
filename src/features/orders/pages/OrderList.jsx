import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Truck, Search } from "lucide-react";
import { fetchPaginatedOrders } from "../../../api/orders.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import AssignOrderModal from "../components/AssignOrderModal";

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, pending, assigned, intransit, delivered, broadcasted, cancelled
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Assignment states
  const [assignOrderId, setAssignOrderId] = useState(null);

  const loadPaginatedOrders = async (tab, page, search = "") => {
    setIsLoading(true);
    try {
      const response = await fetchPaginatedOrders(
        tab,
        page,
        10,
        "normal",
        search,
      );
      setOrders(response.data.orders);
      setFilteredOrders(response.data.orders);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalOrders(response.data.total);
    } catch (e) {
      console.error("Failed to load paginated orders", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPaginatedOrders(activeTab, currentPage, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [activeTab, currentPage, searchQuery]);

  const getStatusVariant = (status) => {
    switch (status) {
      case "delivered":
        return "success";
      case "intransit":
        return "info";
      case "assigned":
        return "primary";
      case "pending":
      case "created":
        return "warning";
      case "broadcasted":
        return "info";
      default:
        return "danger";
    }
  };

  const tabs = [
    { name: "All Shipments", value: "all" },
    { name: "Pending", value: "pending" },
    { name: "Assigned", value: "assigned" },
    { name: "In Transit", value: "intransit" },
    { name: "Delivered", value: "delivered" },
    { name: "Broadcasted", value: "broadcasted" },
    { name: "Cancelled", value: "cancelled" },
  ];

  const headers = [
    "Order Id",
    "Date",
    "Sender Details",
    "Receiver Details",
    // "PDC Center",
    "Delivery Partner",
    "Amount",
    "Status",
    "Actions",
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Orders Logistics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor parcel routes, assign delivery boys, and track completion
          status
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-2">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 text-xs font-bold capitalize transition-colors rounded-lg cursor-pointer ${
                activeTab === tab.value
                  ? "bg-brand-purple text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-lg flex-shrink-0">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on new search
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
          />
        </div>
      </div>

      <Table
        headers={headers}
        data={filteredOrders}
        isLoading={isLoading}
        emptyMessage={`No orders found with status "${activeTab}".`}
        renderRow={(order) => (
          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
              {order.order_number}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
              {order.created_at}
            </td>
            <td className="px-5 py-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
              <div>{order.customer_name}</div>
              {order.customer_phone && order.customer_phone !== "N/A" && (
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  {order.customer_phone}
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
              <div>{order.receiver_name}</div>
              {order.receiver_phone && order.receiver_phone !== "N/A" && (
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  {order.receiver_phone}
                </div>
              )}
            </td>
            {/* <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
              {order.pdc_name}
            </td> */}
            <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
              {order.dp_name || (
                <span className="text-slate-400 font-medium">Unassigned</span>
              )}
            </td>
            <td className="px-5 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
              ₹ {order.amount}
            </td>
            <td className="px-5 py-4 text-xs whitespace-nowrap">
              <Badge variant={getStatusVariant(order?.status)}>
                {order?.status}
              </Badge>
            </td>
            <td className="px-5 py-4 text-xs whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  variant="outline"
                  size="sm"
                  className="py-1 px-2.5 text-[10px] flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View details
                </Button>
                {(order?.status === "pending" ||
                  order?.status === "created") && (
                  <Button
                    onClick={() => setAssignOrderId(order.id)}
                    variant="primary"
                    size="sm"
                    className="py-1 px-2.5 text-[10px] flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" /> Assign Partner
                  </Button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing page{" "}
            <span className="font-bold text-slate-700">{currentPage}</span> of{" "}
            <span className="font-bold text-slate-700">{totalPages}</span>
            <span className="ml-1 opacity-70">
              ({totalOrders} total orders)
            </span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Assign Delivery Boy Modal */}
      {assignOrderId && (
        <AssignOrderModal
          isOpen={!!assignOrderId}
          onClose={() => setAssignOrderId(null)}
          orderId={assignOrderId}
          onAssignSuccess={() => loadPaginatedOrders(activeTab, currentPage)}
        />
      )}
    </div>
  );
};

export default OrderList;
