import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/auth-context";
import { ProtectedRoute } from "@/auth/protected-route";
import { CustomerAuthProvider } from "@/customer/auth/customer-auth-context";
import { CustomerProtectedRoute } from "@/customer/auth/customer-protected-route";
import {
  CustomerTransactionDetailPage,
  CustomerTransactionListPage,
} from "@/customer/history";
import { CustomerShell } from "@/customer/layout/customer-shell";
import { CustomerLoginPage, CustomerRegisterPage } from "@/customer/pages/customer-auth-pages";
import { CustomerProfilePage } from "@/customer/profile";
import { CustomerServiceListPage } from "@/customer/services";
import { DynamicTransactionPage } from "@/customer/transactions";
import { AppShell } from "@/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ServiceCreatePage, ServiceListPage, ServiceWorkspacePage } from "@/features/services";
import { ProviderCreatePage, ProviderDetailPage, ProviderEditPage, ProviderListPage } from "@/features/providers";
import { CustomerDetailPage, CustomerListPage } from "@/features/customers";
import { NewPocketPage, PocketDetailPage, PocketListPage } from "@/features/pockets";
import {
  LedgerEntryDetailPage,
  LedgerEntryListPage,
  TrailDetailPage,
  TrailListPage,
  TransactionDetailPage,
  TransactionListPage,
  TriggerTransactionPage,
} from "@/features/operations";

function OfficerAuthBoundary() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

function CustomerAuthBoundary() {
  return <CustomerAuthProvider><Outlet /></CustomerAuthProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/customer" element={<CustomerAuthBoundary />}>
        <Route path="login" element={<CustomerLoginPage />} />
        <Route path="register" element={<CustomerRegisterPage />} />
        <Route element={<CustomerProtectedRoute />}>
          <Route element={<CustomerShell />}>
            <Route index element={<Navigate to="services" replace />} />
            <Route path="services" element={<CustomerServiceListPage />} />
            <Route path="services/:serviceCode" element={<DynamicTransactionPage />} />
            <Route path="transactions" element={<CustomerTransactionListPage />} />
            <Route path="transactions/:transactionId" element={<CustomerTransactionDetailPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
            <Route path="*" element={<Navigate to="/customer/services" replace />} />
          </Route>
        </Route>
      </Route>

      <Route element={<OfficerAuthBoundary />}>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="services" element={<ServiceListPage />} />
            <Route path="services/new" element={<ServiceCreatePage />} />
            <Route path="services/:serviceId/config/:step" element={<ServiceWorkspacePage />} />

            <Route path="providers" element={<ProviderListPage />} />
            <Route path="providers/new" element={<ProviderCreatePage />} />
            <Route path="providers/:providerId" element={<ProviderDetailPage />} />
            <Route path="providers/:providerId/edit" element={<ProviderEditPage />} />

            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/:customerId" element={<CustomerDetailPage />} />
            <Route path="pockets" element={<PocketListPage />} />
            <Route path="pockets/new" element={<NewPocketPage />} />
            <Route path="pockets/:pocketId" element={<PocketDetailPage />} />

            <Route path="operations/trigger" element={<TriggerTransactionPage />} />
            <Route path="trails" element={<TrailListPage />} />
            <Route path="trails/:trailId" element={<TrailDetailPage />} />
            <Route path="transactions" element={<TransactionListPage />} />
            <Route path="transactions/:transactionId" element={<TransactionDetailPage />} />
            <Route path="ledger/entries" element={<LedgerEntryListPage />} />
            <Route path="ledger/entries/:entryId" element={<LedgerEntryDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
