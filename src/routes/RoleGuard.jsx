import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const RoleGuard = ({ allowedRoles, children }) => {
  const { user, isAdmin, isPdc } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // If user is admin but tried to access PDC page, redirect to admin index
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // If user is PDC but tried to access admin page, redirect to PDC home
    if (isPdc) {
      return <Navigate to="/pdc/home" replace />;
    }
    // Fallback redirect to logout/root
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleGuard;
