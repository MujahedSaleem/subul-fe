import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import AddCustomer from "./pages/admin/AddCustomer";
import Orders from "./pages/admin/Orders";
import AddOrder from "./pages/admin/AddOrder";
import EditOrder from "./pages/admin/EditOrder";
import Distributors from "./pages/admin/Distributors";
import AddDistributor from "./pages/admin/AddDistributor";
import EditDistributor from "./pages/admin/EditDistributor";
import EditCustomerPage from "./pages/admin/EditCustomerPage";
import DistributorEditOrder from "./pages/distributor/DistributorEditOrder";
import DistributorAddOrder from "./pages/distributor/DistributorAddOrder";
import DistributorListOrder from "./pages/distributor/DistributorListOrder";
import { ProtectedRoute } from "./components/authGuard";
import { useAuth } from "./context/AuthContext";
import ViewOrder from "./pages/admin/ViewOrder";
import NotificationContainer from "./components/NotificationContainer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { saveCurrentRoute, getSavedRoute, clearSavedRoute } from "./utils/routeStateManager";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./context/AuthContext";

// Detect if the client is a mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// ✅ Authentication & Role-Based Access

// ✅ Protected Route Component
const RoleBasedRedirect = () => {
  const { userType } = useAuth(); // Get user info from AuthContext

  if (!userType) return <Login></Login>;
  if (userType === "Admin") return <Navigate to="/admin" replace />;
  if (userType === "Distributor") return <Navigate to="/distributor/orders" replace />;
  
  return <Navigate to="/login" replace />; // Fallback
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [routeReady, setRouteReady] = useState(false);

  // Save current route when location changes
  useEffect(() => {
    if (isAuthenticated && location.pathname !== '/login') {
      saveCurrentRoute(location.pathname);
    }
  }, [location.pathname, isAuthenticated]);

  // Handle application bootstrap and route restoration
  useEffect(() => {
    if (!routeReady && isAuthenticated) {
      // Check for fresh login (forceReloadAfterAuth flag)
      const needsReload = sessionStorage.getItem('forceReloadAfterAuth');
      if (needsReload === 'true') {
        // We'll let AuthContext handle the reload
        return;
      }

      // Restore saved route on app load (normal case)
      const savedRoute = getSavedRoute();
      if (savedRoute && savedRoute !== '/login' && savedRoute !== location.pathname) {
        navigate(savedRoute);
      }
      
      setRouteReady(true);
    }
  }, [isAuthenticated, navigate, location.pathname, routeReady]);

  // Listen for visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const savedRoute = getSavedRoute();
        if (savedRoute && savedRoute !== '/login' && savedRoute !== location.pathname) {
          navigate(savedRoute);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, navigate, location.pathname]);

  return (
    <Provider store={store}>
      <AuthProvider>
        <NotificationContainer />
        <PWAInstallPrompt />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<RoleBasedRedirect />} />

          {/* Admin Routes - Only accessible to Admin users */}
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>}
          />
          {/* Distributor Routes */}
          <Route path="/distributor" element={<ProtectedRoute allowedRoles={["Distributor"]}><Navigate to="/distributor/orders" replace /></ProtectedRoute>} />
          <Route path="/distributor/orders" element={<ProtectedRoute allowedRoles={["Distributor"]}><DistributorListOrder /></ProtectedRoute>} />
          <Route path="/distributor/orders/add" element={<ProtectedRoute allowedRoles={["Distributor"]}><DistributorAddOrder /></ProtectedRoute>} />
          <Route path="/distributor/orders/edit/:id" element={<ProtectedRoute allowedRoles={["Distributor"]}><DistributorEditOrder /></ProtectedRoute>} />

          <Route
            path="/admin/customers"
            element={<ProtectedRoute allowedRoles={["Admin"]}><Customers /></ProtectedRoute>}
          />
          <Route
            path="/admin/customers/add"
            element={<ProtectedRoute allowedRoles={["Admin"]}><AddCustomer /></ProtectedRoute>}
          />
          <Route
            path="/admin/customers/edit/:id"
            element={<ProtectedRoute allowedRoles={["Admin"]}><EditCustomerPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/orders"
            element={<ProtectedRoute allowedRoles={["Admin"]}><Orders /></ProtectedRoute>}
          />
          <Route
            path="/admin/orders/add"
            element={<ProtectedRoute allowedRoles={["Admin"]}><AddOrder /></ProtectedRoute>}
          />
          <Route
            path="/admin/orders/edit/:id"
            element={<ProtectedRoute allowedRoles={["Admin"]}><EditOrder /></ProtectedRoute>}
          />
          <Route
            path="/admin/orders/view/:id"
            element={<ProtectedRoute allowedRoles={["Admin"]}><ViewOrder /></ProtectedRoute>}
          />
          <Route
            path="/admin/distributors"
            element={<ProtectedRoute allowedRoles={["Admin"]}><Distributors /></ProtectedRoute>}
          />
          <Route
            path="/admin/distributors/add"
            element={<ProtectedRoute allowedRoles={["Admin"]}><AddDistributor /></ProtectedRoute>}
          />
          <Route
            path="/admin/distributors/edit/:id"
            element={<ProtectedRoute allowedRoles={["Admin"]}><EditDistributor /></ProtectedRoute>}
          />

          {/* Default Route - Redirect to Login */}
          <Route path="/" element={<RoleBasedRedirect />} />
        </Routes>
      </AuthProvider>
    </Provider>
  );
}

export default App;
