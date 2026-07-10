import React from "react";
import {
  X,
  MapPin,
  User,
  Package,
  Navigation,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Button from "./Button";

const BundleDetailsModal = ({ bundle, onClose, onViewResponses }) => {
  if (!bundle) return null;

  const calculateTotals = () => {
    let totalWeight = 0;
    let totalPrice = 0;
    let totalDistance = 0;

    bundle.orders?.forEach((order) => {
      totalPrice += Number(order.charges) || 0;
      totalDistance += Number(order.distance) || 0;

      const weightStr = order.package_id?.product_weight;
      if (weightStr) {
        const weightMatch = weightStr.match(/[\d.]+/);
        if (weightMatch) {
          totalWeight += Number(weightMatch[0]);
        }
      }
    });

    return {
      weight: totalWeight.toFixed(2),
      price: totalPrice.toFixed(2),
      distance: totalDistance.toFixed(2),
    };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Bundle Details
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              ID: {bundle.bundle_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="space-y-4">
            {bundle.orders?.map((order, index) => (
              <div
                key={order._id || index}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-5 h-5 text-brand-purple" />
                    Order:
                    {order.orderNumber ||
                      `order_${order._id.toString().slice(0, 10)}`}
                  </h3>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    ID:{" "}
                    {order.orderNumber ||
                      `order_${order._id.toString().slice(0, 10)}`}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Pickup
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {order.pickup_location}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> {order.sender_name} •{" "}
                          {order.sender_phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-emerald-100 p-1.5 rounded-full">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Drop-off
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {order.drop_location}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> {order.receiver_name} •{" "}
                          {order.receiver_phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-col justify-center space-y-4 md:border-l md:border-slate-100 md:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Navigation className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">
                          Distance
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {order.distance} km
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <DollarSign className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">
                          Charges
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          ₹{order.charges}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Package className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">
                          Package Weight
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {order.package_id?.product_weight || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Totals Summary */}
            <div className="flex items-center gap-6 divide-x divide-slate-200 w-full md:w-auto bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
              <div className="px-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Distance
                </div>
                <div className="text-lg font-black text-slate-900">
                  {totals.distance} km
                </div>
              </div>
              <div className="px-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Weight
                </div>
                <div className="text-lg font-black text-slate-900">
                  {totals.weight} kg
                </div>
              </div>
              <div className="pl-4 pr-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Price
                </div>
                <div className="text-lg font-black text-emerald-600">
                  ₹{totals.price}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 md:flex-none"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => onViewResponses(bundle.bundle_id)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2"
              >
                View Responses <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetailsModal;
