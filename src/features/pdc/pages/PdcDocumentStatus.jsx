import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updatePdcDocumentState } from '../../auth/authSlice';
import { fetchPdcDocStatus } from '../../../api/pdc.api';
import { ArrowLeft } from 'lucide-react';
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
      const response = await fetchPdcDocStatus();
      // Backend returns: { success, message, data: { pdcDocument: {...} } }
      const doc = response.data?.data?.pdcDocument || response.data?.data || null;
      if (doc) {
        dispatch(updatePdcDocumentState(doc));
      }
    } catch (e) {
      console.error('Failed to reload profile status', e);
      toast.error("Failed to reload profile status");
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

  const getStatusDisplay = (status, docUrl, reason) => {
    const normalizedStatus = status ? status.toLowerCase() : '';

    if (normalizedStatus === 'approved' || normalizedStatus === 'accept') {
      return <Badge variant="success">Approved</Badge>;
    }

    if (normalizedStatus === 'rejected' || normalizedStatus === 'reject') {
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
    }

    // If status is 'pending' explicitly, OR if there's no final status yet but a file is uploaded
    if (normalizedStatus === 'pending' || docUrl) {
      return <Badge variant="warning">Pending Verification</Badge>;
    }

    return <Badge variant="slate">Not Submitted</Badge>;
  };

  const docList = [
    { 
      name: 'Aadhar Card Proof', 
      status: pdcDocument?.aadhar_status, 
      url: pdcDocument?.aadhar_front_image, 
      reason: pdcDocument?.aadhar_reject_reason 
    },
    { 
      name: 'PAN Card Proof', 
      status: pdcDocument?.pancard_status || pdcDocument?.pan_status, 
      url: pdcDocument?.pancard_image, 
      reason: pdcDocument?.pan_reject_reason 
    },
    { 
      name: 'GST Certificate (Business Registration)', 
      status: pdcDocument?.gst_status, 
      url: pdcDocument?.gst_doc, 
      reason: pdcDocument?.gst_reject_reason 
    },
    { 
      name: 'Bank Details (Passbook/Cheque)', 
      status: pdcDocument?.bank_status, 
      url: pdcDocument?.passbook_image, 
      reason: pdcDocument?.bank_reject_reason 
    },
  ];

  return (
    <div className="max-w-xl mx-auto my-12 px-4 page-transition text-left">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#9073be] to-[#522f89] p-6 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/pdc/profile_setup')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-display uppercase tracking-wider">KYC Status</h2>
              <p className="text-xs text-white/80 mt-1">Check document verification updates</p>
            </div>
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
                <div>{getStatusDisplay(doc.status, doc.url, doc.reason)}</div>
              </div>
            ))}
          </div>

          {(() => {
            const isRejected = (s) => s && (s.toLowerCase() === 'rejected' || s.toLowerCase() === 'reject');
            const hasRejection =
              isRejected(pdcDocument?.aadhar_status) ||
              isRejected(pdcDocument?.pan_status) ||
              isRejected(pdcDocument?.pancard_status) ||
              isRejected(pdcDocument?.gst_status) ||
              isRejected(pdcDocument?.bank_status);

            if (!hasRejection) return null;

            return (
              <div className="mt-4">
              <Button
                onClick={() => navigate('/pdc/submit_pdc_documents')}
                className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
              >
                Re-submit Documents
              </Button>
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PdcDocumentStatus;
