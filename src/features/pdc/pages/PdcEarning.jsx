import toast from 'react-hot-toast';
import  { useEffect, useState } from 'react';
import { fetchPdcEarnings } from '../../../api/pdc.api';

// --- Shimmer Skeleton Components ---
const ShimmerBlock = ({ className = '' }) => (
  <div className={`bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:400%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] rounded-lg ${className}`} />
);

const CardsSkeleton = () => (
  <div className="grid grid-cols-3 gap-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="rounded-2xl border-2 border-slate-100 bg-white p-4 sm:p-6 space-y-3">
        <ShimmerBlock className="h-3 w-3/4 mx-auto" />
        <ShimmerBlock className="h-7 w-1/2 mx-auto" />
      </div>
    ))}
  </div>
);

const PayoutCardSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
    <div className="bg-slate-100 px-4 py-3 flex items-center justify-between">
      <ShimmerBlock className="h-3 w-24" />
      <ShimmerBlock className="h-5 w-20 rounded-full" />
    </div>
    <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`${i >= 2 && i <= 3 ? 'col-span-2 sm:col-span-1' : 'col-span-2'} space-y-2`}>
          <ShimmerBlock className="h-2 w-2/5" />
          <ShimmerBlock className="h-4 w-4/5" />
        </div>
      ))}
      <div className="col-span-2 bg-slate-50 rounded-xl px-4 py-3">
        <ShimmerBlock className="h-2 w-1/5 mb-2" />
        <ShimmerBlock className="h-6 w-2/5" />
      </div>
    </div>
  </div>
);

const StarDisplay = ({ stars = 0 }) => {
  const rating = Math.round(Number(stars) || 0);
  return (
    <div className="flex gap-0.5 text-lg">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-400" : "text-slate-300"}>★</span>
      ))}
    </div>
  );
};

