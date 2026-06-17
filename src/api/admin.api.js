import client from './client';

export const fetchDashboard = () => client.get('/admin/dashboard');

// Delivery Partners
export const fetchPartners = (params = {}) => client.get('/admin/deliverypartner', { params });
export const createPartner = (data) => client.post('/admin/adddp', data);
export const updatePartner = (id, data) => client.put(`/admin/editdp/${id}`, data);
export const deletePartner = (id) => client.delete(`/admin/delete_dp/${id}`);
export const fetchDpDetails = (id) => client.get(`/admin/dpDetails/${id}`);

// Customers
export const fetchCustomers = (params = {}) => client.get('/admin/customer', { params });
export const updateCustomer = (id, data) => client.put(`/admin/editcustomer/${id}`, data);
export const deleteCustomer = (id) => client.delete(`/admin/deleteCustomer/${id}`);

// PDCs
export const fetchPdcs = (params = {}) => client.get('/admin/pdc', { params });
export const activatePdc = (id) => client.put(`/admin/activatepdc/${id}`);
export const deactivatePdc = (id) => client.put(`/admin/deactivatepdc/${id}`);
export const fetchPdcDetails = (id) => client.get(`/admin/pdcdetails/${id}`);
export const updateDocumentStatus = (data) => {
  if (data.pdcId) {
    const t = data.type === 'pan' ? 'pan' : data.type; // map to 'pan', 'aadhar', 'gst', 'bank'
    if (data.status === 'rejected' || data.status === 'Reject') {
      const reasonEncoded = encodeURIComponent(data.reason || 'No reason specified');
      return client.post(`/admin/${t}_reject/${data.pdcId}/${reasonEncoded}`);
    } else {
      const val = data.status === 'approved' || data.status === 'Accept' ? 'Accept' : 'Reject';
      return client.post(`/admin/${t}_status/${data.pdcId}/${val}`);
    }
  }
  return client.post('/admin/update-document-status', data);
};
export const updatePdcLocation = (id, data) => client.post(`/admin/pdcdetail/location-update/${id}`, data);

// Broadcast settings
export const fetchBroadcast = () => client.get('/admin/broadcast');
export const createBroadcastPoint = (data) => client.post('/admin/broadcast', data);
export const updateMinBroadcastDistance = (data) => client.post('/admin/minbroadcast', data);

// Orders
export const assignDeliveryBoy = (data) => client.post('/admin/assigndeliveryboy', data);
export const fetchRatings = () => client.get('/admin/feedback');

// Charges
export const fetchCharges = () => client.get('/admin/deliver_charge');
export const updateVehicleCharges = (data) => client.post('/admin/update_deliver_charge', data);
export const updateCommission = (data) => client.post('/admin/update_delivery_partner_charge', data);
export const updatePdcCommission = (data) => client.post('/admin/update_pdc_package_charge', data);

// Payments / Finance
export const fetchPendingPayments = (params = {}) => client.get('/admin/pendingpayments', { params });
export const settlePayments = (data) => client.post('/admin/settlepayments', data);
export const fetchPastPayments = (userId = '') => client.get(`/admin/pastpaymentsview${userId ? '/' + userId : ''}`);

// Wallets
export const fetchWallets = (params = {}) => client.get('/admin/wallets', { params });
export const fetchWalletConfig = () => client.get('/admin/wallet-config');
export const fetchWalletConfigHistory = () => client.get('/admin/wallet-config/history');
export const fetchMassCreditRecipients = (logId) => client.get(`/admin/wallets/mass-credit-recipients/${logId}`);
export const updateJoiningBonus = (data) => client.post('/admin/wallet-config/joining-bonus', data);
export const verifyWalletUser = (phone) => client.get(`/admin/wallets/verify-user/${phone}`);
export const creditIndividual = (data) => client.post('/admin/wallets/credit/individual', data);
export const creditMass = (data) => client.post('/admin/wallets/credit/mass', data);
export const fetchUserTransactions = (userId) => client.get(`/admin/wallets/user-transactions/${userId}`);
export const verifyCredentials = (data) => client.post('/admin/wallets/verify-credentials', data);
export const sendOtp = (data) => client.post('/admin/wallets/send-otp', data);
export const verifyOtp = (data) => client.post('/admin/wallets/verify-otp', data);

// Reports
export const fetchReportsData = (data) => client.post('/admin/reportdata', data);
