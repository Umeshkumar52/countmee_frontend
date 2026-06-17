import React, { useEffect, useState } from 'react';
import { fetchRatings } from '../../../api/admin.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';

export const FeedbackRatings = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setIsLoading(true);
      try {
        const response = await fetchRatings();
        const rawList = response.data.ratings || response.data.data?.ratings || [];
        const formatted = rawList.map(r => {
          let name = 'System';
          let role = 'customer';
          if (r.from_customer) {
            name = r.from_customer.name || 'Customer';
            role = 'customer';
          } else if (r.from_dp) {
            name = r.from_dp.name || 'Delivery Partner';
            role = 'dp';
          } else if (r.from_pdc) {
            name = r.from_pdc.name || 'PDC Hub';
            role = 'pdc';
          }
          return {
            id: r._id,
            user_name: name,
            role: role,
            rating: r.stars || 5,
            comment: r.message || ''
          };
        });
        setFeedbacks(formatted);
      } catch (e) {
        console.error('Failed to load feedbacks', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const renderStars = (score) => {
    return (
      <span className="text-amber-500 font-bold tracking-wider">
        {'★'.repeat(score)}{'☆'.repeat(5 - score)}
      </span>
    );
  };

  const headers = ['Feedback ID', 'Submitted By', 'User Role', 'Rating Score', 'Comments'];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Feedbacks & Ratings</h2>
        <p className="text-xs text-slate-400 mt-1">Review score ratings and feedback remarks submitted by clients and partners</p>
      </div>

      <Table
        headers={headers}
        data={feedbacks}
        isLoading={isLoading}
        emptyMessage="No rating logs recorded yet."
        renderRow={(fb) => (
          <tr key={fb.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-400">
              #FB-{fb.id}
            </td>
            <td className="px-5 py-4 text-xs font-bold text-slate-800">
              {fb.user_name}
            </td>
            <td className="px-5 py-4 text-xs">
              <Badge variant={fb.role === 'customer' ? 'info' : 'primary'}>
                {fb.role}
              </Badge>
            </td>
            <td className="px-5 py-4 text-sm">
              {renderStars(fb.rating)}
            </td>
            <td className="px-5 py-4 text-xs text-slate-600 font-medium italic">
              "{fb.comment || 'No comments left.'}"
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default FeedbackRatings;
