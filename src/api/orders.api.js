import client from './client';

const mapOrder = (o) => {
  if (!o) return null;
  return {
    id: o._id,
    order_number: o.order_id || o._id,
    customer_name: o.user_id?.name || o.sender_name || 'N/A',
    customer_phone: o.user_id?.phone || o.sender_phone || 'N/A',
    pickup_address: o.pickup_address || o.pickup_location || 'N/A',
    delivery_address: o.delivery_address || o.delivery_location || 'N/A',
    pdc_name: o.pdc_id?.shop_name || o.pdc_name || 'Direct',
    dp_name: o.pickup_dp_id?.name || o.delivery_dp_id?.name || o.dp_name || '',
    amount: o.charges || o.amount || 0,
    status: (() => {
      let st = o.status;
      if (typeof st === 'number') {
        const sm = { 0: 'pending', 1: 'assigned', 2: 'cancelled', 3: 'intransit', 4: 'delivered' };
        return sm[st] || 'pending';
      }
      return typeof st === 'string' ? st.toLowerCase() : 'pending';
    })(),
    drop_otp: o.drop_otp || '',
    items_count: o.items_count || 1,
    payment_status: o.payment_status || (o.payment_settled ? 'settled' : 'pending'),
    created_at: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : (o.created_at || 'N/A'),
    packageDetail: o.package_id || null
  };
};

export const fetchOrders = async (params = {}) => {
  const sessionStr = localStorage.getItem('countme_session');
  let url = '/admin/orders';
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      const userType = session?.user?.user_type || session?.user?.role;
      if (userType === 'PDC') {
        url = '/pdc/order-history';
      }
    } catch (e) {
      console.error('Failed to parse session for role-aware fetchOrders', e);
    }
  }

  const response = await client.get(url, { params });
  const data = response.data.data || response.data;
  const rawOrders = data.orders || data.allorders || data.pending || data.assign || data.detail || data || [];
  return {
    ...response,
    data: Array.isArray(rawOrders) ? rawOrders.map(mapOrder) : []
  };
};

const fetchOrdersFromUrl = async (url) => {
  const response = await client.get(url);
  const data = response.data.data || response.data;
  const rawOrders = data.orders || data.allorders || data.pending || data.assign || data.detail || data || [];
  return {
    ...response,
    data: Array.isArray(rawOrders) ? rawOrders.map(mapOrder) : []
  };
};

export const fetchAllOrders = () => fetchOrdersFromUrl('/admin/allorders');
export const fetchPendingOrders = () => fetchOrdersFromUrl('/admin/pendingorders');
export const fetchAssignedOrders = () => fetchOrdersFromUrl('/admin/assignedorders');
export const fetchIntransitOrders = () => fetchOrdersFromUrl('/admin/intransitorders');
export const fetchDeliveredOrders = () => fetchOrdersFromUrl('/admin/orders/delivered');
export const fetchBroadcastedOrders = () => fetchOrdersFromUrl('/admin/orders/broadcasted');
export const fetchCancelledOrders = async () => {
  const [custRes, dpRes] = await Promise.all([
    client.get('/admin/customerCancelledOrders'),
    client.get('/admin/dpcancelledorders')
  ]);
  const custData = custRes.data.data?.orders || custRes.data.data?.detail || custRes.data.data || [];
  const dpData = dpRes.data.data?.orders || dpRes.data.data?.pending || dpRes.data.data || [];
  const merged = [...(Array.isArray(custData) ? custData : []), ...(Array.isArray(dpData) ? dpData : [])];
  return { data: merged.map(mapOrder) };
};

export const fetchOrderDetails = async (id) => {
  const response = await client.get(`/admin/orderview/${id}`);
  const data = response.data.data || response.data;
  const rawOrder = data.order || data;
  return {
    ...response,
    data: mapOrder(rawOrder)
  };
};
