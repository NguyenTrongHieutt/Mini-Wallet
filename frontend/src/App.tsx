import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/auth-context";
import { ProtectedRoute } from "@/auth/protected-route";
import { LoadingScreen } from "@/components/loading-screen";
import { CustomerAuthProvider } from "@/customer/auth/customer-auth-context";
import { CustomerProtectedRoute } from "@/customer/auth/customer-protected-route";
import { CustomerShell } from "@/customer/layout/customer-shell";
import { AppShell } from "@/layout/app-shell";

const CustomerLoginPage = lazy(() =>
  import("@/customer/pages/customer-auth-pages").then((module) => ({
    default: module.CustomerLoginPage,
  })),
);
const CustomerRegisterPage = lazy(() =>
  import("@/customer/pages/customer-auth-pages").then((module) => ({
    default: module.CustomerRegisterPage,
  })),
);
const CustomerServiceListPage = lazy(() =>
  import("@/customer/services/customer-service-list-page").then((module) => ({
    default: module.CustomerServiceListPage,
  })),
);
const DynamicTransactionPage = lazy(() =>
  import("@/customer/transactions/dynamic-transaction-page").then((module) => ({
    default: module.DynamicTransactionPage,
  })),
);
const CustomerTransactionListPage = lazy(() =>
  import("@/customer/history/customer-transaction-list-page").then((module) => ({
    default: module.CustomerTransactionListPage,
  })),
);
const CustomerTransactionDetailPage = lazy(() =>
  import("@/customer/history/customer-transaction-detail-page").then((module) => ({
    default: module.CustomerTransactionDetailPage,
  })),
);
const CustomerProfilePage = lazy(() =>
  import("@/customer/profile/customer-profile-page").then((module) => ({
    default: module.CustomerProfilePage,
  })),
);

const LoginPage = lazy(() =>
  import("@/pages/login-page").then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })),
);

const ServiceListPage = lazy(() =>
  import("@/features/services").then((module) => ({ default: module.ServiceListPage })),
);
const ServiceCreatePage = lazy(() =>
  import("@/features/services").then((module) => ({ default: module.ServiceCreatePage })),
);
const ServiceWorkspacePage = lazy(() =>
  import("@/features/services").then((module) => ({ default: module.ServiceWorkspacePage })),
);

const ProviderListPage = lazy(() =>
  import("@/features/providers/pages/ProviderListPage").then((module) => ({
    default: module.ProviderListPage,
  })),
);
const ProviderCreatePage = lazy(() =>
  import("@/features/providers/pages/ProviderCreatePage").then((module) => ({
    default: module.ProviderCreatePage,
  })),
);
const ProviderDetailPage = lazy(() =>
  import("@/features/providers/pages/ProviderDetailPage").then((module) => ({
    default: module.ProviderDetailPage,
  })),
);
const ProviderEditPage = lazy(() =>
  import("@/features/providers/pages/ProviderEditPage").then((module) => ({
    default: module.ProviderEditPage,
  })),
);

const CustomerListPage = lazy(() =>
  import("@/features/customers/pages/CustomerListPage").then((module) => ({
    default: module.CustomerListPage,
  })),
);
const CustomerDetailPage = lazy(() =>
  import("@/features/customers/pages/CustomerDetailPage").then((module) => ({
    default: module.CustomerDetailPage,
  })),
);

const PocketListPage = lazy(() =>
  import("@/features/pockets/pages/PocketListPage").then((module) => ({
    default: module.PocketListPage,
  })),
);
const NewPocketPage = lazy(() =>
  import("@/features/pockets/pages/NewPocketPage").then((module) => ({
    default: module.NewPocketPage,
  })),
);
const PocketDetailPage = lazy(() =>
  import("@/features/pockets/pages/PocketDetailPage").then((module) => ({
    default: module.PocketDetailPage,
  })),
);

const TriggerTransactionPage = lazy(() =>
  import("@/features/operations/TriggerTransactionPage").then((module) => ({
    default: module.TriggerTransactionPage,
  })),
);
const TrailListPage = lazy(() =>
  import("@/features/operations/TrailListPage").then((module) => ({
    default: module.TrailListPage,
  })),
);
const TrailDetailPage = lazy(() =>
  import("@/features/operations/TrailDetailPage").then((module) => ({
    default: module.TrailDetailPage,
  })),
);
const TransactionListPage = lazy(() =>
  import("@/features/operations/TransactionListPage").then((module) => ({
    default: module.TransactionListPage,
  })),
);
const TransactionDetailPage = lazy(() =>
  import("@/features/operations/TransactionDetailPage").then((module) => ({
    default: module.TransactionDetailPage,
  })),
);
const LedgerEntryListPage = lazy(() =>
  import("@/features/operations/LedgerEntryListPage").then((module) => ({
    default: module.LedgerEntryListPage,
  })),
);
const LedgerEntryDetailPage = lazy(() =>
  import("@/features/operations/LedgerEntryDetailPage").then((module) => ({
    default: module.LedgerEntryDetailPage,
  })),
);

function OfficerAuthBoundary() {
  return <AuthProvider><Outlet /></AuthProvider>;
}

function CustomerAuthBoundary() {
  return <CustomerAuthProvider><Outlet /></CustomerAuthProvider>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}
