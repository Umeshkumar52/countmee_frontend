import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders as apiFetchOrders } from '../../../api/orders.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import AssignOrderModal from '../components/AssignOrderModal';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, assigned, intransit, delivered, broadcasted, cancelled
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Assignment states
  const [assignOrderId, setAssignOrderId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetchOrders();
      setOrders(response.data);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter based on tab clicks
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(orders);
    } else if (activeTab === 'cancelled') {
      setFilteredOrders(orders.filter(o => ['customer_cancelled', 'dp_cancelled'].includes(o.status)));
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeTab));
    }
  }, [activeTab, orders]);

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

  const tabs = [
    { name: 'All Shipments', value: 'all' },
    { name: 'Pending', value: 'pending' },
    { name: 'Assigned', value: 'assigned' },
    { name: 'In Transit', value: 'intransit' },
    { name: 'Delivered', value: 'delivered' },
    { name: 'Broadcasted', value: 'broadcasted' },
    { name: 'Cancelled', value: 'cancelled' },
  ];

  const headers = ['Order Number', 'Date', 'Customer Name', 'PDC Center', 'Delivery Partner', 'Amount', 'Status', 'Actions'];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Orders Logistics</h2>
        <p className="text-xs text-slate-400 mt-1">Monitor parcel routes, assign delivery boys, and track completion status</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-colors rounded-lg cursor-pointer ${
              activeTab === tab.value
                ? 'bg-brand-purple text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <Table
        headers={headers}
        data={filteredOrders}
        isLoading={isLoading}
        emptyMessage={`No orders found with status "${activeTab}".`}
        renderRow={(order) => (
          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-500">
              {order.order_number}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500">
              {order.created_at}
            </td>
            <td className="px-5 py-4 text-xs font-semibold text-slate-800">
              {order.customer_name}
            </td>
            <td className="px-5 py-4 text-xs text-slate-600">
              {order.pdc_name}
            </td>
            <td className="px-5 py-4 text-xs text-slate-600">
              {order.dp_name || <span className="text-slate-400 font-medium">Unassigned</span>}
            </td>
            <td className="px-5 py-4 text-xs font-bold text-slate-700">
              ₹ {order.amount}
            </td>
            <td className="px-5 py-4 text-xs">
              <Badge variant={getStatusVariant(order.status)}>
                {order.status}
              </Badge>
            </td>
            <td className="px-5 py-4 text-xs space-x-2">
              <Button
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                variant="outline"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
              >
                👁️ View details
              </Button>
              {order.status === 'pending' && (
                <Button
                  onClick={() => setAssignOrderId(order.id)}
                  variant="primary"
                  size="sm"
                  className="py-1 px-2.5 text-[10px]"
                >
                  🚚 Assign Partner
                </Button>
              )}
            </td>
          </tr>
        )}
      />

      {/* Assign Delivery Boy Modal */}
      {assignOrderId && (
        <AssignOrderModal
          isOpen={!!assignOrderId}
          onClose={() => setAssignOrderId(null)}
          orderId={assignOrderId}
          onAssignSuccess={fetchOrders}
        />
      )}

    </div>
  );
};

export default OrderList;
