import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Truck,
  Navigation,
  HelpCircle,
  User,
} from "lucide-react";
import { fetchBundleTracking } from "../../../api/orders.api";
import Button from "../../../components/common/Button";
import { useSocketInstance } from "../../../socket/socketContext";
import LiveTrackingMap from "../../../components/common/LiveTrackingMap";

const BundleTrackingPage = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const socket = useSocketInstance();
  const [dpLocation, setDpLocation] = useState(null);

  // Socket listener for live location
  useEffect(() => {
    if (!socket || !bundleId) return;

    // Join room
    socket.emit("track-order", { bundle_id: bundleId });

    // Listen to live location updates
    const handleLocationUpdate = (locData) => {
      // Expecting { lat, lng } object
      if (
        locData &&
        typeof locData.lat === "number" &&
        typeof locData.lng === "number"
      ) {
        setDpLocation([locData.lat, locData.lng]);
      }
    };

    socket.on("dp-live-location", handleLocationUpdate);

    return () => {
      socket.off("dp-live-location", handleLocationUpdate);
    };
  }, [socket, bundleId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetchBundleTracking(bundleId);
        setData(res);
      } catch (err) {
        console.error("Failed to load tracking data", err);
        setError(err.response?.data?.message || "Failed to load tracking data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [bundleId]);

  // Extract initial DP location from fetched data if socket hasn't fired yet
  useEffect(() => {
    if (data?.dpDoc && !dpLocation) {
      const loc = data.dpDoc.location || data.dpDoc.current_location;
      if (loc) {
        if (typeof loc.lat === "number" && typeof loc.lng === "number") {
          setDpLocation([loc.lat, loc.lng]);
        } else if (loc.coordinates && loc.coordinates.length === 2) {
          // GeoJSON format: [lng, lat]
          setDpLocation([loc.coordinates[1], loc.coordinates[0]]);
        }
      }
    }
  }, [data, dpLocation]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto w-full flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto w-full">
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      </div>
    );
  }

  if (!data?.bundle) {
    return (
      <div className="p-8 text-center text-slate-500">
        No tracking data found.
      </div>
    );
  }

  const { bundle, dpDoc } = data;
  const dpName = bundle.dp_id?.name || "Unassigned";
  const dpPhone = bundle.dp_id?.phone || "N/A";
  let vNo = "N/A";
  let vType = "N/A";
  if (dpDoc) {
    vNo = dpDoc.vehicle_number || dpDoc.rc_number || "N/A";
    const type = dpDoc.vehicle_type || "";
    const cap = dpDoc.vehicle_max_capacity
      ? `(${dpDoc.vehicle_max_capacity}T)`
      : "";
    vType = type || cap ? `${type} ${cap}`.trim() : "N/A";
  }

  const allDelivered =
    bundle.orders &&
    bundle.orders.length > 0 &&
    bundle.orders.every((o) => o.status === "delivered");
  const anyReached = bundle.orders?.some((o) => o.status === "reached");
  const anyInTransit = bundle.orders?.some(
    (o) => o.status === "out_for_delivery" || o.status === "shipped",
  );
  const anyPickedUp = bundle.orders?.some((o) =>
    [
      "processing",
      "packed",
      "shipped",
      "out_for_delivery",
      "reached",
      "delivered",
    ].includes(o.status),
  );

  let overallStatus = "Broadcast";
  let step = 1;

  if (allDelivered) {
    overallStatus = "Delivered";
    step = 6;
  } else if (anyReached) {
    overallStatus = "Reached";
    step = 5;
  } else if (anyInTransit) {
    overallStatus = "In Transit";
    step = 4;
  } else if (anyPickedUp) {
    overallStatus = "Picked Up";
    step = 3;
  } else if (bundle.dp_id) {
    overallStatus = "Accepted";
    step = 2;
  }

  const steps = [
    { num: 1, label: "Broadcast" },
    { num: 2, label: "Accepted" },
    { num: 3, label: "Picked Up" },
    { num: 4, label: "In Transit" },
    { num: 5, label: "Reached" },
    { num: 6, label: "Delivered" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full font-sans">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Track Assignment
        </h1>
      </div>

      <div className="bg-white border-2 border-blue-500 rounded-lg p-5 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">Assignment</div>
          <div className="text-slate-800 font-medium">{bundle.bundle_id}</div>
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">
            Assigned DP
          </div>
          <div className="text-slate-800 font-medium">{dpName}</div>
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">DP Phone</div>
          <div className="text-slate-800 font-medium">{dpPhone}</div>
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">
            Vehicle No.
          </div>
          <div className="text-slate-800 font-medium uppercase">{vNo}</div>
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">Type</div>
          <div className="text-slate-800 font-medium">{vType}</div>
        </div>
        <div>
          <div className="text-blue-700 font-bold text-sm mb-1">Status</div>
          <div className="border border-blue-500 text-blue-700 font-semibold px-6 py-1.5 rounded-full bg-blue-50">
            {overallStatus}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-bold text-slate-900 mb-6">
          Progress Timeline
        </h2>
        <div className="relative flex items-start justify-between w-full">
          {/* Background Bar */}
          <div className="absolute left-8 right-8 top-4 -translate-y-1/2 h-1.5 bg-slate-200 z-0 rounded-full" />

          {/* Active Progress Bar */}
          <div
            className="absolute left-8 top-4 -translate-y-1/2 h-1.5 bg-emerald-600 z-0 rounded-full transition-all duration-500"
            style={{
              width: `calc(${Math.min((step - 1) / (steps.length - 1), 1) * 100}% - 4rem)`,
            }}
          />

          {steps.map((s, idx) => {
            const isCompleted = step >= s.num;
            const isActive = step === s.num;

            return (
              <div
                key={s.num}
                className="flex flex-col items-center gap-2 relative z-10 w-24"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
                  ${
                    isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {s.num}
                </div>
                <div
                  className={`text-xs font-semibold text-center ${isCompleted || isActive ? "text-slate-900" : "text-slate-400"}`}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            Per-Order Status
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-50/50 border-b border-indigo-100 text-indigo-900 font-bold">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-center">Pickup</th>
                  <th className="px-4 py-3 text-center">Delivery</th>
                  <th className="px-4 py-3 text-center">POD</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bundle.orders?.map((order) => {
                  const isDelivered = order.status === "delivered";
                  const isReached = order.status === "reached";
                  const isPickedUp = [
                    "processing",
                    "packed",
                    "shipped",
                    "out_for_delivery",
                    "reached",
                    "delivered",
                  ].includes(order.status);

                  const podIcon =
                    order.pod_url || order.pod_image ? (
                      <a
                        href={order.pod_url || order.pod_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    );

                  const deliveryTime =
                    isDelivered && order.updatedAt
                      ? new Date(order.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : order.delivery_time
                        ? new Date(order.delivery_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Pending";

                  return (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {order.orderNumber ||
                          `order_${order._id.toString().slice(0, 10)}` ||
                          `order_${order.order_id.toString().slice(0, 10)}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.user_id?.name || order.sender_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPickedUp ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="text-slate-300">—</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isDelivered ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : isReached ? (
                          <Navigation className="w-4 h-4 text-blue-500 mx-auto" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {podIcon}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium text-sm">
                        {deliveryTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-900">
                Live Vehicle Map
              </h2>
            </div>
            <div
              className="border border-slate-300 bg-[#e8eedd] rounded overflow-hidden flex flex-col shadow-inner relative z-0"
              style={{ height: "350px" }}
            >
              {(() => {
                const pickups =
                  bundle?.orders
                    ?.map((order) => {
                      const lat =
                        order.sender_latitude || order.raw?.sender_latitude;
                      const lng =
                        order.sender_longitude || order.raw?.sender_longitude;
                      if (lat && lng)
                        return {
                          type: "Pickup",
                          coord: [lat, lng],
                          id: order.orderNumber || order.order_id || order._id,
                        };
                      return null;
                    })
                    .filter(Boolean) || [];

                const destinations =
                  bundle?.orders
                    ?.map((order) => {
                      const lat =
                        order.receiver_latitude || order.raw?.receiver_latitude;
                      const lng =
                        order.receiver_longitude ||
                        order.raw?.receiver_longitude;
                      if (lat && lng)
                        return {
                          type: "Drop-off",
                          coord: [lat, lng],
                          id: order.orderNumber || order.order_id || order._id,
                        };
                      return null;
                    })
                    .filter(Boolean) || [];

                const uniquePoints = [];
                [...pickups, ...destinations].forEach((pt) => {
                  if (
                    !uniquePoints.some(
                      (u) =>
                        u.coord[0] === pt.coord[0] &&
                        u.coord[1] === pt.coord[1],
                    )
                  ) {
                    uniquePoints.push(pt);
                  }
                });

                return (
                  <LiveTrackingMap
                    dpLocation={dpLocation}
                    waypoints={uniquePoints}
                    height="100%"
                  />
                );
              })()}
            </div>
          </div>

          {/* <div className="border border-orange-400 bg-white p-4 rounded shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
            <h3 className="font-bold text-orange-600 mb-1">
              Admin Manual Override
            </h3>
            <p className="text-sm text-slate-600">
              Mark a parcel delivered if receiver OTP cannot be verified (DP
              calls Admin; logged).
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default BundleTrackingPage;
