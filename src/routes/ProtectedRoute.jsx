import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect all unauthenticated access to the unified login page at root
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
