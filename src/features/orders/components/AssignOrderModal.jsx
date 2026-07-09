import React, { useEffect, useState } from 'react';
import { fetchNearestDps, assignDeliveryBoy } from '../../../api/admin.api';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import toast from 'react-hot-toast';

export const AssignOrderModal = ({ isOpen, onClose, orderId, onAssignSuccess }) => {
  const [partners, setPartners] = useState([]);
  const [selectedDp, setSelectedDp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchActivePartners = async () => {
      setIsLoading(true);
      try {
        const response = await fetchNearestDps([orderId]);
        const dpList = response.data?.data || [];
        setPartners(dpList);
      } catch (e) {
        console.error('Failed to load partners', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivePartners();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDp) return;
    setIsSubmit(true);

    try {
      await assignDeliveryBoy({
        order_id: orderId,
        dp_id: selectedDp
      });
      toast.success('Order successfully assigned to delivery partner!');
      onAssignSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to assign order', err);
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Delivery Boy">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <p className="text-xs text-slate-500">
          Select an active delivery boy partner to assign to Order #{orderId}.
        </p>

        {isLoading ? (
          <div className="text-xs text-slate-400 py-3">Loading active partners list...</div>
        ) : partners.length === 0 ? (
          <div className="text-xs text-red-500 font-semibold py-3">No active delivery partners available.</div>
        ) : (
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 mb-1.5">Delivery Boy</label>
            <select
              value={selectedDp}
              onChange={(e) => setSelectedDp(e.target.value)}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
            >
              <option value="">-- Choose Partner --</option>
              {partners.map((dp) => (
                <option key={dp.user_id || dp.id || dp._id} value={dp.user_id || dp.user?._id || dp.user_id?._id || dp._id}>
                  {dp.name || dp.user?.name || dp.user_id?.name} ({dp.vehicle_type || dp.vehicle || "Bike"}) - Rating: ⭐{dp.rating || 0} - Active Orders: {dp.active_orders || 0}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} variant="secondary" size="sm">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmit} disabled={!selectedDp} variant="primary" size="sm">
            Assign Partner
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignOrderModal;
