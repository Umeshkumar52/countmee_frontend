import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updatePdcDocumentState } from '../../auth/authSlice';
import { fetchPdcProfile } from '../../../api/pdc.api';
import useAuth from '../../../hooks/useAuth';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';

export const PdcDocumentStatus = () => {
  const { pdcDocument, isKycVerified } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetchPdcProfile();
      // Backend returns: { success, message, data: { document: {...} } }
      const doc = response.data?.data?.document || response.data?.data || null;
      if (doc) {
        dispatch(updatePdcDocumentState(doc));
      }
    } catch (e) {
      console.error('Failed to reload profile status', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    // If backend has set status=1 (admin approved), go to home
    if (isKycVerified) {
      navigate('/pdc/home');
    }
  }, [isKycVerified, navigate]);

  const getStatusDisplay = (status, reason) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Verification</Badge>;
      case 'rejected':
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge variant="danger">Rejected</Badge>
            {reason && (
              <span className="text-[10px] text-red-500 font-semibold bg-red-50 p-1.5 rounded-lg border border-red-100">
                Reason: {reason}
              </span>
            )}
          </div>
        );
      default:
        return <Badge variant="slate">Not Submitted</Badge>;
    }
  };

  const docList = [
    { name: 'Aadhar Card Proof', status: pdcDocument?.aadhar_status, reason: pdcDocument?.aadhar_reject_reason },
    { name: 'PAN Card Proof', status: pdcDocument?.pancard_status || pdcDocument?.pan_status, reason: pdcDocument?.pan_reject_reason },
    { name: 'GST Certificate (Business Registration)', status: pdcDocument?.gst_status, reason: pdcDocument?.gst_reject_reason },
    { name: 'Bank Details (Passbook/Cheque)', status: pdcDocument?.bank_status, reason: pdcDocument?.bank_reject_reason },
  ];

  return (
    <div className="max-w-xl mx-auto my-12 px-4 page-transition text-left">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#9073be] to-[#522f89] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wider">KYC Status</h2>
            <p className="text-xs text-white/80 mt-1">Check document verification updates</p>
          </div>
          <Button
            onClick={checkStatus}
            isLoading={isRefreshing}
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            Refresh Status
          </Button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs text-indigo-800">
            <span className="text-base">ℹ️</span>
            <div>
              <p className="font-bold">Onboarding Verification Pending</p>
              <p className="mt-0.5 text-indigo-600/90">Our administrative support team is reviewing your documents. You will get access to the dashboard once all items are approved.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
            {docList.map((doc, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-sm font-semibold text-slate-700">{doc.name}</span>
                <div>{getStatusDisplay(doc.status, doc.reason)}</div>
              </div>
            ))}
          </div>

          {(pdcDocument?.aadhar_status === 'rejected' ||
            pdcDocument?.pan_status === 'rejected' ||
            pdcDocument?.gst_status === 'rejected' ||
            pdcDocument?.bank_status === 'rejected') && (
            <div className="mt-4">
              <Button
                onClick={() => navigate('/pdc/submit_pdc_documents')}
                className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
              >
                Re-submit Documents
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdcDocumentStatus;
