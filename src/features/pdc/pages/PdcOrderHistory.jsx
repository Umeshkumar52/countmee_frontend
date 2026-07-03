import React, { useEffect, useState } from 'react';
import { fetchOrders } from '../../../api/orders.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

// Shimmer block — reusable animated skeleton element
const ShimmerCell = ({ w = 'w-24' }) => (
  <td className="px-5 py-4">
    <div
      className={`h-3 ${w} rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]`}
    />
  </td>
);

// 8-column shimmer row matching the Order History table headers
const ShimmerRow = () => (
  <tr className="border-b border-slate-100">
    <ShimmerCell w="w-6" />
    <ShimmerCell w="w-20" />
    <ShimmerCell w="w-36" />
    <ShimmerCell w="w-36" />
    <ShimmerCell w="w-16" />
    <ShimmerCell w="w-12" />
    <ShimmerCell w="w-14" />
    <ShimmerCell w="w-12" />
  </tr>
);

// Reusable Star Rating Component
const StarRating = ({ value, onChange }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl focus:outline-none transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export const PdcOrderHistory = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [orderDetailsModal, setOrderDetailsModal] = useState({ isOpen: false, order: null });
  const [parcelModal, setParcelModal] = useState({ isOpen: false, order: null });
  const [rateModal, setRateModal] = useState({ isOpen: false, order: null, step: 'choice', dpType: null });
  
  // Rating Form State
  const [ratingData, setRatingData] = useState({ stars: 0, message: '' });

  const fetchOrderHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchOrders();
      // Keep all orders for history
      setHistoryOrders(response.data || []);
    } catch (e) {
      console.error('Failed to load order history', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const headers = [
    'Serial No.',
    'Order Id',
    'Pickup Location',
    'Drop Location',
    'Mode Of Transport',
    'Parcel',
    'Earnings',
    'Rate'
  ];

  // Helper to calculate total earnings from pdcEarning array
  const calculateEarnings = (raw) => {
    if (!raw || !raw.pdcEarning || !Array.isArray(raw.pdcEarning)) return 0;
    return raw.pdcEarning.reduce((sum, item) => sum + (Number(item.earnings) || 0), 0);
  };

  const handleRateSubmit = () => {
    // Note: API integration requested to be skipped. UI only.
    console.log('Submitting rating:', {
      orderId: rateModal.order?.id,
      dpType: rateModal.dpType,
      ...ratingData
    });
    alert(`Rating submitted for ${rateModal.dpType === 'delivery' ? 'Delivery' : 'Pickup'} DP!`);
    setRateModal({ isOpen: false, order: null, step: 'choice', dpType: null });
    setRatingData({ stars: 0, message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left page-transition pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Order History</h2>
        <p className="text-xs text-slate-400 mt-1">Review your completed or cancelled parcel shipments</p>
      </div>

      <div className="w-full overflow-hidden bg-white border border-slate-100 rounded-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-b from-[#9073be] to-[#522f89]">
                {headers.map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-xs font-bold capitalize tracking-wider text-white whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <ShimmerRow key={i} />
                  ))}
                </>
              ) : historyOrders.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="text-6xl mb-3">📦</div>
                      <p className="text-sm font-semibold">No Orders Yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                historyOrders.map((order, index) => {
                  const raw = order.raw || {};
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <button 
                          onClick={() => setOrderDetailsModal({ isOpen: true, order })}
                          className="font-bold text-brand-purple hover:underline bg-brand-purple/10 px-3 py-1.5 rounded-md"
                        >
                          #{order.order_number}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px]">
                        <div className="line-clamp-2" title={order.pickup_address}>
                          {order.pickup_address}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px]">
                        <div className="line-clamp-2" title={order.delivery_address}>
                          {order.delivery_address}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 capitalize">
                        {raw.mode_of_transport || 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setParcelModal({ isOpen: true, order })}
                        >
                          View
                        </Button>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-green-600">
                        ₹ {calculateEarnings(raw)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => {
                            setRateModal({ isOpen: true, order, step: 'choice', dpType: null });
                            setRatingData({ stars: 0, message: '' });
                          }}
                        >
                          Rate
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Order Details Modal */}
      <Modal
        isOpen={orderDetailsModal.isOpen}
        onClose={() => setOrderDetailsModal({ isOpen: false, order: null })}
        title="Order Details"
        size="md"
      >
        {orderDetailsModal.order && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">User ID</p>
                <p className="text-sm font-semibold text-slate-800">{orderDetailsModal.order.raw?.user_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Ordered At</p>
                <p className="text-sm font-semibold text-slate-800">{orderDetailsModal.order.created_at}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Pickup Location</p>
                <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg">{orderDetailsModal.order.pickup_address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Drop Location</p>
                <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg">{orderDetailsModal.order.delivery_address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Mode Of Transport</p>
                <p className="text-sm font-semibold text-slate-800 capitalize">{orderDetailsModal.order.raw?.mode_of_transport || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Parcel Images & Details Modal */}
      <Modal
        isOpen={parcelModal.isOpen}
        onClose={() => setParcelModal({ isOpen: false, order: null })}
        title="Parcel Images & Details"
        size="lg"
      >
        {parcelModal.order && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((num) => {
                const img = parcelModal.order.raw?.packageDetail?.[`image${num}`];
                if (!img) return null;
                // Try to resolve the image path correctly (fallback logic for local dev)
                const imgSrc = img.startsWith('http') ? img : `http://localhost:5000/uploads/${img}`;
                return (
                  <div key={num} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={imgSrc} alt={`Parcel ${num}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/placeholder-image.png'; e.target.onerror = null; }} />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Package ID</p>
                <p className="text-sm font-semibold text-slate-800">{parcelModal.order.raw?.package_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Type of Product</p>
                <p className="text-sm font-semibold text-slate-800">{parcelModal.order.raw?.packageDetail?.types_of_product || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Size</p>
                <p className="text-sm font-semibold text-slate-800">{parcelModal.order.raw?.packageDetail?.size_of_package || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">Weight</p>
                <p className="text-sm font-semibold text-slate-800">{parcelModal.order.raw?.packageDetail?.product_weight || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] capitalize text-slate-400 font-bold mb-1">No. of Items</p>
                <p className="text-sm font-semibold text-slate-800">{parcelModal.order.raw?.packageDetail?.no_of_items || parcelModal.order.items_count || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Rating Modal (Handles Choice -> Rating Form) */}
      <Modal
        isOpen={rateModal.isOpen}
        onClose={() => setRateModal({ isOpen: false, order: null, step: 'choice', dpType: null })}
        title={rateModal.step === 'choice' ? 'Rate Delivery Partner' : `Rate ${rateModal.dpType === 'delivery' ? 'Delivery' : 'Pickup'} DP`}
        size="sm"
      >
        {rateModal.order && (
          <div className="space-y-4">
            {rateModal.step === 'choice' ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-600 text-center mb-2">Who would you like to rate for this order?</p>
                <Button 
                  variant="primary" 
                  className="w-full justify-center py-3 bg-gradient-to-b from-[#9073be] to-[#522f89] border-none hover:opacity-90 transition-opacity"
                  onClick={() => setRateModal(prev => ({ ...prev, step: 'form', dpType: 'delivery' }))}
                >
                  Rate Delivery Dp
                </Button>
                <Button 
                  variant="primary" 
                  className="w-full justify-center py-3 bg-gradient-to-b from-[#9073be] to-[#522f89] border-none hover:opacity-90 transition-opacity"
                  onClick={() => setRateModal(prev => ({ ...prev, step: 'form', dpType: 'pickup' }))}
                >
                  Rate Pickup Dp
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-5 py-4">
                {/* Simulated DP Profile */}
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-brand-purple/20">
                  <span className="text-3xl">👤</span>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-slate-800 text-lg">
                    {rateModal.dpType === 'delivery' 
                      ? (rateModal.order.raw?.deliveryDp?.name || 'Delivery DP') 
                      : (rateModal.order.raw?.pickupDp?.name || 'Pickup DP')}
                  </h4>
                  <p className="text-xs text-slate-400">Order #{rateModal.order.order_number}</p>
                </div>

                <div className="py-2">
                  <StarRating 
                    value={ratingData.stars} 
                    onChange={(val) => setRatingData(prev => ({ ...prev, stars: val }))} 
                  />
                </div>

                <div className="w-full space-y-2">
                  <label className="text-xs font-bold text-slate-500 capitalize">Feedback (Optional)</label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all text-sm outline-none resize-none"
                    placeholder="Write your experience..."
                    value={ratingData.message}
                    onChange={(e) => setRatingData(prev => ({ ...prev, message: e.target.value }))}
                  ></textarea>
                </div>

                <Button 
                  variant="primary" 
                  className="w-full justify-center py-3 mt-2 bg-gradient-to-b from-[#9073be] to-[#522f89] border-none hover:opacity-90 transition-opacity disabled:opacity-50"
                  disabled={ratingData.stars === 0}
                  onClick={handleRateSubmit}
                >
                  Save Rating
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default PdcOrderHistory;
