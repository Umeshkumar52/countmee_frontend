import React, { useEffect, useState } from 'react';
import { fetchOrders } from '../../../api/orders.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';

export const PdcOrderHistory = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, delivered, cancelled
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrderHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchOrders();
      // Filter non-active orders
      const historical = response.data.filter(o => ['delivered', 'customer_cancelled', 'dp_cancelled'].includes(o.status));
      setHistoryOrders(historical);
      setFilteredOrders(historical);
    } catch (e) {
      console.error('Failed to load order history', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  // Filter based on tab clicks
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredOrders(historyOrders);
    } else if (activeTab === 'delivered') {
      setFilteredOrders(historyOrders.filter(o => o.status === 'delivered'));
    } else if (activeTab === 'cancelled') {
      setFilteredOrders(historyOrders.filter(o => ['customer_cancelled', 'dp_cancelled'].includes(o.status)));
    }
  }, [activeTab, historyOrders]);

  const headers = ['Order Number', 'Date', 'Customer Name', 'Delivery Partner', 'Amount', 'Status'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Order History</h2>
        <p className="text-xs text-slate-400 mt-1">Review your completed or cancelled parcel shipments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-2">
        {['all', 'delivered', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold capitalize transition-colors rounded-lg cursor-pointer ${
              activeTab === tab
                ? 'bg-brand-purple text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table
        headers={headers}
        data={filteredOrders}
        isLoading={isLoading}
        emptyMessage={`No ${activeTab !== 'all' ? activeTab : ''} orders found in history.`}
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
              {order.dp_name || 'N/A'}
            </td>
            <td className="px-5 py-4 text-xs font-bold text-slate-700">
              ₹ {order.amount}
            </td>
            <td className="px-5 py-4 text-xs">
              <Badge variant={order.status === 'delivered' ? 'success' : 'danger'}>
                {order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
              </Badge>
            </td>
          </tr>
        )}
      />

    </div>
  );
};

export default PdcOrderHistory;
