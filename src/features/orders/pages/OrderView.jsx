import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderDetails as apiFetchOrderDetails } from '../../../api/orders.api';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import useAuth from '../../../hooks/useAuth';

export const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetchOrderDetails(id);
        setOrder(response.data);
      } catch (e) {
        console.error('Failed to load order details', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]);

  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin/orders');
    } else {
      navigate('/pdc/home');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading order details...</div>;
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

  const getStatusVariant = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'intransit': return 'info';
      case 'assigned': return 'primary';
      case 'pending': return 'warning';
      case 'broadcasted': return 'info';
      default: return 'danger';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      <div className="flex items-center gap-3">
        <Button onClick={handleBack} variant="outline" size="sm">
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Order: {order.order_number}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Created on {order.created_at}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: customer & PDC cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Customer Info */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Mobile Phone</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.customer_phone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-400">Delivery Drop Address</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Card: PDC Hub */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Store Hub (PDC)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">PDC Name</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.pdc_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Collection address</p>
                <p className="font-semibold text-slate-800 mt-0.5">{order.pickup_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: delivery boy & payment cards */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Status & OTP */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Logistics Status</p>
              <div className="mt-1">
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>
            
            {order.drop_otp && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Drop Verification OTP</p>
                <span className="inline-block bg-brand-purple text-white text-sm font-bold px-3 py-1.5 rounded-xl mt-1 tracking-wider">
                  🔑 {order.drop_otp}
                </span>
              </div>
            )}
          </div>

          {/* Card: Partner Details */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Assigned Partner</h3>
            {order.dp_name ? (
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="font-semibold text-slate-700">{order.dp_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="font-semibold text-slate-700">Delivery Boy</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No delivery boy assigned to this shipment yet.</p>
            )}
          </div>

          {/* Card: Pricing Summary */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Billing Summary</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Count:</span>
                <span className="font-semibold text-slate-700">{order.items_count} Parcels</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="capitalize font-semibold text-slate-700">{order.payment_status}</span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-2.5 font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-brand-purple">₹ {order.amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderView;
