import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updatePdcDocumentState } from '../../auth/authSlice';
import { updatePdcInnerRegister } from '../../../api/pdc.api';
import { ArrowLeft } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';

export const PdcInnerRegister = () => {
  const { user, pdcDocument } = useAuth();

  const [name, setName] = useState(pdcDocument?.name || user?.name || '');
  const [phone, setPhone] = useState(pdcDocument?.phone || user?.phone || '');
  const [email, setEmail] = useState(pdcDocument?.email || user?.email || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);
    try {
      const response = await updatePdcInnerRegister({ name, phone, email });
      // Update Redux + localStorage with latest document state
      if (response.data?.data?.document) {
        dispatch(updatePdcDocumentState(response.data.data.document));
      } else {
        // Optimistic update with form values
        dispatch(updatePdcDocumentState({ name, phone, email }));
      }
      navigate('/pdc/submit_pdc_documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update business details. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-10 px-4 page-transition">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#9073be] to-[#522f89] p-6 text-white relative flex flex-col items-center">
          <button 
            onClick={() => navigate('/pdc/profile_setup')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold font-display uppercase tracking-wider">My Account</h2>
          <p className="text-xs text-white/80 mt-1">
            Step 1 of 3 — Fill in your store and contact details
          </p>
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store / Contact Info */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact Information</p>
            </div>

            <Input
              label="Store / Shop Name"
              id="name"
              type="text"
              placeholder="e.g. My Super Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Mobile Number"
                id="phone"
                type="text"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
              <Input
                label="Email (optional)"
                id="email"
                type="email"
                placeholder="store@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-4 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
            >
              Save & Continue to Documents →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PdcInnerRegister;
