// Mock Database for CountMe Frontend Migration
// Stores local state in localStorage to persist operations across page refreshes

const DEFAULT_DB = {
  users: [
    { id: 1, name: "Admin User", email: "admin@gmail.com", phone: "9999999999", role: "admin" },
    { id: 2, name: "PDC Partner One", email: "pdc1@gmail.com", phone: "9999955555", role: "pdc" },
    { id: 3, name: "PDC Partner Two", email: "pdc2@gmail.com", phone: "8888888888", role: "pdc" }
  ],
  pdcDocuments: [
    {
      id: 1,
      user_id: 2,
      profile_image: "user-1.jpg",
      online: 1,
      aadhar_status: "approved", // approved, rejected, pending, null
      aadhar_reject_reason: "",
      pan_status: "approved",
      pan_reject_reason: "",
      gst_status: "approved",
      gst_reject_reason: "",
      bank_status: "approved",
      bank_reject_reason: "",
      latitude: "28.6139",
      longitude: "77.2090",
      city: "New Delhi",
      address: "Connaught Place, Sector 1",
      account_no: "33948201948",
      ifsc: "HDFC0000123"
    },
    {
      id: 2,
      user_id: 3,
      profile_image: "user-1.jpg",
      online: 0,
      aadhar_status: "pending",
      aadhar_reject_reason: "",
      pan_status: "pending",
      pan_reject_reason: "",
      gst_status: "null",
      gst_reject_reason: "",
      bank_status: "null",
      bank_reject_reason: "",
      latitude: "28.5355",
      longitude: "77.3910",
      city: "Noida",
      address: "Sector 62, Noida",
      account_no: "50294820194",
      ifsc: "ICIC0000456"
    }
  ],
  deliveryPartners: [
    { id: 101, name: "Rahul Kumar", phone: "9876543210", email: "rahul@gmail.com", status: "active", vehicle: "Bike", rating: 4.5, active_orders: 1, bank_name: "State Bank of India", bank_acc_number: "30294820194", bank_ifsc: "SBIN0001234" },
    { id: 102, name: "Amit Sharma", phone: "8765432109", email: "amit@gmail.com", status: "active", vehicle: "Scooty", rating: 4.2, active_orders: 0, bank_name: "HDFC Bank", bank_acc_number: "50100482019", bank_ifsc: "HDFC0000234" },
    { id: 103, name: "Suresh Singh", phone: "7654321098", email: "suresh@gmail.com", status: "inactive", vehicle: "E-Rickshaw", rating: 3.8, active_orders: 0, bank_name: "ICICI Bank", bank_acc_number: "00029482019", bank_ifsc: "ICIC0000345" }
  ],
  customers: [
    { id: 201, name: "John Doe", email: "john@gmail.com", phone: "9512345670", status: "active" },
    { id: 202, name: "Pooja Gupta", email: "pooja@gmail.com", phone: "9423456781", status: "active" },
    { id: 203, name: "Vikram Malhotra", email: "vikram@gmail.com", phone: "9334567892", status: "inactive" }
  ],
  orders: [
    {
      id: 5001,
      order_number: "ORD-98231",
      customer_name: "John Doe",
      customer_phone: "9512345670",
      pdc_id: 2,
      pdc_name: "PDC Partner One",
      dp_id: 101,
      dp_name: "Rahul Kumar",
      status: "assigned", // pending, assigned, intransit, delivered, customer_cancelled, dp_cancelled, broadcasted
      pickup_address: "PDC Hub - Sector 1, Connaught Place",
      delivery_address: "Block B, Room 402, Outer Ring Road, Delhi",
      items_count: 3,
      amount: 450,
      payment_status: "pending", // pending, paid, settled
      drop_otp: "4819",
      created_at: "2026-06-12 10:30:00",
      broadcast_id: 1
    },
    {
      id: 5002,
      order_number: "ORD-98232",
      customer_name: "Pooja Gupta",
      customer_phone: "9423456781",
      pdc_id: 2,
      pdc_name: "PDC Partner One",
      dp_id: null,
      dp_name: null,
      status: "pending",
      pickup_address: "PDC Hub - Sector 1, Connaught Place",
      delivery_address: "A-56, Greater Kailash, Delhi",
      items_count: 1,
      amount: 150,
      payment_status: "pending",
      drop_otp: "7721",
      created_at: "2026-06-12 11:15:00",
      broadcast_id: null
    },
    {
      id: 5003,
      order_number: "ORD-98233",
      customer_name: "Vikram Malhotra",
      customer_phone: "9334567892",
      pdc_id: 2,
      pdc_name: "PDC Partner One",
      dp_id: 101,
      dp_name: "Rahul Kumar",
      status: "delivered",
      pickup_address: "PDC Hub - Sector 1, Connaught Place",
      delivery_address: "Flat 12B, Green Park, Delhi",
      items_count: 5,
      amount: 980,
      payment_status: "settled",
      drop_otp: "9910",
      created_at: "2026-06-11 14:00:00",
      broadcast_id: 2
    },
    {
      id: 5004,
      order_number: "ORD-98234",
      customer_name: "Ramesh Sen",
      customer_phone: "9123456789",
      pdc_id: 2,
      pdc_name: "PDC Partner One",
      dp_id: null,
      dp_name: null,
      status: "broadcasted",
      pickup_address: "PDC Hub - Sector 1, Connaught Place",
      delivery_address: "Vasant Kunj, Sector B, Delhi",
      items_count: 2,
      amount: 320,
      payment_status: "pending",
      drop_otp: "2201",
      created_at: "2026-06-12 13:45:00",
      broadcast_id: 3
    }
  ],
  broadcasts: [
    { id: 1, name: "Connaught Place Point", radius: 5000, active: true, lat: 28.6139, lon: 77.2090 },
    { id: 2, name: "Noida Hub Point", radius: 7000, active: true, lat: 28.5355, lon: 77.3910 }
  ],
  minBroadcastDistance: 3, // in km
  feedbacks: [
    { id: 1, user_name: "John Doe", role: "customer", rating: 5, comment: "Amazing delivery speeds, very reliable!" },
    { id: 2, user_name: "PDC Partner One", role: "pdc", rating: 4, comment: "The delivery partner was polite." }
  ],
  walletTransactions: [
    { id: 1001, user_id: 2, user_name: "PDC Partner One", type: "credit", amount: 500, description: "Joining Bonus Credited", created_at: "2026-06-10 09:00:00" },
    { id: 1002, user_id: 2, user_name: "PDC Partner One", type: "credit", amount: 120, description: "Payout for ORD-98233", created_at: "2026-06-11 18:30:00" }
  ],
  walletConfig: {
    joining_bonus: 500
  },
  charges: {
    delivery_charge: 50,
    delivery_partner_charge: 35,
    pdc_package_charge: 15,
    vehicle_charges: [
      { id: 1, vehicle_type: "By Hand", base_distance: 2, base_price: 30, per_km_price: 10 },
      { id: 2, vehicle_type: "Two Wheeler", base_distance: 3, base_price: 45, per_km_price: 12 },
      { id: 3, vehicle_type: "Three Wheeler", base_distance: 5, base_price: 100, per_km_price: 18 },
      { id: 4, vehicle_type: "Four Wheeler", base_distance: 5, base_price: 200, per_km_price: 25 }
    ],
    dp_commission: 35,
    pdc_commission: 15
  },
  walletConfigHistory: [
    { id: 1, key: "joining_bonus", old_value: "300", new_value: "500", admin_name: "Admin User", created_at: "2026-06-10 09:00:00" }
  ],
  massCreditLogs: [
    { id: 1, amount: 100, user_count: 3, description: "Festive Bonus", admin_name: "Admin User", created_at: "2026-06-11 10:00:00" }
  ],
  massCreditRecipients: [
    { id: 1, log_id: 1, name: "John Doe", phone: "9512345670", amount: 100, created_at: "2026-06-11 10:00:00" },
    { id: 2, log_id: 1, name: "Pooja Gupta", phone: "9423456781", amount: 100, created_at: "2026-06-11 10:00:00" },
    { id: 3, log_id: 1, name: "Vikram Malhotra", phone: "9334567892", amount: 100, created_at: "2026-06-11 10:00:00" }
  ],
  dpPayouts: [
    { id: 1, dp_auth_id: 101, order_id: 5001, amount: 80, settled: 0, created_at: "2026-06-12 10:30:00" },
    { id: 2, dp_auth_id: 101, order_id: 5002, amount: 95, settled: 0, created_at: "2026-06-12 11:15:00" },
    { id: 3, dp_auth_id: 102, order_id: 5003, amount: 75, settled: 0, created_at: "2026-06-11 14:00:00" }
  ],
  pdcPayouts: [
    { id: 1, pdc_auth_id: 2, order_id: 5001, amount: 20, settled: 0, created_at: "2026-06-12 10:30:00" },
    { id: 2, pdc_auth_id: 2, order_id: 5002, amount: 15, settled: 0, created_at: "2026-06-12 11:15:00" },
    { id: 3, pdc_auth_id: 3, order_id: 5004, amount: 18, settled: 0, created_at: "2026-06-12 13:45:00" }
  ],
  adminPayouts: [
    { id: 1, user_id: 2, order_id: [5003], settled_amount: 15, created_at: "2026-06-11 18:30:00" }
  ],
  notifications: [
    { id: 1, notifiable_type: "admin", title: "New PDC Registered", message: "PDC Partner Two has registered and submitted Aadhar/PAN.", read_at: null, created_at: "2026-06-12 12:00:00" },
    { id: 2, notifiable_type: "pdc", user_id: 2, title: "Documents Verified", message: "Congratulations! Your Aadhar, PAN, and Bank details are approved.", read_at: null, created_at: "2026-06-12 09:30:00" }
  ]
};

