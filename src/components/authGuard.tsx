import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ✅ Protected Route Component
export const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { isAuthenticated, userType, loading } = useAuth();
  const isAuthorized = isAuthenticated && allowedRoles.includes(userType || "");

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !isAuthorized) {
    return <Navigate to="/login" />;
  }

  return children;
};
