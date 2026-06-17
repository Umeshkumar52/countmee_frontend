import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updatePdcDocumentState } from '../../auth/authSlice';
import { submitPdcDocuments } from '../../../api/pdc.api';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';

export const PdcSubmitDocs = () => {
  const { pdcDocument } = useAuth();

  // Identity fields — names MUST match backend service exactly
  const [aadhar_card_no, setAadharNo] = useState(pdcDocument?.aadhar_card_no || '');
  const [pan_card_no, setPanNo] = useState(pdcDocument?.pan_card_no || '');
  const [gst_no, setGstNo] = useState(pdcDocument?.gst_no || '');

  // Bank fields
  const [account_no, setAccountNo] = useState(pdcDocument?.account_no || '');
  const [ifsc, setIfsc] = useState(pdcDocument?.ifsc || '');

  // Location fields (also saved via this form in production)
  const [city, setCity] = useState(pdcDocument?.city || '');
  const [district, setDistrict] = useState(pdcDocument?.district || '');
  const [state, setState] = useState(pdcDocument?.state || '');
  const [pincode, setPincode] = useState(pdcDocument?.pincode || '');
  const [address, setAddress] = useState(pdcDocument?.address || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData(e.target);
      // Append text fields explicitly with backend-expected names
      formData.set('aadhar_card_no', aadhar_card_no);
      formData.set('pan_card_no', pan_card_no);
      formData.set('gst_no', gst_no);
      formData.set('account_no', account_no);
      formData.set('ifsc', ifsc);
      formData.set('city', city);
      formData.set('district', district);
      formData.set('state', state);
      formData.set('pincode', pincode);
      formData.set('address', address);

      const response = await submitPdcDocuments(formData);

      // Optimistic update into Redux
      dispatch(updatePdcDocumentState({
        aadhar_card_no, pan_card_no, gst_no,
        account_no, ifsc, city, district, state, pincode, address,
      }));

      navigate('/pdc/documentStatus');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit documents. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 px-4 page-transition">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#9073be] to-[#522f89] p-6 text-white text-center">
          <h2 className="text-xl font-bold font-display uppercase tracking-wider">KYC Documents</h2>
          <p className="text-xs text-white/80 mt-1">Step 2 of 3 — Upload your documents for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Aadhar */}
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">1. Identity Proof (Aadhar)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Aadhar Number"
                id="aadhar_card_no"
                placeholder="12-digit number"
                value={aadhar_card_no}
                onChange={(e) => setAadharNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                required
              />
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">Aadhar Front Image <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  name="aadhar_front_image"
                  accept="image/*,.pdf"
                  required={!pdcDocument?.aadhar_front_image}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">Aadhar Back Image</label>
                <input
                  type="file"
                  name="aadhar_back_image"
                  accept="image/*,.pdf"
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: PAN */}
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">2. PAN Card Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PAN Number"
                id="pan_card_no"
                placeholder="e.g. ABCDE1234F"
                value={pan_card_no}
                onChange={(e) => setPanNo(e.target.value.toUpperCase().slice(0, 10))}
                required
              />
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">PAN Card Copy <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  name="pancard_image"
                  accept="image/*,.pdf"
                  required={!pdcDocument?.pancard_image}
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: GST */}
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">3. GST Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GST Number"
                id="gst_no"
                placeholder="15-character GST number"
                value={gst_no}
                onChange={(e) => setGstNo(e.target.value.toUpperCase().slice(0, 15))}
              />
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">GST Certificate</label>
                <input
                  type="file"
                  name="gst_doc"
                  accept="image/*,.pdf"
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Bank */}
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">4. Bank Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Number"
                id="account_no"
                placeholder="Bank Account Number"
                value={account_no}
                onChange={(e) => setAccountNo(e.target.value.replace(/\D/g, ''))}
                required
              />
              <Input
                label="IFSC Code"
                id="ifsc"
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="mt-3 flex flex-col text-left gap-1">
              <label className="text-xs font-semibold text-slate-600">Passbook / Cancelled Cheque <span className="text-red-500">*</span></label>
              <input
                type="file"
                name="passbook_image"
                accept="image/*,.pdf"
                required={!pdcDocument?.passbook_image}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 5: Location (if not already filled from inner register) */}
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">5. Store Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="City" id="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              <Input label="District" id="district" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
              <Input label="State" id="state" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
              <Input label="Pincode" id="pincode" placeholder="6-digit pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
            <div className="mt-3 flex flex-col text-left">
              <label htmlFor="address" className="text-xs font-semibold text-slate-600 mb-1.5">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                rows={2}
                placeholder="Complete store address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
              />
            </div>
          </div>

          {/* Section 6: Profile photo */}
          <div>
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide mb-3">6. Profile & Shop Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">Profile Photo</label>
                <input
                  type="file"
                  name="profile_image"
                  accept="image/*"
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
              <div className="flex flex-col text-left gap-1">
                <label className="text-xs font-semibold text-slate-600">Shop / Storefront Image</label>
                <input
                  type="file"
                  name="shop_image"
                  accept="image/*"
                  className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple-soft file:text-brand-purple hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full mt-6 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
          >
            Submit for Verification
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PdcSubmitDocs;