// Local storage keys
const KEY_DB = "countme_mock_db";
const KEY_SESSION = "countme_session";

export const getDb = () => {
  const db = localStorage.getItem(KEY_DB);
  if (!db) {
    localStorage.setItem(KEY_DB, JSON.stringify(DEFAULT_DB));
    return DEFAULT_DB;
  }
  const parsed = JSON.parse(db);
  let updated = false;
  for (const key in DEFAULT_DB) {
    if (parsed[key] === undefined) {
      parsed[key] = DEFAULT_DB[key];
      updated = true;
    }
  }
  // Also merge sub-keys for charges
  if (parsed.charges) {
    for (const key in DEFAULT_DB.charges) {
      if (parsed.charges[key] === undefined) {
        parsed.charges[key] = DEFAULT_DB.charges[key];
        updated = true;
      }
    }
  }
  if (updated) {
    localStorage.setItem(KEY_DB, JSON.stringify(parsed));
  }
  return parsed;
};

export const saveDb = (db) => {
  localStorage.setItem(KEY_DB, JSON.stringify(db));
};

export const getSession = () => {
  return JSON.parse(localStorage.getItem(KEY_SESSION));
};

export const saveSession = (session) => {
  localStorage.setItem(KEY_SESSION, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(KEY_SESSION);
};