// --- Payout Detail Card (matches PHP card layout) ---
const PayoutCard = ({ payout }) => {
  if (!payout) return null;
  const order = payout.order || {};
  const parcelType = order.packageDetail?.types_of_product || order.packageDetail?.product_type || 'N/A';
  const dropDpName = payout.dp?.requestedUser?.name || payout.dp?.name || 'N/A';
  const dropDpId = payout.dp?.requestedUser?._id || payout.dp?._id || null;
  const receivingTime = payout.dp?.updated_at || payout.dp?.created_at || payout.dp?.updatedAt || payout.dp?.createdAt || null;
  const dropDpStars = payout.dp?.stars || 0;

  const pickupDpName = payout.broadcast?.dpUser?.name || 'N/A';
  const pickupDpId = payout.broadcast?.dpUser?._id || null;
  const sendingTime = payout.broadcast?.updated_at || payout.broadcast?.created_at || payout.broadcast?.updatedAt || payout.broadcast?.createdAt || null;
  const pickupDpStars = payout.broadcast?.stars || 0;

  const formatDate = (dt) =>
    dt
      ? new Date(dt).toLocaleString('en-IN', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
      : 'N/A';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Card header — purple gradient matching PHP */}
      <div className="bg-gradient-to-b from-[#9073be] to-[#522f89] px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-white capitalize tracking-wide">Parcel Type</span>
        <span className="text-xs font-semibold text-white/90 bg-white/10 px-3 py-1 rounded-full">{parcelType}</span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
        {/* Drop DP */}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Drop Delivery Partner Name</p>
          <p className="text-sm font-semibold text-slate-800">{dropDpName}</p>
          {dropDpId && <p className="text-[9px] text-slate-500 font-mono mt-0.5" title="Partner ID">ID: {dropDpId}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Receiving Timing</p>
          <p className="text-sm text-slate-600">{formatDate(receivingTime)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Rating</p>
          <StarDisplay stars={dropDpStars} />
        </div>

        <div className="col-span-2 border-t border-slate-100 my-1"></div>

        {/* Pickup DP */}
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Receiver Delivery Partner Name</p>
          <p className="text-sm font-semibold text-slate-800">{pickupDpName}</p>
          {pickupDpId && <p className="text-[9px] text-slate-500 font-mono mt-0.5" title="Partner ID">ID: {pickupDpId}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Sending Timing</p>
          <p className="text-sm text-slate-600">{formatDate(sendingTime)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Rating</p>
          <StarDisplay stars={pickupDpStars} />
        </div>

        {/* Earning amount */}
        <div className="col-span-2 bg-[#f8f4ff] rounded-xl px-4 py-3 mt-1">
          <p className="text-[10px] capitalize font-bold text-[#5d3c96] mb-1">Earning</p>
          <p className="text-xl font-extrabold text-[#522f89]">Rs. {payout.earnings ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
export const PdcEarning = () => {
  const [earningsData, setEarningsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('last'); // 'last' | 'today'

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await fetchPdcEarnings();
      const data = response.data?.data || response.data;
      setEarningsData(data);
    } catch (e) {
      console.error('Failed to load earnings', e);
      toast.error("Failed to load earnings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const totalEarning = earningsData?.totalEarning ?? 0;
  const lastEarning = earningsData?.lastEarning ?? 0;
  const pdcPayLast = earningsData?.pdcPayLast ?? null;
  const todayEarnings = earningsData?.todayEarnings ?? [];
  const todayTotal = todayEarnings.reduce((sum, t) => sum + (Number(t.earnings) || 0), 0);

  return (
    <div className="w-full space-y-6 text-left page-transition pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Earnings</h2>
        <p className="text-xs text-slate-400 mt-1">Track your payout history and daily performance</p>
      </div>

      {/* Summary Cards — shimmer while loading */}
      {isLoading ? (
        <CardsSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {/* Last Earning Card — clickable */}
          <div
            onClick={() => setActiveView('last')}
            className={`text-center cursor-pointer rounded-2xl border-2 p-4 sm:p-6 transition-all select-none ${
              activeView === 'last'
                ? 'border-[#9073be] bg-[#f8f4ff] shadow-md'
                : 'border-slate-100 bg-white shadow-sm hover:border-[#c9b3e6]'
            }`}
          >
            <p className="text-xs sm:text-sm font-bold text-[#5d3c96] mb-1 sm:mb-2">Last Earning</p>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-800">₹ {lastEarning}</p>
          </div>

          {/* Today's Earning Card — clickable */}
          <div
            onClick={() => setActiveView('today')}
            className={`text-center cursor-pointer rounded-2xl border-2 p-4 sm:p-6 transition-all select-none ${
              activeView === 'today'
                ? 'border-[#9073be] bg-[#f8f4ff] shadow-md'
                : 'border-slate-100 bg-white shadow-sm hover:border-[#c9b3e6]'
            }`}
          >
            <p className="text-xs sm:text-sm font-bold text-[#5d3c96] mb-1 sm:mb-2">Today's Earning</p>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-800">₹ {todayTotal}</p>
          </div>

          {/* Total Earning Card — display only */}
          <div className="text-center rounded-2xl border-2 border-slate-100 bg-white shadow-sm p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-bold text-[#5d3c96] mb-1 sm:mb-2">Total Earning</p>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-800">₹ {totalEarning}</p>
          </div>
        </div>
      )}

      {/* Detail Section */}
      {isLoading ? (
        <div className="space-y-4">
          <ShimmerBlock className="h-4 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PayoutCardSkeleton />
            <PayoutCardSkeleton />
          </div>
        </div>
      ) : (
        <>
          {/* LAST EARNING SECTION */}
          {activeView === 'last' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 capitalize tracking-wider pl-1">Last Payout Details</h3>
              {pdcPayLast ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PayoutCard payout={pdcPayLast} />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-5xl mb-3">💰</div>
                  <p className="text-sm font-semibold">No payout records yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TODAY EARNING SECTION */}
          {activeView === 'today' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 capitalize tracking-wider pl-1">Today's Payouts</h3>
              {todayEarnings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayEarnings.map((payout, i) => (
                    <PayoutCard key={i} payout={payout} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-5xl mb-3">📅</div>
                  <p className="text-sm font-semibold">No earnings recorded today.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PdcEarning;
