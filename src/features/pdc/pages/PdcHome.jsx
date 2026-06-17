import React, { useEffect, useState } from 'react';
import { fetchPdcOrders } from '../../../api/pdc.api';
import { rateDeliveryPartner } from '../../../api/pdc.api';
import useAuth from '../../../hooks/useAuth';
import useSocket from '../../../hooks/useSocket';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';

export const PdcHome = () => {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rating modal states
  const [selectedDp, setSelectedDp] = useState(null); // { id, name, orderId }
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [isRatingSubmit, setIsRatingSubmit] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const fetchActiveOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch PDC-specific order history from /pdc/order-history
      const response = await fetchPdcOrders();
      const orders = response.data?.data?.orders || response.data?.orders || [];
      // Show only active/in-progress orders
      const active = orders.filter(o =>
        ['pending', 'assigned', 'intransit', 'broadcasted'].includes(o.status_completed)
      );
      setActiveOrders(active);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  // Socket triggers to reload active orders on assign/creation updates
  useSocket('order:assigned', () => {
    fetchActiveOrders();
  });
  useSocket('order:created', () => {
    fetchActiveOrders();
  });

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDp) return;
    setIsRatingSubmit(true);

    try {
      await rateDeliveryPartner({
        dpId: selectedDp.id,
        rating: parseInt(rating),
        comment
      });
      setRatingSuccess(true);
      setComment('');
      setRating('5');
      setTimeout(() => {
        setRatingSuccess(false);
        setSelectedDp(null);
      }, 2000);
    } catch (e) {
      console.error('Rating failed', e);
    } finally {
      setIsRatingSubmit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      
      {/* Welcome banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your active parcel collections and drop-offs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchActiveOrders} variant="outline" size="sm">
            🔄 Refresh List
          </Button>
        </div>
      </div>

      {/* Active orders sections */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">Active Deliveries</h3>
        
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-12 text-center text-slate-400">
            <svg className="animate-spin h-8 w-8 text-brand-purple mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm">Loading active orders...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-12 text-center text-slate-400">
            <span className="text-3xl mb-2 block">📦</span>
            <p className="text-sm font-medium">No active deliveries at this time</p>
            <p className="text-xs text-slate-400 mt-1">Orders assigned to your store hub will show up here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400">{order.order_number}</span>
                    <Badge variant={order.status === 'intransit' ? 'info' : order.status === 'assigned' ? 'primary' : 'warning'}>
                      {order.status}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">{order.customer_name}</h4>
                  <p className="text-[11px] text-slate-400">{order.customer_phone}</p>
                  
                  <div className="mt-4 space-y-2 border-t border-b border-slate-50 py-3">
                    <div className="flex gap-2 text-xs">
                      <span className="text-slate-400">📍</span>
                      <p className="text-slate-600 truncate">{order.delivery_address}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-slate-400">💼</span>
                      <p className="text-slate-600">{order.items_count} Parcels • ₹{order.amount}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom action controls */}
                <div className="mt-4 pt-3 flex items-center justify-between gap-3 border-t border-slate-50">
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Delivery OTP</p>
                    {order.dp_name ? (
                      <span className="inline-block bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-lg mt-1 select-all">
                        🔑 {order.drop_otp}
                      </span>
                    ) : (
                      <span className="inline-block bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded-lg mt-1">
                        Waiting for Delivery
                      </span>
                    )}
                  </div>
                  
                  {/* Rating / Feedback action if assigned */}
                  {order.dp_id && (
                    <Button
                      onClick={() => setSelectedDp({ id: order.dp_id, name: order.dp_name, orderId: order.id })}
                      variant="outline"
                      size="sm"
                      className="text-xs py-1 px-2.5"
                    >
                      ⭐ Rate Partner
                    </Button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate Delivery Boy Modal */}
      {selectedDp && (
        <Modal
          isOpen={!!selectedDp}
          onClose={() => setSelectedDp(null)}
          title="Rate Delivery Partner"
        >
          {ratingSuccess ? (
            <div className="text-center py-6">
              <span className="text-3xl">🎉</span>
              <h4 className="font-bold text-emerald-600 text-sm mt-2">Rating Submitted!</h4>
              <p className="text-xs text-slate-400 mt-1">Thank you for your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleRateSubmit} className="space-y-4 text-left">
              <p className="text-xs text-slate-500">
                Please rate your experience with partner <strong>{selectedDp.name}</strong> for delivery {selectedDp.orderId}.
              </p>
              
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1.5">Rating Score</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (Good)</option>
                  <option value="3">⭐⭐⭐ (Average)</option>
                  <option value="2">⭐⭐ (Poor)</option>
                  <option value="1">⭐ (Terrible)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="comment" className="text-xs font-semibold text-slate-600 mb-1.5">Comments</label>
                <textarea
                  id="comment"
                  rows={3}
                  placeholder="Enter comments about this delivery boy partner..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setSelectedDp(null)} variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isRatingSubmit} variant="primary" size="sm">
                  Submit Feedback
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
};

export default PdcHome;
