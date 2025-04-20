import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
  return (
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
  );
}

export default App;
