import client from "./client";

export const fetchDashboard = () => client.get("/admin/dashboard");

// Delivery Partners
export const fetchPartners = (params = {}) => {
  if (!params?.search) {
    params = {};
  }
  return client.get("/admin/deliverypartner", { params });
};
export const createPartner = (data) => client.post("/admin/adddp", data);
export const bulkAddPartner = (data) => client.post("/admin/bulk-adddp", data);
export const updatePartner = (id, data) =>
  client.put(`/admin/editdp/${id}`, data);
export const blockDpAPI = (id, data) => 
  client.put(`/admin/block_dp/${id}`, data);
export const deletePartner = (id) => client.delete(`/admin/delete_dp/${id}`);
export const fetchDpDetails = (id) => client.get(`/admin/dpDetails/${id}`);

// Customers
export const fetchCustomers = (params = {}) => {
  if (!params?.search) {
    params = {};
  }
  return client.get("/admin/customer", { params });
};
export const updateCustomer = (id, data) =>
  client.put(`/admin/editcustomer/${id}`, data);
export const deleteCustomer = (id) =>
  client.delete(`/admin/deleteCustomer/${id}`);

// PDCs
export const fetchPdcs = (params = {}) => {
  if (!params?.search) {
    params = {};
  }
  return client.get("/admin/pdc", { params });
};
export const activatePdc = (id) => client.put(`/admin/activatepdc/${id}`);
export const deactivatePdc = (id) => client.put(`/admin/deactivatepdc/${id}`);
export const fetchPdcDetails = (id) => client.get(`/admin/pdcdetails/${id}`);
export const adminAddPdc = (data) =>
  client.post("/admin/addpdc", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateDocumentStatus = (data) => {
  if (data.pdcId) {
    const t = data.type === "pan" ? "pan" : data.type; // map to 'pan', 'aadhar', 'gst', 'bank'
    if (data.status === "rejected" || data.status === "Reject") {
      const reasonEncoded = encodeURIComponent(
        data.reason || "No reason specified",
      );
      return client.post(`/admin/${t}_reject/${data.pdcId}/${reasonEncoded}`);
    } else {
      const val =
        data.status === "approved" || data.status === "Accept"
          ? "Accept"
          : "Reject";
      return client.post(`/admin/${t}_status/${data.pdcId}/${val}`);
    }
  }
  return client.post("/admin/update-document-status", data);
};
export const updatePdcLocation = (id, data) =>
  client.post(`/admin/pdcdetail/location-update/${id}`, data);

// Broadcast settings
export const fetchBroadcast = () => client.get("/admin/broadcast");
export const createBroadcastPoint = (data) =>
  client.post("/admin/broadcast", data);
export const updateMinBroadcastDistance = (data) =>
  client.post("/admin/minbroadcast", data);

// Orders
export const assignDeliveryBoy = (data) =>
  client.post("/admin/assigndeliveryboy", data);
export const fetchRatings = (role, page, limit) =>
  client.get("/admin/feedback", { params: { role, page, limit } });

// Charges
export const fetchCharges = () => client.get("/admin/deliver_charge");
export const updateVehicleCharges = (data) =>
  client.post("/admin/deliver_charge", data);

export const updateDpApprovalStatus = (data) =>
  client.post("/admin/update-action", data);

export const updateDpDocumentStatusAPI = (data) =>
  client.post("/admin/update-document-status", data);

// Payments / Finance
export const fetchPendingPayments = (params = {}) =>
  client.get("/admin/pendingpayments", { params });
export const fetchAdminWaitingCharges = (params = {}) =>
  client.get("/admin/waitingcharges", { params });
export const fetchLatePaidWaitingCharges = () =>
  client.get("/admin/latepaidwaitingcharges");
export const settlePayments = (data) =>
  client.post("/admin/settlepayments", data);
export const fetchPastPayments = (userId = "") =>
  client.get(`/admin/pastpaymentsview${userId ? "/" + userId : ""}`);

// Wallets
export const fetchWallets = (params = {}) =>
  client.get("/admin/wallets", { params });
export const fetchWalletConfig = () => client.get("/admin/wallet-config");
export const fetchWalletConfigHistory = () =>
  client.get("/admin/wallet-config/history");
export const fetchMassCreditRecipients = (logId) =>
  client.get(`/admin/wallets/mass-credit-recipients/${logId}`);
export const updateJoiningBonus = (data) =>
  client.post("/admin/wallet-config/joining-bonus", data);
export const verifyWalletUser = (phone) =>
  client.get(`/admin/wallets/verify-user/${phone}`);
export const creditIndividual = (data) =>
  client.post("/admin/wallets/credit/customer", data);
export const creditMass = (data) =>
  client.post("/admin/wallets/credit/mass", data);
export const fetchUserTransactions = (userId) =>
  client.get(`/admin/wallets/user-transactions/${userId}`);
export const verifyCredentials = (data) =>
  client.post("/admin/wallets/verify-credentials", data);
export const sendOtp = (data) => client.post("/admin/wallets/send-otp", data);
export const verifyOtp = (data) =>
  client.post("/admin/wallets/verify-otp", data);

// Reports
export const fetchReportsData = (data) =>
  client.post("/admin/reportdata", data);

// Vehicle Subcategories
export const fetchVehicleConfigurations = () =>
  client.get("/admin/vehicleTypes?type=all");
export const fetchVehicleSubcategoriesByType = (type) =>
  client.get(`/admin/vehicleTypes?type=${encodeURIComponent(type)}`);
export const createVehicleConfiguration = (data) =>
  client.post("/admin/vehicle_subcategories", data);
export const updateVehicleConfiguration = (id, data) =>
  client.put(`/admin/vehicle_subcategories/${id}`, data);
export const deleteVehicleConfiguration = (id) =>
  client.delete(`/admin/vehicle_subcategories/${id}`);

// Refunds
export const processManualRefund = (data) => 
  client.post("/admin/refund-order", data);

// Manual Broadcast
export const broadcastOrderManual = (orderId) =>
  client.post(`/admin/orders/${orderId}/broadcast`);

// Bundles and Nearest DP
export const fetchNearestDps = (orderIds) =>
  client.post("/admin/orders/nearest-dps", { orderIds });
export const assignBundle = (orderIds, dp_id) =>
  client.post("/admin/orders/assign-bundle", { orderIds, dp_id });

export const fetchBundleSummary = (orderIds) =>
  client.post("/admin/orders/bundle-summary", { orderIds });

// DP Cancellation Penalty System
export const fetchDpCancellations = (params) =>
  client.get("/admin/dp-cancellations", { params });
export const fetchCancellationSetting = () =>
  client.get("/admin/cancellation-setting");
export const updateCancellationSetting = (data) =>
  client.put("/admin/cancellation-setting", data);
export const unblockDp = (dpId) =>
  client.put(`/admin/unblock-dp/${dpId}`);
