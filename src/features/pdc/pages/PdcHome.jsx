import React, { useEffect, useState } from 'react';
import { fetchPdcDashboard, actionDrop, broadcastOrder } from '../../../api/pdc.api';
import useAuth from '../../../hooks/useAuth';
import useSocket from '../../../hooks/useSocket';
import Modal from '../../../components/common/Modal';

// ── Skeleton Loaders ──────────────────────────────────────────────────────────
const TableShimmerRow = ({ cols }) => (
  <tr className="animate-pulse bg-white border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-3 text-center">
        <div className="h-4 bg-slate-200 rounded w-full mx-auto"></div>
      </td>
    ))}
  </tr>
);

const StatsSkeleton = () => (
  <div className="flex justify-evenly pt-1 animate-pulse mb-6">
    <div className="w-1/2 sm:w-1/3 lg:w-1/3 px-2">
      <div className="h-[120px] bg-slate-200 rounded-lg"></div>
    </div>
    <div className="w-1/2 sm:w-1/3 lg:w-1/3 px-2">
      <div className="h-[120px] bg-slate-200 rounded-lg"></div>
    </div>
  </div>
);

// ── Reusable// ── List Component ──────────────────────────────────────────────────────────────
const OrderTable = ({ title, orders, isLoading, onViewPackage, onViewDp, otpKey, onActionDrop, onBroadcast }) => {
  const isBroadcastTable = title === 'Orders To Broadcast';
  const headers = ['OrderId', 'User Name', 'Package Details', 'Package Count', 'Pickup Location', 'Drop Location', 'Mode of Transport'];
  if (isBroadcastTable) headers.push('Broadcast Status');
  headers.push('OTP', 'Dp Details');
  if (!isLoading && orders.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <h1 className="text-2xl font-bold text-slate-800 text-center my-3 capitalize">{title}</h1>
      <div className="w-full overflow-x-auto px-5 flex justify-center pb-[5vh]">
        <table className="w-full border-collapse table-fixed" style={{ minWidth: '1000px' }}>
          <thead>
            <tr className="bg-gradient-to-b from-[#9073be] to-[#522f89] text-center align-middle">
              {headers.map((h) => (
                <th key={h} className="text-white p-3 text-sm font-semibold whitespace-nowrap h-[10vh] capitalize">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-middle">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <TableShimmerRow key={i} cols={headers.length} />)
            ) : (
              orders.map((order, idx) => {
                const raw = order._raw || order;
                const otp = otpKey === 'drop_otp'
                  ? (raw.broadcast?.drop_otp || 'Wait for Delivery')
                  : (raw.broadcast?.pickup_otp || '-');
                
                let statusColor = "bg-slate-500";
                if (raw.broadcast?.status === "Pending") statusColor = "bg-yellow-500";
                else if (raw.broadcast?.status === "Broadcasting") statusColor = "bg-blue-500";
                else if (raw.broadcast?.status === "Accepted") statusColor = "bg-green-500";
                const stripe = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                return (
                  <tr key={order._id || order.id} className={`${stripe} hover:bg-purple-50/40 transition-colors text-center text-sm text-slate-600`}>
                    <td className="text-center p-3 font-semibold text-slate-700 max-h-[10vh] overflow-hidden">{raw.order_id || raw._id || order.id}</td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">{raw.customer?.name || raw.user_id?.name || '-'}</td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">
                      <button
                        onClick={() => onViewPackage(order)}
                        className="px-3 py-1 text-white text-sm rounded bg-gradient-to-b from-[#9073be] to-[#522f89] hover:opacity-90 transition-opacity"
                      >View</button>
                    </td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">{raw.packageDetail?.no_of_items ?? '-'}</td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">
                      <div className="max-h-[7vh] overflow-y-auto cursor-ns-resize scrollbar-thin scrollbar-thumb-purple-200">{raw.pickup_location || raw.pickup_address || '-'}</div>
                    </td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">
                      <div className="max-h-[7vh] overflow-y-auto cursor-ns-resize scrollbar-thin scrollbar-thumb-purple-200">{raw.drop_location || raw.delivery_location || '-'}</div>
                    </td>
                    <td className="text-center p-3 capitalize max-h-[10vh] overflow-hidden">{raw.mode_of_transport || '-'}</td>
                    {isBroadcastTable && (
                      <td className="text-center p-3 capitalize max-h-[10vh] overflow-hidden">
                        <span className={`px-2 py-1 text-xs text-white rounded-full ${statusColor}`}>
                          {raw.broadcast?.status || 'Pending'}
                        </span>
                      </td>
                    )}
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">
                      {raw.orderReq?.status === 'Pending' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onActionDrop(order, 'accept')}
                            className="px-3 py-1 text-white text-sm rounded bg-green-500 hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onActionDrop(order, 'reject')}
                            className="px-3 py-1 text-white text-sm rounded bg-red-500 hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (isBroadcastTable && raw.broadcast?.status === 'Pending') ? (
                        <button
                          onClick={() => onBroadcast(order)}
                          className="px-4 py-1 text-white text-sm font-bold rounded shadow bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 transition-all transform hover:scale-105"
                        >
                          Broadcast Now
                        </button>
                      ) : (
                        <button className="px-3 py-1 text-white text-sm rounded bg-gradient-to-b from-[#9073be] to-[#522f89] hover:opacity-90 transition-opacity">
                          {otp}
                        </button>
                      )}
                    </td>
                    <td className="text-center p-3 max-h-[10vh] overflow-hidden">
                      <button
                        onClick={() => onViewDp(order)}
                        className="px-3 py-1 text-white text-sm rounded bg-gradient-to-b from-[#9073be] to-[#522f89] hover:opacity-90 transition-opacity"
                      >View</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Package Details Modal ─────────────────────────────────────────────────────
const PackageModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;
  const raw = order._raw || order;
  const pkg = raw.packageDetail || {};
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const imgSrc = (img) => img ? (img.startsWith('http') ? img : `${baseUrl}/uploads/${img}`) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Package Details" size="lg">
      <div className="space-y-5">
        <div className="flex gap-3 justify-center flex-wrap">
          {[pkg.image1, pkg.image2, pkg.image3].filter(Boolean).map((img, i) => (
            <div key={i} className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={imgSrc(img)} alt={`product-image${i + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-sm text-slate-700">
          <div className="font-bold text-slate-900 col-span-1">Product Description</div>
          <div className="col-span-2 capitalize">{pkg.product_description || '-'}</div>

          <div className="font-bold text-slate-900 col-span-1">Product Weight</div>
          <div className="col-span-2 capitalize">{pkg.product_weight || '-'}</div>

          <div className="font-bold text-slate-900 col-span-1">Number of Packages</div>
          <div className="col-span-2">{pkg.no_of_items || '-'}</div>

          <div className="font-bold text-slate-900 col-span-1 capitalize">Type of Product</div>
          <div className="col-span-2">{pkg.types_of_product || '-'}</div>

          <div className="font-bold text-slate-900 col-span-1">Size of Package</div>
          <div className="col-span-2">{pkg.size_of_package || '-'}</div>
        </div>
      </div>
    </Modal>
  );
};

// ── Single DP Details Modal ───────────────────────────────────────────────────
const DpModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;
  const raw = order._raw || order;
  const req = raw.orderReq || {};
  const effectiveDp = raw.effectiveDp || req.dp || req.requestedUser || {};
  const effectiveDpLoc = raw.effectiveDpLoc || req.dpLocation || req.requestedDpLocation || {};
  console.log("DpModal raw object:", raw);
  console.log("effectiveDp:", effectiveDp);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const imgSource = raw.dpProfileImg || effectiveDpLoc.profile_img;
  const dpImg = imgSource ? (imgSource.startsWith('http') ? imgSource : `${baseUrl}/uploads/${imgSource}`) : '/default-user.png';

  const stars = raw.stars ?? effectiveDpLoc.rating?.avg?.stars ?? 0;
  const fullStars = Math.floor(stars);
  const halfStar = stars - fullStars > 0;
  const blankStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delivery Partner Details" size="sm">
      <div className="flex justify-center mb-4">
        <img src={dpImg} className="w-32 h-32 rounded-full object-cover border-4 border-slate-100" alt="DP" onError={(e) => { e.target.src = '/default-user.png'; }} />
      </div>
      <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm text-slate-700">
        <div className="font-bold text-slate-900 col-span-1">Name</div>
        <div className="col-span-2">{effectiveDp.name || '-'}</div>

        <div className="font-bold text-slate-900 col-span-1">Gender</div>
        <div className="col-span-2">{effectiveDpLoc.gender || effectiveDp.gender || '-'}</div>

        <div className="font-bold text-slate-900 col-span-1">Phone</div>
        <div className="col-span-2">{effectiveDp.phone || '-'}</div>

        <div className="font-bold text-slate-900 col-span-1">Rating</div>
        <div className="col-span-2 flex items-center text-yellow-400">
          {Array.from({ length: fullStars }).map((_, i) => <span key={`f${i}`}>★</span>)}
          {halfStar && <span className="text-yellow-300">½</span>}
          {Array.from({ length: blankStars }).map((_, i) => <span key={`b${i}`} className="text-slate-200">★</span>)}
        </div>
      </div>
    </Modal>
  );
};

// ── DP List Modal (For Broadcast) ─────────────────────────────────────────────
const DpListModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;
  const raw = order._raw || order;
  const list = raw.broadcast?.dpUsersList || raw.orderReqList || [];
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delivery Partner Details" size="lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-b from-[#9073be] to-[#522f89] text-white">
              <th className="p-3">Partner Profile</th>
              <th className="p-3">Name</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {list.map((req, i) => {
              const dp = req.dp || req.requestedUser || req || {};
              const loc = req.dpLocation || req.requestedDpLocation || req.dpDetail || {};
              const imgSource = req.dpProfileImg || loc.profile_img;
              const dpImg = imgSource ? (imgSource.startsWith('http') ? imgSource : `${baseUrl}/uploads/${imgSource}`) : '/default-user.png';
              const stars = req.stars ?? loc.rating?.avg?.stars ?? 0;
              const fullStars = Math.floor(stars);
              const halfStar = stars - fullStars > 0;
              const blankStars = 5 - fullStars - (halfStar ? 1 : 0);

              return (
                <tr key={i} className="border-b border-slate-100 text-center">
                  <td className="p-3 flex justify-center">
                    <img src={dpImg} className="w-16 h-16 rounded-full object-cover border border-slate-200" alt="DP" onError={(e) => { e.target.src = '/default-user.png'; }} />
                  </td>
                  <td className="p-3 font-semibold">{dp.name || '-'}</td>
                  <td className="p-3">{loc.gender || dp.gender || '-'}</td>
                  <td className="p-3">{dp.phone || '-'}</td>
                  <td className="p-3 text-yellow-400">
                    {Array.from({ length: fullStars }).map((_, idx) => <span key={`f${idx}`}>★</span>)}
                    {halfStar && <span className="text-yellow-300">½</span>}
                    {Array.from({ length: blankStars }).map((_, idx) => <span key={`b${idx}`} className="text-slate-200">★</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export const PdcHome = () => {
  const { user } = useAuth();
  const [ordersToReceive, setOrdersToReceive] = useState([]);
  const [ordersToBroadcast, setOrdersToBroadcast] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [dpModalOpen, setDpModalOpen] = useState(false);
  const [dpListModalOpen, setDpListModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetchPdcDashboard();
      const data = response.data?.data || response.data || {};
      
      setOrdersToReceive(data.ordersToReceive || []);
      setOrdersToBroadcast(data.broadcastedOrders || []);
      setTotalOrders(data.totalOrders || 0);
      setPendingOrders(data.pendingOrders || 0);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionDrop = async (order, action) => {
    try {
      setIsLoading(true);
      await actionDrop({ order_id: order._id || order._raw?._id, action });
      fetchDashboard();
    } catch (error) {
      console.error(`Failed to ${action} drop-off:`, error);
      alert(error.response?.data?.message || `Failed to ${action} drop-off`);
      setIsLoading(false);
    }
  };

  const handleBroadcast = async (order) => {
    try {
      setIsLoading(true);
      const res = await broadcastOrder({ order_id: order._id || order._raw?._id });
      fetchDashboard();
      alert(res.data?.message || 'Broadcast successful!');
    } catch (error) {
      console.error('Failed to broadcast:', error);
      alert(error.response?.data?.message || 'Failed to broadcast order');
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);
  useSocket('order:assigned', fetchDashboard);
  useSocket('order:created', fetchDashboard);
  useSocket('notification:received', fetchDashboard);

  return (
    <div className="w-full space-y-6 text-left page-transition pb-10">

      {/* ── Stat Cards — matching PHP col-6 col-sm-4 evenly spaced ──────── */}
      {isLoading ? <StatsSkeleton /> : (
        <div className="flex justify-evenly pt-1 mb-6">
          <div className="w-1/2 sm:w-1/3 lg:w-1/3 px-2">
            <div className="p-4 text-center rounded-lg shadow-none" style={{ backgroundColor: '#f8d7da' }}>
              <img src="/dist/images/svgs/icon-favorites.svg" width="50" height="50" className="mb-6 mx-auto" alt="" />
              <p className="font-semibold text-red-600 mb-1 text-sm capitalize">Total Orders</p>
              <h4 className="font-semibold text-red-600 text-xl m-0">{totalOrders}</h4>
            </div>
          </div>
          <div className="w-1/2 sm:w-1/3 lg:w-1/3 px-2">
            <div className="p-4 text-center rounded-lg shadow-none" style={{ backgroundColor: '#d4edda' }}>
              <img src="/dist/images/svgs/icon-speech-bubble.svg" width="50" height="50" className="mb-6 mx-auto" alt="" />
              <p className="font-semibold text-green-700 mb-1 text-sm capitalize">Pending Orders</p>
              <h4 className="font-semibold text-green-700 text-xl m-0">{pendingOrders}</h4>
            </div>
          </div>
        </div>
      )}

      {/* ── No Orders Empty State ────────────────────────────────────────── */}
      {!isLoading && ordersToReceive.length === 0 && ordersToBroadcast.length === 0 && (
        <div className="flex flex-col items-center justify-center mx-auto rounded-[15px] overflow-hidden relative shadow-lg" 
             style={{ background: 'linear-gradient(135deg, #6fd3f7 0%, #7de2d1 100%)', height: '50vh', width: '76vw', transition: 'all 0.3s ease' }}>
          <img src="/dist/images/backgrounds/empty_box.png" alt="" className="w-[120px] mb-[30px] z-10" />
          <div className="text-white text-2xl font-bold animate-pulse z-10 capitalize">No Orders Available</div>
        </div>
      )}

      {/* ── Orders To Receive ──────────────────────────────────────────── */}
      <OrderTable
        title="Orders To Receive"
        orders={ordersToReceive}
        isLoading={isLoading}
        onViewPackage={(o) => { setSelectedOrder(o); setPackageModalOpen(true); }}
        onViewDp={(o) => { setSelectedOrder(o); setDpModalOpen(true); }}
        otpKey="drop_otp"
        onActionDrop={handleActionDrop}
      />

      {/* ── Orders To Broadcast ────────────────────────────────────────── */}
      <OrderTable
        title="Orders To Broadcast"
        orders={ordersToBroadcast}
        isLoading={isLoading}
        onViewPackage={(o) => { setSelectedOrder(o); setPackageModalOpen(true); }}
        onViewDp={(o) => { setSelectedOrder(o); setDpListModalOpen(true); }}
        otpKey="pickup_otp"
        onBroadcast={handleBroadcast}
      />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <PackageModal isOpen={packageModalOpen} onClose={() => setPackageModalOpen(false)} order={selectedOrder} />
      <DpModal isOpen={dpModalOpen} onClose={() => setDpModalOpen(false)} order={selectedOrder} />
      <DpListModal isOpen={dpListModalOpen} onClose={() => setDpListModalOpen(false)} order={selectedOrder} />

    </div>
  );
};

export default PdcHome;
