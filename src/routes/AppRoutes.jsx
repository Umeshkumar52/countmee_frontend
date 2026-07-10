import { Routes, Route, Navigate } from "react-router-dom";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import PdcKycGuard from "./PdcKycGuard";
import { ROLES } from "../constants";

// Layouts
import AdminLayout from "../components/layout/AdminLayout";
import PdcLayout from "../components/layout/PdcLayout";

// Auth Pages
import AdminLogin from "../features/auth/pages/AdminLogin";
import PdcLogin from "../features/auth/pages/PdcLogin";
import PdcRegister from "../features/auth/pages/PdcRegister";
import ForgotPassword from "../features/auth/pages/ForgotPassword";

// PDC Onboarding Pages
import PdcInnerRegister from "../features/pdc/pages/PdcInnerRegister";
import PdcSubmitDocs from "../features/pdc/pages/PdcSubmitDocs";
import PdcDocumentStatus from "../features/pdc/pages/PdcDocumentStatus";
import PdcProfileSetup from "../features/pdc/pages/PdcProfileSetup";

// PDC Verified Pages
import PdcHome from "../features/pdc/pages/PdcHome";
import PdcEarning from "../features/pdc/pages/PdcEarning";
import PdcOrderHistory from "../features/pdc/pages/PdcOrderHistory";
import PdcRatings from "../features/pdc/pages/PdcRatings";
import PdcContactUs from "../features/pdc/pages/PdcContactUs";

// Shared Pages
import OrderView from "../features/orders/pages/OrderView";

// Admin-Only Pages
import Dashboard from "../features/admin/pages/Dashboard";
import DeliveryPartners from "../features/admin/pages/DeliveryPartners";
import DpDocumentVerification from "../features/admin/pages/DpDocumentVerification";
import Customers from "../features/admin/pages/Customers";
import PdcList from "../features/admin/pages/PdcList";
import PdcDetails from "../features/admin/pages/PdcDetails";
import Broadcast from "../features/admin/pages/Broadcast";
import OrderList from "../features/orders/pages/OrderList";
import BroadcastBundlesPage from "../features/orders/pages/BroadcastBundlesPage";
import BundleResponsesPage from "../features/orders/pages/BundleResponsesPage";
import BundleTrackingPage from "../features/orders/pages/BundleTrackingPage";
import FeedbackRatings from "../features/admin/pages/FeedbackRatings";
import FinanceOverview from "../features/payments/pages/FinanceOverview";
import PartnerOrderBreakdown from "../features/payments/pages/PartnerOrderBreakdown";
import WalletDashboard from "../features/wallets/pages/WalletDashboard";
import Reports from "../features/admin/pages/Reports";
import Charges from "../features/admin/pages/Charges";
import EditChargeConfig from "../features/admin/pages/EditChargeConfig";
import VehicleConfigurations from "../features/admin/pages/VehicleConfigurations";
import { ScheduledOrders } from "../features/orders/pages/ScheduledOrders";
import RecommendDpPage from "../features/orders/pages/RecommendDpPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ------------------ PUBLIC ROUTES ------------------ */}
      <Route path="/" element={<Navigate to="/pdc/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/pdc/login" element={<PdcLogin />} />
      <Route path="/pdc/register" element={<PdcRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ------------------ SECURED PDC ROUTES ------------------ */}
      <Route
        path="/pdc"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.PDC]}>
              <PdcKycGuard>
                <PdcLayout />
              </PdcKycGuard>
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        {/* Onboarding Hub (KYC Guard redirects here if not yet approved) */}
        <Route path="profile_setup" element={<PdcProfileSetup />} />

        {/* Onboarding steps (accessible from hub) */}
        <Route path="inner_registered" element={<PdcInnerRegister />} />
        <Route path="submit_pdc_documents" element={<PdcSubmitDocs />} />
        <Route path="documentStatus" element={<PdcDocumentStatus />} />

        {/* Core verified pages */}
        <Route path="home" element={<PdcHome />} />
        <Route path="earning" element={<PdcEarning />} />
        <Route path="order_history" element={<PdcOrderHistory />} />
        <Route path="ratings" element={<PdcRatings />} />
        <Route path="contact_us" element={<PdcContactUs />} />
        <Route path="orders/:id" element={<OrderView />} />
      </Route>

      {/* ------------------ SECURED ADMIN ROUTES ------------------ */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="delivery-partners" element={<DeliveryPartners />} />
        <Route
          path="delivery-partners/:id"
          element={<DpDocumentVerification />}
        />
        <Route path="customers" element={<Customers />} />
        <Route path="pdc-list" element={<PdcList />} />
        <Route path="pdcs/:id" element={<PdcDetails />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="scheduled-orders" element={<ScheduledOrders />} />
        <Route
          path="scheduled-orders/recommend-dp"
          element={<RecommendDpPage />}
        />
        <Route
          path="scheduled-orders/broadcasts"
          element={<BroadcastBundlesPage />}
        />
        <Route
          path="scheduled-orders/broadcasts/:bundleId"
          element={<BundleResponsesPage />}
        />
        <Route
          path="scheduled-orders/broadcasts/:bundleId/track"
          element={<BundleTrackingPage />}
        />
        <Route path="orders/:id" element={<OrderView />} />
        <Route path="feedbacks" element={<FeedbackRatings />} />
        <Route path="finance" element={<FinanceOverview />} />
        <Route path="finance/partner/:dp_id" element={<PartnerOrderBreakdown />} />
        <Route path="wallets" element={<WalletDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="charges" element={<Charges />} />
        <Route path="charges/edit" element={<EditChargeConfig />} />
        <Route path="vehicles" element={<VehicleConfigurations />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
