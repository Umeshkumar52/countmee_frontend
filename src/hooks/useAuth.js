import { useSelector } from 'react-redux';
import { ROLES } from '../constants';

export const useAuth = () => {
  const { token, user, pdcDocument, isLoading, error } = useSelector((state) => state.auth);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === ROLES.ADMIN;
  const isPdc = user?.role === ROLES.PDC;

  // Helper to check if a single doc status is approved
  const isDocApproved = (statusStr) => {
    if (!statusStr) return false;
    const s = statusStr.toLowerCase();
    return s === 'accept' || s === 'approved';
  };

  // Check if ALL individual required docs are approved
  const allDocsApproved = isPdc && pdcDocument && 
    isDocApproved(pdcDocument.aadhar_status) &&
    (isDocApproved(pdcDocument.pan_status) || isDocApproved(pdcDocument.pancard_status)) &&
    isDocApproved(pdcDocument.gst_status) &&
    isDocApproved(pdcDocument.bank_status);

  // Overall KYC approved: all individual docs are accepted
  const isKycVerified = isPdc && pdcDocument && allDocsApproved;

  // Individual document submission check (any required doc uploaded = status submitted)
  const hasSubmittedDocs = isPdc && pdcDocument && (
    pdcDocument.aadhar_card_no ||
    pdcDocument.aadhar_front_image ||
    pdcDocument.pancard_image ||
    pdcDocument.pan_card_no ||
    pdcDocument.passbook_image
  );

  // Profile complete: city and address filled (inner register step)
  const hasInnerProfile = isPdc && pdcDocument && pdcDocument.city && pdcDocument.address;

  /**
   * Onboarding step — mirrors the production hub page logic:
   *   register / setup → inner → documents_upload → status → verified
   */
  const onboardingStep = () => {
    if (!isPdc) return null;
    if (!pdcDocument) return 'register';
    if (isKycVerified) return 'verified';
    if (!hasInnerProfile) return 'inner';
    if (!hasSubmittedDocs) return 'documents_upload';
    return 'status';
  };

  return {
    token,
    user,
    pdcDocument,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isPdc,
    isKycVerified,
    hasInnerProfile,
    hasSubmittedDocs,
    onboardingStep: onboardingStep(),
  };
};
export default useAuth;
