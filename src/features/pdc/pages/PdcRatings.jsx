import React, { useEffect, useState } from 'react';
import { fetchPdcRatings } from '../../../api/pdc.api';
import { Star, MessageSquare } from 'lucide-react';

// Shimmer block
const ShimmerCard = () => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
      <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
    <div className="h-4 w-full bg-slate-100 rounded animate-pulse mt-2" />
    <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
  </div>
);

const StarDisplay = ({ stars }) => {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${
            star <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 text-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

export const PdcRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const response = await fetchPdcRatings();
        if (response.data && response.data.data) {
          setRatings(response.data.data.ratings || []);
          setAvgRating(response.data.data.averageRating || 0);
        }
      } catch (error) {
        console.error("Failed to load PDC ratings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRatings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left page-transition pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Ratings</h2>
        <p className="text-xs text-slate-400 mt-1">View feedback and ratings from Delivery Partners and Customers</p>
      </div>

      {/* Summary Header */}
      <div className="bg-gradient-to-r from-[#9073be] to-[#522f89] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20">
            <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Overall Rating</h3>
            <div className="flex items-center gap-2">
              <StarDisplay stars={Math.round(avgRating)} />
              <span className="text-sm text-white/80">({ratings.length} Reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : ratings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Star size={40} className="fill-current" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Ratings Yet</h3>
          <p className="text-sm text-slate-500">You haven't received any ratings for your orders yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratings.map((rating) => (
            <div key={rating._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <StarDisplay stars={rating.stars} />
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {new Date(rating.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {rating.message && (
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic mb-4 flex-grow flex gap-2">
                  <MessageSquare size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <p>"{rating.message}"</p>
                </div>
              )}
              
              {!rating.message && (
                <div className="flex-grow mb-4">
                   <p className="text-sm text-slate-400 italic">No feedback provided.</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 mt-auto flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">From:</span>
                  <span className="font-bold text-slate-700">
                    {rating.rater?.name || 'Unknown User'} ({rating.raterType})
                  </span>
                </div>
                {rating.order && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-bold text-brand-purple" title={rating.order._id}>
                      #{rating.order.order_number || rating.order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdcRatings;
