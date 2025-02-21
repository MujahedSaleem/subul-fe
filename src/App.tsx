import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import DistributorOrders from "./pages/distributor/Orders";
import EditCustomerPage from "./pages/admin/EditCustomerPage";

// ✅ Authentication & Role-Based Access
const isAuthenticated = () => !!localStorage.getItem("accessToken");
const getUserRole = () => localStorage.getItem("userType") || "";

// ✅ Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const loggedIn = isAuthenticated();
  const userRole = getUserRole();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes - Only accessible to Admin users */}
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>}
        />
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

        {/* Distributor Routes - Only accessible to Distributor users */}
        <Route
          path="/distributor"
          element={<ProtectedRoute allowedRoles={["Distributor"]}><Navigate to="/distributor/orders" replace /></ProtectedRoute>}
        />
        <Route
          path="/distributor/orders"
          element={<ProtectedRoute allowedRoles={["Distributor"]}><DistributorOrders /></ProtectedRoute>}
        />

        {/* Default Route - Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
