import { Routes, Route, Navigate } from "react-router-dom";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";
import PdcKycGuard from "./PdcKycGuard";

// Layouts
import AdminLayout from "../components/layout/AdminLayout";
import PdcLayout from "../components/layout/PdcLayout";

// Auth Pages
import UnifiedLogin from "../features/auth/pages/UnifiedLogin";
import PdcRegister from "../features/auth/pages/PdcRegister";

// PDC Onboarding Pages
import PdcInnerRegister from "../features/pdc/pages/PdcInnerRegister";
import PdcSubmitDocs from "../features/pdc/pages/PdcSubmitDocs";
import PdcDocumentStatus from "../features/pdc/pages/PdcDocumentStatus";
import PdcProfileSetup from "../features/pdc/pages/PdcProfileSetup";

// PDC Verified Pages
import PdcHome from "../features/pdc/pages/PdcHome";
import PdcEarning from "../features/pdc/pages/PdcEarning";
import PdcOrderHistory from "../features/pdc/pages/PdcOrderHistory";
import PdcContactUs from "../features/pdc/pages/PdcContactUs";

// Shared Pages
import OrderView from "../features/orders/pages/OrderView";

// Admin-Only Pages
import Dashboard from "../features/admin/pages/Dashboard";
import DeliveryPartners from "../features/admin/pages/DeliveryPartners";
import DpDetails from "../features/admin/pages/DpDetails";
import Customers from "../features/admin/pages/Customers";
import PdcList from "../features/admin/pages/PdcList";
import PdcDetails from "../features/admin/pages/PdcDetails";
import Broadcast from "../features/admin/pages/Broadcast";
import OrderList from "../features/orders/pages/OrderList";
import FeedbackRatings from "../features/admin/pages/FeedbackRatings";
import FinanceOverview from "../features/payments/pages/FinanceOverview";
import WalletDashboard from "../features/wallets/pages/WalletDashboard";
import Reports from "../features/admin/pages/Reports";
import Charges from "../features/admin/pages/Charges";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ------------------ PUBLIC ROUTES ------------------ */}
      <Route path="/" element={<UnifiedLogin />} />
      <Route path="/pdc/register" element={<PdcRegister />} />

      {/* ------------------ SECURED PDC ROUTES ------------------ */}
      <Route
        path="/pdc"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["pdc"]}>
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
        <Route path="contact_us" element={<PdcContactUs />} />
        <Route path="orders/:id" element={<OrderView />} />
      </Route>

      {/* ------------------ SECURED ADMIN ROUTES ------------------ */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="delivery-partners" element={<DeliveryPartners />} />
        <Route path="delivery-partners/:id" element={<DpDetails />} />
        <Route path="customers" element={<Customers />} />
        <Route path="pdc-list" element={<PdcList />} />
        <Route path="pdcs/:id" element={<PdcDetails />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderView />} />
        <Route path="feedbacks" element={<FeedbackRatings />} />
        <Route path="finance" element={<FinanceOverview />} />
        <Route path="wallets" element={<WalletDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="charges" element={<Charges />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
