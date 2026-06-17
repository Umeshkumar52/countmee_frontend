import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { token, user, pdcDocument, isLoading, error } = useSelector((state) => state.auth);

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  const isPdc = user?.role === 'pdc';

  // Overall KYC approved: admin sets pdcDocument.status = 1
  const isKycVerified = isPdc && pdcDocument && Number(pdcDocument.status) === 1;

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
