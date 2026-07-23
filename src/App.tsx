import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";

// Auth pages (public)
import LoginPage from "@/pages/auth/LoginPage";
import IpOtpPage from "@/pages/auth/IpOtpPage";

// Main pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import BillingPage from "@/pages/billing/BillingPage";
import InvoicesPage from "@/pages/billing/InvoicesPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import ProductsPage from "@/pages/products/ProductsPage";
import VariantsPage from "@/pages/products/VariantsPage";
import BarcodesPage from "@/pages/products/BarcodesPage";
import InventoryPage from "@/pages/inventory/InventoryPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import ProfitPage from "@/pages/profit/ProfitPage";
import ReturnsPage from "@/pages/returns/ReturnsPage";
import CreditsPage from "@/pages/credits/CreditsPage";
import DayReportPage from "@/pages/dayreport/DayReportPage";
import UsersPage from "@/pages/users/UsersPage";
import AuditLogPage from "@/pages/audit/AuditLogPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import SuppliersPage from "@/pages/suppliers/SuppliersPage";
import RawMaterialsPage from "@/pages/rawmaterials/RawMaterialsPage";
import PurchaseEntryPage from "@/pages/purchases/PurchaseEntryPage";
import ProductionPage from "@/pages/production/ProductionPage";
import ExpensesPage from "@/pages/expenses/ExpensesPage";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/verify-ip" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <IpOtpPage />} />

      {/* Protected routes — wrapped in AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* All authenticated roles */}
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/credits" element={<CreditsPage />} />

          {/* Admin + Manager */}
          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN", "ROLE_MANAGER"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/variants" element={<VariantsPage />} />
            <Route path="/barcodes" element={<BarcodesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/raw-materials" element={<RawMaterialsPage />} />
            <Route path="/purchases" element={<PurchaseEntryPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
            <Route path="/profit" element={<ProfitPage />} />
            <Route path="/dayreport" element={<DayReportPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/billing" replace />} />
      <Route path="*" element={<Navigate to="/billing" replace />} />
    </Routes>
  );
}
