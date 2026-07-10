import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Truck,
  CalendarClock,
  Search,
  ChevronDown,
  Filter,
  Radio,
} from "lucide-react";
import {
  fetchPaginatedOrders,
  fetchScheduledStats,
  fetchScheduledFilters,
  fetchActiveBundles,
} from "../../../api/orders.api";
import { VEHICLE_TYPES } from "../../../constants";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Pagination from "../../../components/common/Pagination";
import AssignOrderModal from "../components/AssignOrderModal";

const getStatusVariant = (status) => {
  const s = (status || "").toLowerCase();
  if (["pending", "scheduled", "created"].includes(s)) return "warning";
  if (["confirmed", "processing", "packed"].includes(s)) return "info";
  if (["shipped", "out_for_delivery"].includes(s)) return "primary";
  if (s === "delivered") return "success";
  if (["cancelled", "returned", "refunded", "failed"].includes(s))
    return "danger";
  return "slate";
};

export const ScheduledOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeBundlesCount, setActiveBundlesCount] = useState(0);
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  // Advanced filters state
  const [availableFilters, setAvailableFilters] = useState({
    pickupPins: [],
    deliveryPins: [],
    vehicleTypes: [],
  });
  const [selectedPickupPin, setSelectedPickupPin] = useState("");
  const [selectedDeliveryPin, setSelectedDeliveryPin] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const navigate = useNavigate();

  // Assignment states
  const [assignOrderId, setAssignOrderId] = useState(null);

  const loadStatsAndFilters = async () => {
    try {
      const [statsData, filtersData, bundlesData] = await Promise.all([
        fetchScheduledStats(),
        fetchScheduledFilters(),
        fetchActiveBundles(),
      ]);
      setStats(statsData);
      setAvailableFilters(filtersData);
      setActiveBundlesCount(bundlesData?.bundles?.length || 0);
    } catch (e) {
      console.error("Failed to load stats or filters", e);
    }
  };

  const loadPaginatedOrders = async (
    page,
    search = searchTerm,
    dateFilter = selectedDateFilter,
    pickupPin = selectedPickupPin,
    deliveryPin = selectedDeliveryPin,
    vehicleType = selectedVehicleType,
    status = selectedStatus,
  ) => {
    setIsLoading(true);
    try {
      const response = await fetchPaginatedOrders(
        status === "all" ? "" : status,
        page,
        10,
        "scheduled",
        search,
        dateFilter,
        { pickupPin, deliveryPin, vehicleType },
      );
      setOrders(response.data.orders);
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
    loadPaginatedOrders(
      currentPage,
      searchTerm,
      selectedDateFilter,
      selectedPickupPin,
      selectedDeliveryPin,
      selectedVehicleType,
      selectedStatus,
    );
  }, [currentPage]);

  useEffect(() => {
    loadStatsAndFilters();
  }, []);

  useEffect(() => {
    if (currentPage === 1) {
      loadPaginatedOrders(
        1,
        searchTerm,
        selectedDateFilter,
        selectedPickupPin,
        selectedDeliveryPin,
        selectedVehicleType,
        selectedStatus,
      );
    } else {
      setCurrentPage(1);
    }
  }, [selectedDateFilter, selectedVehicleType, selectedStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage === 1) {
        loadPaginatedOrders(
          1,
          searchTerm,
          selectedDateFilter,
          selectedPickupPin,
          selectedDeliveryPin,
          selectedVehicleType,
          selectedStatus,
        );
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedPickupPin, selectedDeliveryPin]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      }
      return [...prev, orderId];
    });
  };
  console.log(orders);
  const headers = [
    <input
      type="checkbox"
      className="w-4 h-4 text-brand-purple rounded border-slate-300 focus:ring-brand-purple"
      checked={orders.length > 0 && selectedOrders.length === orders.length}
      onChange={handleSelectAll}
    />,
    "Order Id",
    "Date & Time",
    "Customer",
    "Pickup Location",
    "Delivery Location",
    "Vehicle Type",
    "Amount",
    "Status",
    "Actions",
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarClock className="w-8 h-8 text-brand-purple" />
            Scheduled Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all orders scheduled for future delivery.
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Scheduled */}
        <div
          onClick={() => setSelectedDateFilter("")}
          className={`flex flex-col items-center justify-center p-3 bg-blue-50/50 border-2 rounded-xl cursor-pointer transition-all hover:bg-blue-50 ${selectedDateFilter === "" ? "border-blue-600 shadow-md scale-[1.02]" : "border-blue-400 opacity-90"}`}
        >
          <div className="text-blue-700 font-bold text-sm">Total Scheduled</div>
          <div className="text-slate-500 text-[10px] mb-1">
            Orders (all dates)
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {stats?.total || 0}
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            click &rarr; full list
          </div>
        </div>

        {/* Today */}
        <div
          onClick={() => setSelectedDateFilter(stats?.today?.date || "")}
          className={`flex flex-col items-center justify-center p-3 bg-orange-50/50 border-2 rounded-xl cursor-pointer transition-all hover:bg-orange-50 ${selectedDateFilter === stats?.today?.date && selectedDateFilter !== "" ? "border-orange-500 shadow-md scale-[1.02]" : "border-orange-400 opacity-90"}`}
        >
          <div className="text-orange-600 font-bold text-sm">Today</div>
          <div className="text-slate-500 text-[10px] mb-1">
            {stats?.today?.display || "N/A"}
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {stats?.today?.count || 0}
          </div>
          <div className="text-[9px] text-orange-600 flex items-center gap-1">
            click &rarr; drilldown <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        {/* Tomorrow */}
        <div
          onClick={() => setSelectedDateFilter(stats?.tomorrow?.date || "")}
          className={`flex flex-col items-center justify-center p-3 bg-emerald-50/50 border-2 rounded-xl cursor-pointer transition-all hover:bg-emerald-50 ${selectedDateFilter === stats?.tomorrow?.date && selectedDateFilter !== "" ? "border-emerald-500 shadow-md scale-[1.02]" : "border-emerald-400 opacity-90"}`}
        >
          <div className="text-emerald-700 font-bold text-sm">Tomorrow</div>
          <div className="text-slate-500 text-[10px] mb-1">
            {stats?.tomorrow?.display || "N/A"}
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {stats?.tomorrow?.count || 0}
          </div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>

        {/* Day After Tomorrow */}
        <div
          onClick={() => setSelectedDateFilter(stats?.dayAfter?.date || "")}
          className={`flex flex-col items-center justify-center p-3 bg-purple-50/50 border-2 rounded-xl cursor-pointer transition-all hover:bg-purple-50 ${selectedDateFilter === stats?.dayAfter?.date && selectedDateFilter !== "" ? "border-purple-500 shadow-md scale-[1.02]" : "border-purple-400 opacity-90"}`}
        >
          <div className="text-purple-700 font-bold text-sm">
            Day After Tomorrow
          </div>
          <div className="text-slate-500 text-[10px] mb-1">
            {stats?.dayAfter?.display || "N/A"}
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {stats?.dayAfter?.count || 0}
          </div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>

        {/* Broadcast Orders */}
        <div
          onClick={() => navigate("/admin/scheduled-orders/broadcasts")}
          className={`flex flex-col items-center justify-center p-3 bg-rose-50/50 border-2 rounded-xl cursor-pointer transition-all hover:bg-rose-50 border-rose-400 opacity-90`}
        >
          <div className="text-rose-700 font-bold text-sm flex items-center gap-1">
            <Radio className="w-4 h-4" /> Broadcast Orders
          </div>
          <div className="text-slate-500 text-[10px] mb-1">Active Bundles</div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {activeBundlesCount}
          </div>
          <div className="text-[9px] text-rose-600 flex items-center gap-1 group-hover:text-rose-600 transition-colors">
            click &rarr; view bundles
          </div>
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative min-w-[200px] flex-1 sm:flex-none">
          <Input
            placeholder="Search Order / Customer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-300 w-full"
          />
          <Search className="w-4 h-4 text-brand-purple absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <Input
          placeholder="Pickup PIN"
          value={selectedPickupPin}
          onChange={(e) => setSelectedPickupPin(e.target.value)}
          className="bg-slate-50 border-slate-300 min-w-[120px] max-w-[150px]"
        />

        <Input
          placeholder="Delivery PIN"
          value={selectedDeliveryPin}
          onChange={(e) => setSelectedDeliveryPin(e.target.value)}
          className="bg-slate-50 border-slate-300 min-w-[120px] max-w-[150px]"
        />

        <select
          className="h-10 px-3 bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-brand-purple focus:border-brand-purple outline-none cursor-pointer"
          value={selectedVehicleType}
          onChange={(e) => setSelectedVehicleType(e.target.value)}
        >
          <option value="">Vehicle Type</option>
          {Object.values(VEHICLE_TYPES).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="h-10 px-3 bg-orange-50 border border-orange-300 text-slate-900 font-semibold text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none cursor-pointer"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">Status: All</option>
          <option value="scheduled">Status: Pending</option>
          <option value="assigned">Status: Assigned</option>
          <option value="intransit">Status: In Transit</option>
          <option value="delivered">Status: Delivered</option>
          <option value="cancelled">Status: Cancelled</option>
        </select>

        <Button
          variant="primary"
          size="sm"
          disabled={selectedOrders.length === 0}
          onClick={() => {
            navigate("/admin/scheduled-orders/recommend-dp", {
              state: { orderIds: selectedOrders },
            });
          }}
          className="ml-auto"
        >
          Find DP
        </Button>
      </div>

      <Table
        headers={headers}
        data={orders}
        isLoading={isLoading}
        renderRow={(order, idx) => (
          <tr
            key={order.id || idx}
            className="transition-colors hover:bg-slate-50/50"
          >
            <td className="px-5 py-4">
              <input
                type="checkbox"
                className="w-4 h-4 text-brand-purple rounded border-slate-300 focus:ring-brand-purple"
                checked={selectedOrders.includes(order.id)}
                onChange={() => handleSelectOrder(order.id)}
              />
            </td>
            <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-brand-purple">
              {order.orderNumber}
            </td>
            <td className="px-5 py-4 text-sm whitespace-nowrap text-slate-600">
              <div className="font-medium text-slate-900">
                {order.schedule_date}
              </div>
              <div className="text-xs text-slate-500">
                {order.schedule_time}
              </div>
            </td>
            <td className="px-5 py-4 text-sm whitespace-nowrap">
              <div className="font-medium text-slate-900">
                {order.customer_name}
              </div>
              <div className="text-xs text-slate-500">
                {order.customer_phone}
              </div>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600 max-w-[200px] truncate">
              <div>{order.pickup_address}</div>
              {order.sender_pin_code && (
                <div className="text-xs text-brand-purple font-medium mt-0.5">
                  PIN: {order.sender_pin_code}
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-sm text-slate-600 max-w-[200px] truncate">
              <div>{order.delivery_address}</div>
              {order.receiver_pin_code && (
                <div className="text-xs text-brand-purple font-medium mt-0.5">
                  PIN: {order.receiver_pin_code}
                </div>
              )}
            </td>
            <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-slate-700">
              {order.vehicle_type}
            </td>
            <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-slate-900">
              ₹{order.amount}
            </td>
            <td className="px-5 py-4 whitespace-nowrap">
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
                {/* <Button
                  onClick={() => setAssignOrderId(order.id)}
                  variant="primary"
                  size="sm"
                  className="py-1 px-2.5 text-[10px] flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" /> Assign Partner
                </Button> */}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalOrders}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        itemName="orders"
      />

      {/* Assign Delivery Boy Modal */}
      {assignOrderId && (
        <AssignOrderModal
          isOpen={!!assignOrderId}
          onClose={() => setAssignOrderId(null)}
          orderId={assignOrderId}
          onAssignSuccess={() => loadPaginatedOrders(currentPage)}
        />
      )}
    </div>
  );
};

export default ScheduledOrders;
