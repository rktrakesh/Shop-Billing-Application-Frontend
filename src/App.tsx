import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";

import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import BillingPage from "@/pages/billing/BillingPage";
import InvoicesPage from "@/pages/billing/InvoicesPage";
import ProductsPage from "@/pages/products/ProductsPage";
import VariantsPage from "@/pages/products/VariantsPage";
import BarcodesPage from "@/pages/products/BarcodesPage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import ReturnsPage from "@/pages/returns/ReturnsPage";
import ProfitPage from "@/pages/profit/ProfitPage";
import UsersPage from "@/pages/users/UsersPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import { NotFoundPage, ForbiddenPage, ServerErrorPage } from "@/pages/errors/ErrorPages";

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "ROLE_USER") return <Navigate to="/billing" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin & Manager only */}
          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_MANAGER"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/variants" element={<VariantsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/barcodes" element={<BarcodesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          {/* All authenticated roles */}
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/returns" element={<ReturnsPage />} />

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route path="/profit" element={<ProfitPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
