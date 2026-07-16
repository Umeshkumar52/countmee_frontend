import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updatePdcDocumentState } from '../../auth/authSlice';
import { fetchPdcProfile } from '../../../api/pdc.api';
import useAuth from '../../../hooks/useAuth';

const StepCard = ({ number, title, description, status, onClick, disabled }) => {
// ... existing StepCard code ...
  const statusStyles = {
    done: {
      icon: '✅',
      badge: 'Completed',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      border: 'border-emerald-200 bg-emerald-50/30',
      cursor: 'cursor-pointer',
    },
    active: {
      icon: '📝',
      badge: 'Action Required',
      badgeClass: 'bg-amber-100 text-amber-700',
      border: 'border-amber-200 bg-amber-50/30',
      cursor: 'cursor-pointer',
    },
    locked: {
      icon: '🔒',
      badge: 'Locked',
      badgeClass: 'bg-slate-100 text-slate-500',
      border: 'border-slate-100 bg-slate-50/50',
      cursor: 'cursor-not-allowed opacity-60',
    },
    pending: {
      icon: '⏳',
      badge: 'Under Review',
      badgeClass: 'bg-blue-100 text-blue-700',
      border: 'border-blue-200 bg-blue-50/30',
      cursor: 'cursor-default',
    },
  };

  const s = statusStyles[status] || statusStyles.locked;

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${s.border} ${s.cursor} ${
        !disabled && status !== 'locked' ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Step Number Circle */}
      <div
        className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-lg border-2 ${
          status === 'done'
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : status === 'active'
            ? 'bg-amber-400 border-amber-400 text-white'
            : status === 'pending'
            ? 'bg-blue-400 border-blue-400 text-white'
            : 'bg-slate-200 border-slate-200 text-slate-400'
        }`}
      >
        {status === 'done' ? '✓' : number}
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeClass}`}>
            {s.badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      {/* Arrow */}
      {!disabled && status !== 'pending' && (
        <span className="text-slate-400 text-lg flex-shrink-0">→</span>
      )}
    </div>
  );
};

export const PdcProfileSetup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, pdcDocument, onboardingStep, isKycVerified } = useAuth();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetchPdcProfile();
        if (response.data?.data?.document) {
          dispatch(updatePdcDocumentState(response.data.data.document));
        }
      } catch (err) {
        console.error("Failed to fetch PDC profile", err);
      }
    };
    loadProfile();
  }, [dispatch]);

  // Helper to check if a document is rejected
  const isRejected = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'rejected' || s === 'reject';
  };
  const hasRejection = pdcDocument && (
    isRejected(pdcDocument.aadhar_status) ||
    isRejected(pdcDocument.pan_status) ||
    isRejected(pdcDocument.pancard_status) ||
    isRejected(pdcDocument.gst_status) ||
    isRejected(pdcDocument.bank_status)
  );

  // Derive step states
  const step1Status = user?.name && (pdcDocument?.phone || user?.phone) ? 'done' : 'active';
  const step2Status =
    step1Status !== 'done'
      ? 'locked'
      : hasRejection
      ? 'active'
      : pdcDocument?.aadhar_front_image || pdcDocument?.pancard_image || pdcDocument?.passbook_image
      ? 'done'
      : 'active';
  const step3Status =
    isKycVerified
      ? 'done'
      : hasRejection
      ? 'active'
      : step2Status === 'done'
      ? 'pending'
      : 'locked';

  const handleStep1 = () => navigate('/pdc/inner_registered');
  const handleStep2 = () => {
    if (step1Status !== 'done') return;
    navigate('/pdc/submit_pdc_documents');
  };
  const handleStep3 = () => {
    if (step3Status === 'locked') return;
    navigate('/pdc/documentStatus');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3effe] via-white to-[#eef4ff] flex flex-col items-center justify-start px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#9073be] to-[#522f89] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
          <span className="text-3xl">📋</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 font-display uppercase tracking-wider">
          Create Account Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Welcome, <span className="font-bold text-brand-purple">{user?.name}</span>! Complete these steps to get started.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-semibold">
          <span>Setup Progress</span>
          <span>
            {[step1Status, step2Status, step3Status].filter((s) => s === 'done').length} / 3 Complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#9073be] to-[#522f89] rounded-full transition-all duration-500"
            style={{
              width: `${
                ([step1Status, step2Status, step3Status].filter((s) => s === 'done').length / 3) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Step Cards */}
      <div className="w-full max-w-lg space-y-3">
        <StepCard
          number={1}
          title="My Account"
          description="Review and confirm your store name and contact details."
          status={step1Status}
          onClick={handleStep1}
          disabled={false}
        />

        <StepCard
          number={2}
          title="Submit Documents"
          description="Upload KYC documents — Aadhar, PAN, bank details, GST."
          status={step2Status}
          onClick={handleStep2}
          disabled={step1Status !== 'done'}
        />

        <StepCard
          number={3}
          title="Documents Verification"
          description="Our team reviews your documents. You will be notified once approved."
          status={step3Status}
          onClick={handleStep3}
          disabled={step3Status === 'locked'}
        />
      </div>

      {/* Proceed Button if fully approved */}
      {isKycVerified && (
        <div className="w-full max-w-lg mt-6">
          <button
            onClick={() => navigate('/pdc/home')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-2"
          >
            Proceed to Dashboard →
          </button>
        </div>
      )}

      {/* Status Banner */}
      {!isKycVerified && onboardingStep === 'status' && hasRejection && (
        <div className="mt-6 w-full max-w-lg bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <span className="text-2xl">⚠️</span>
          <h4 className="font-bold text-red-800 text-sm mt-2">Action Required</h4>
          <p className="text-xs text-red-600 mt-1">
            One or more of your documents were rejected. Please click on Step 2 to review the feedback and re-upload the required documents.
          </p>
        </div>
      )}

      {!isKycVerified && onboardingStep === 'status' && !hasRejection && (
        <div className="mt-6 w-full max-w-lg bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <span className="text-2xl">⏳</span>
          <h4 className="font-bold text-blue-800 text-sm mt-2">Documents Under Review</h4>
          <p className="text-xs text-blue-600 mt-1">
            Our admin team is reviewing your documents. This usually takes 1–2 business days.
            You'll get access to the full dashboard once all documents are approved.
          </p>
        </div>
      )}

      {/* Info panel */}
      <div className="mt-6 w-full max-w-lg bg-white/80 border border-slate-100 rounded-2xl p-4 flex gap-3 items-start text-xs text-slate-500 shadow-xs">
        <span className="text-base flex-shrink-0">ℹ️</span>
        <p>
          All three steps must be completed before you can access the dashboard. Contact us at{' '}
          <span className="font-semibold text-brand-purple">countmeeapp@gmail.com</span> or{' '}
          <span className="font-semibold text-brand-purple">+91 99001 60707</span> if you need help.
        </p>
      </div>
    </div>
  );
};

export default PdcProfileSetup;
