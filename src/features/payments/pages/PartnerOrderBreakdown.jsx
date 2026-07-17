import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { settlePayments } from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

const PartnerOrderBreakdown = () => {
  const { dp_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // We use the group data passed via router state for fast rendering.
  // If we wanted real-time data on reload, we'd fetch it here.
  const initialGroup = location.state?.groupData || null;
  const financeType = location.state?.financeType || "DP";

  const [group, setGroup] = useState(initialGroup);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-slate-500 mb-4">
          No data found. Please navigate from the Finance Overview.
        </p>
        <Button onClick={() => navigate("/admin/finance")}>Go Back</Button>
      </div>
    );
  }

  const handleSettleClick = (order) => {
    setSelectedOrder(order);
  };

  const confirmIndividualSettle = async () => {
    if (!selectedOrder) return;
    setIsSettling(true);
    try {
      await settlePayments({
        ids: [selectedOrder.payout_id],
        payable: group.dp_auth_id || group.pdc_auth_id,
        settlement_amount: selectedOrder.waiting_charge,
        settle_type: "waiting",
      });
      toast.success("Waiting charge settled successfully!");

      // Update local state to reflect the settlement without needing a full refetch
      setGroup((prev) => {
        const updatedOrders = prev.orders.map((o) => {
          if (o.id === selectedOrder.id) {
            return { ...o, waiting_charge_settled: true };
          }
          return o;
        });
        return { ...prev, orders: updatedOrders };
      });

      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e?.message || "An error occurred",
      );
      toast.error("Settlement failed: " + e.message);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 text-left page-transition pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={() => navigate("/admin/finance")}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Order Breakdown for: {group.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review pending orders and individually settle waiting charges
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                  Order ID
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase">
                  Locations
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-right">
                  Base Amount
                </th>
                <th className="p-4 text-[10px] font-bold text-amber-500 uppercase text-right border-l border-slate-100">
                  Waiting Charge
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-center">
                  Customer Status
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase text-center border-r border-slate-100">
                  Action
                </th>
                <th className="p-4 text-[10px] font-bold text-brand-purple uppercase text-right">
                  Total Owed
                </th>
              </tr>
            </thead>
            <tbody className="overflow-auto">
              {group.orders?.map((order) => {
                const hasWaiting = (order.waiting_charge || 0) > 0;

                return (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    {/* Order ID */}
                    <td className="p-4 align-top">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {String(order.order_number)}
                      </span>
                    </td>

                    {/* Locations */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <p
                            className="text-slate-700 font-semibold text-xs leading-tight max-w-[200px] truncate"
                            title={order.pickup_address}
                          >
                            {order.pickup_address}
                          </p>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                          <p
                            className="text-slate-500 text-[10px] leading-tight max-w-[200px] truncate"
                            title={order.delivery_address}
                          >
                            {order.delivery_address}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Base Amount */}
                    <td className="p-4 text-right align-top">
                      <span className="text-sm font-bold text-slate-700 block">
                        ₹ {order.amount.toFixed(2)}
                      </span>
                      {order.base_settled ? (
                        <span className="inline-block mt-1 text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                          ✓ Settled
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                          Pending Bulk
                        </span>
                      )}
                    </td>

                    {/* Waiting Penalty (Amount only) */}
                    <td className="p-4 align-top text-right border-l border-slate-100 bg-slate-50/30">
                      {!hasWaiting ? (
                        <span className="text-slate-300 text-sm">—</span>
                      ) : (
                        <span className="text-sm font-black text-amber-600">
                          ₹ {order.waiting_charge.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Customer Status */}
                    <td className="p-4 align-top text-center bg-slate-50/30">
                      {!hasWaiting ? (
                        <span className="text-slate-300 text-sm">—</span>
                      ) : (
                        <div className="flex flex-col items-center justify-start h-full pt-0.5">
                          {order.customer_paid_waiting_charge ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                              Paid
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100 flex items-center justify-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Unpaid
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Action (Settle Button) */}
                    <td className="p-4 align-top text-center border-r border-slate-100 bg-slate-50/30">
                      {!hasWaiting ? (
                        <span className="text-slate-300 text-sm">—</span>
                      ) : (
                        <div className="flex flex-col items-center justify-start h-full">
                          {order.waiting_charge_settled ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md flex items-center gap-1">
                              ✓ Settled
                            </span>
                          ) : order.waiting_charge_expired ? (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-md flex items-center gap-1">
                              Expired
                            </span>
                          ) : (
                            <Button
                              size="lg"
                              variant={
                                order.customer_paid_waiting_charge
                                  ? "primary"
                                  : "secondary"
                              }
                              disabled={!order.customer_paid_waiting_charge}
                              onClick={() => handleSettleClick(order)}
                              className="text-[11px] px-3 py-1.5 whitespace-nowrap"
                            >
                              Settle Wait Charge
                            </Button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 text-right align-top">
                      <span className="text-sm font-extrabold text-brand-purple block">
                        ₹{" "}
                        {order.total_amount?.toFixed(2) ||
                          order.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {(!group.orders || group.orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No pending orders found for this partner.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Single Waiting Charge Modal */}
      {selectedOrder && (
        <ConfirmationModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onConfirm={confirmIndividualSettle}
          title="Settle Waiting Charge"
          message={`You are about to settle a waiting charge of ₹${selectedOrder.waiting_charge.toFixed(2)} for Order #${String(selectedOrder.order_number).slice(-8)}.`}
          confirmLabel="Pay to Delivery Partner"
          variant="warning"
          isLoading={isSettling}
        />
      )}
    </div>
  );
};

export default PartnerOrderBreakdown;
