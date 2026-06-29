import client from './client';

/**
 * Fetch the PDC's own pdcDocument (lightweight — for KYC status refresh).
 * Calls /pdc/profile which returns { document: {...} } without heavy dashboard data.
 */
export const fetchPdcProfile = () => client.get('/pdc/profile');

/**
 * Step 1 — Update inner account details (name, phone, email).
 * Sends JSON.
 */
export const updatePdcInnerRegister = (data) =>
  client.put('/pdc/inner-register-update', data);

/**
 * Step 2 — Submit KYC documents.
 * MUST be sent as FormData because it includes file uploads.
 * The caller should pass a FormData object.
 */
export const submitPdcDocuments = (formData) =>
  client.post('/pdc/submit-documents-form', formData);

/** Update PDC GPS coordinates */
export const updatePdcLocationCoords = (data) =>
  client.post('/pdc/location-update', data);

/** Fetch earnings history */
export const fetchPdcEarnings = () => client.get('/pdc/earning');

/** Rate a delivery partner */
export const rateDeliveryPartner = (data) => client.post('/pdc/rate-dp', data);

/** Toggle online / offline status */
export const toggleOnline = (id, online) =>
  client.put(`/pdc/online/${id}/${online}`);

/** Fetch PDC-specific order history */
export const fetchPdcOrders = () => client.get('/pdc/order-history');

/** Fetch PDC document verification status */
export const fetchPdcDocStatus = () => client.get('/pdc/document-status');

/** Accept/reject an assigned order */
export const updatePdcAssignedOrder = (id, acceptStatus) =>
  client.put(`/pdc/update-assigned-order/${id}/${acceptStatus}`);
