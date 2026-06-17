import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * PDC KYC Guard — mirrors the production flow:
 *
 *  Not approved (status !== 1)  → /pdc/profile_setup  (hub page, then inner → docs → status)
 *  Approved (status === 1)      → /pdc/home  (full dashboard access)
 *
 * Special case: PDC visiting onboarding step pages while already verified
 * → redirected back to home.
 */
export const PdcKycGuard = ({ children }) => {
  const { isPdc, onboardingStep } = useAuth();
  const location = useLocation();

  if (!isPdc) {
    return children;
  }

  const path = location.pathname;

  // Onboarding pages — only PDCs in the right step should see these
  const onboardingPaths = [
    "/pdc/profile_setup",
    "/pdc/inner_registered",
    "/pdc/submit_pdc_documents",
    "/pdc/documentStatus",
  ];

  // Fully verified PDC — if they land on an onboarding page, push to home
  if (onboardingStep === "verified") {
    if (onboardingPaths.includes(path)) {
      return <Navigate to="/pdc/home" replace />;
    }
    return children;
  }

  // NOT verified — if they try to access main pages, send them to the hub
  if (!onboardingPaths.includes(path)) {
    return <Navigate to="/pdc/profile_setup" replace />;
  }

  // They are on an onboarding page — allow them in (the hub page handles sub-step enforcement)
  return children;
};

export default PdcKycGuard;
