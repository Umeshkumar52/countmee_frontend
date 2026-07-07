import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderDetails as apiFetchOrderDetails } from "../../../api/orders.api";
import { processManualRefund } from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Modal from "../../../components/common/Modal";
import useAuth from "../../../hooks/useAuth";
import { useSocket } from "../../../hooks/useSocket";
import LiveTrackingMap from "../../../components/common/LiveTrackingMap";

export const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [liveLocation, setLiveLocation] = useState(null);

  // Manual Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState("");

  const { emit, isConnected } = useSocket("location:updated", (data) => {
    if (data.lat && data.lng) {
      setLiveLocation({ lat: data.lat, lng: data.lng });
    }
  });

  useEffect(() => {
    if (isConnected) {
      emit("order:join", { orderId: id });
      return () => {
        emit("order:leave", { orderId: id });
      };
    }
  }, [id, isConnected, emit]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetchOrderDetails(id);
        console.log(response);
        setOrder(response.data);
      } catch (e) {
        console.error("Failed to load order details", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    if (order && !liveLocation && order.current_lat && order.current_lng) {
      setLiveLocation({ lat: order.current_lat, lng: order.current_lng });
    }
  }, [order, liveLocation]);

  const handleBack = () => {
    if (isAdmin) {
      navigate("/admin/orders");
    } else {
      navigate("/pdc/home");
    }
  };

  const handleManualRefund = async (e) => {
    e.preventDefault();
    if (!refundAmount) return;
    
    setIsRefunding(true);
    setRefundError("");
    
    try {
      await processManualRefund({
        order_id: id,
        amount: Number(refundAmount),
        reason: refundReason
      });
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      
      // Refresh order details
      const response = await apiFetchOrderDetails(id);
      setOrder(response.data);
    } catch (err) {
      setRefundError(err.response?.data?.message || err.message || "Failed to process refund");
    } finally {
      setIsRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Order record not found.</p>
        <Button onClick={handleBack} size="sm" className="mt-4">
          Back
        </Button>
      </div>
    );
  }
  console.log("Order Details:", order);
  const getStatusVariant = (status) => {
    switch (status) {
      case "delivered":
        return "success";
      case "intransit":
        return "info";
      case "assigned":
        return "primary";
      case "pending":
        return "warning";
      case "broadcasted":
        return "info";
      default:
        return "danger";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      <div className="flex items-center gap-3">
        <Button onClick={handleBack} variant="outline" size="sm">
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Order: {order.order_number}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Created on {order.created_at}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: customer & PDC cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Customer Info */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.customer_name}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Mobile Phone</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.customer_phone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400">Delivery Drop Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.delivery_address}
                </p>
              </div>
            </div>
          </div>

          {/* Card: PDC Hub */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Store Hub (PDC)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">PDC Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.pdc_name}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Collection address</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.pickup_address}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Location Details (Pickup & Destination) */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Location Details
            </h3>
            <div className="relative border-l border-dashed border-slate-200 pl-6 ml-3 space-y-6">
              {/* Pickup */}
              <div className="relative">
                <span className="absolute -left-[30px] top-0.5 w-3 h-3 rounded-full bg-brand-success border-2 border-white ring-2 ring-brand-success/20"></span>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Pickup Location
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.pickup_address}
                </p>
              </div>
              {/* Destination */}
              <div className="relative">
                <span className="absolute -left-[30px] top-0.5 w-3 h-3 rounded-full bg-brand-purple border-2 border-white ring-2 ring-brand-purple/20"></span>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Destination Location (Drop)
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {order.delivery_address}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Package Details */}
          {order.packageDetail && (
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm mb-4">
                Package Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 mb-4">
                <div>
                  <p className="text-slate-400">Description</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.packageDetail.product_description || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Product Type</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.packageDetail.types_of_product || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Weight & Quantity</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.packageDetail.product_weight} |{" "}
                    {order.packageDetail.no_of_items} Items
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Dimensions (L x W x H)</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.packageDetail.product_length} x{" "}
                    {order.packageDetail.product_width} x{" "}
                    {order.packageDetail.product_height}
                  </p>
                </div>
              </div>

              {/* Uploaded Images */}
              <h4 className="font-bold text-slate-700 text-xs mb-2">
                User Uploaded Images
              </h4>
              <div className="flex flex-wrap gap-4">
                {order.packageDetail.image1 && (
                  <img
                    src={order.packageDetail.image1}
                    alt="Package 1"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                  />
                )}
                {order.packageDetail.image2 && (
                  <img
                    src={order.packageDetail.image2}
                    alt="Package 2"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                  />
                )}
                {order.packageDetail.image3 && (
                  <img
                    src={order.packageDetail.image3}
                    alt="Package 3"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                  />
                )}
                {!order.packageDetail.image1 &&
                  !order.packageDetail.image2 &&
                  !order.packageDetail.image3 && (
                    <p className="text-xs text-slate-400">
                      No images uploaded.
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: delivery boy & payment cards */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Status & OTP */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">
                Logistics Status
              </p>
              <div className="mt-1">
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>

            {order.drop_otp && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Drop Verification OTP
                </p>
                <span className="inline-block bg-brand-purple text-white text-sm font-bold px-3 py-1.5 rounded-xl mt-1 tracking-wider">
                  🔑 {order.drop_otp}
                </span>
              </div>
            )}
          </div>

          {/* Card: Partner Details */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">
              Assigned Partner
            </h3>
            {order.dp_name ? (
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-semibold text-slate-700">
                    {order.dp_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Number:</span>
                  <span className="font-semibold text-slate-700">
                    {order?.raw?.pickup_dp_id?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-semibold text-slate-700">
                    Delivery Boy
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                No delivery boy assigned to this shipment yet.
              </p>
            )}
          </div>

          {/* Card: Live Tracking */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs overflow-hidden">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3 flex justify-between items-center">
              <span>Live Tracking</span>
              {liveLocation ? (
                <span className="flex items-center gap-1 text-[10px] text-brand-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></span>
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  WAITING FOR SIGNAL
                </span>
              )}
            </h3>

            <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative z-0">
              {(() => {
                const waypoints = [];
                if (order.sender_latitude && order.sender_longitude) {
                  waypoints.push({ type: "Pickup", coord: [order.sender_latitude, order.sender_longitude], id: order.order_number });
                } else if (order.raw?.sender_latitude && order.raw?.sender_longitude) {
                  waypoints.push({ type: "Pickup", coord: [order.raw.sender_latitude, order.raw.sender_longitude], id: order.order_number });
                }

                if (order.receiver_latitude && order.receiver_longitude) {
                  waypoints.push({ type: "Drop-off", coord: [order.receiver_latitude, order.receiver_longitude], id: order.order_number });
                } else if (order.raw?.receiver_latitude && order.raw?.receiver_longitude) {
                  waypoints.push({ type: "Drop-off", coord: [order.raw.receiver_latitude, order.raw.receiver_longitude], id: order.order_number });
                }

                const dpLocArray = liveLocation ? [liveLocation.lat, liveLocation.lng] : null;

                return (
                  <LiveTrackingMap 
                    dpLocation={dpLocArray} 
                    waypoints={waypoints} 
                    height="100%" 
                  />
                );
              })()}
            </div>
          </div>

          {/* Card: Pricing Summary */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">
              Billing Summary
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Count:</span>
                <span className="font-semibold text-slate-700">
                  {order.items_count} Parcels
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="capitalize font-semibold text-slate-700">
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-2.5 font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-brand-purple">₹ {order.amount}</span>
              </div>
              
              {/* Admin Manual Refund Button */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <Button 
                    onClick={() => setShowRefundModal(true)} 
                    variant="danger" 
                    size="sm" 
                    className="w-full"
                  >
                    Process Manual Refund
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setRefundError("");
        }}
        title="Process Manual Refund"
      >
        <p className="text-sm text-slate-500 mb-6 mt-[-10px]">
          Issue a custom refund amount directly to the customer. This action is irreversible.
        </p>

        <form onSubmit={handleManualRefund} className="space-y-4">
          {refundError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
              {refundError}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Refund Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              max={order.amount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
              placeholder={`Max: ₹${order.amount}`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows="3"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple resize-none"
              placeholder="e.g., Customer complained about delay..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setShowRefundModal(false);
                setRefundError("");
              }}
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="danger" 
              className="flex-1"
              disabled={isRefunding || !refundAmount}
            >
              {isRefunding ? "Processing..." : "Issue Refund"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderView;
