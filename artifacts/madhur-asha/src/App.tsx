import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CalculatorPage from "@/pages/calculator";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import SuppliersPage from "@/pages/suppliers";
import ItemsPage from "@/pages/items";
import ExpensesPage from "@/pages/expenses";
import ReportsPage from "@/pages/reports";
import AnalyticsPage from "@/pages/analytics";
import StageManagementPage from "@/pages/stage-management";
import HistoryPage from "@/pages/history";
import AdminUsersPage from "@/pages/admin-users";
import NotFound from "@/pages/not-found";

// Configure API base URL for all API requests
// In development, the API server runs on a different port
// In production, both frontend and backend are on same domain (arvat.in subdomains)
const apiBaseUrl = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? "http://localhost:3000" : ""
);
setBaseUrl(apiBaseUrl);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on reconnect
      retry: 1, // Retry failed requests once
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  console.log('[APP] Router component rendering');
  console.log('[APP] Routes registered:');
  console.log('[APP] - /orders/:id -> OrderDetailPage (handles create, edit, and view)');
  console.log('[APP] - /orders -> OrdersPage');
  
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/calculator"><ProtectedRoute component={CalculatorPage} /></Route>
      <Route path="/orders/:id/edit">
        {(params) => {
          console.log('[APP] ========================================');
          console.log('[APP] Route /orders/:id/edit MATCHED!');
          console.log('[APP] params:', params);
          console.log('[APP] orderId:', params.id);
          console.log('[APP] Rendering OrderDetailPage in EDIT mode');
          console.log('[APP] ========================================');
          return <ProtectedRoute component={OrderDetailPage} />;
        }}
      </Route>
      <Route path="/orders/:id">
        {(params) => {
          console.log('[APP] ========================================');
          console.log('[APP] Route /orders/:id MATCHED!');
          console.log('[APP] params:', params);
          console.log('[APP] orderId:', params.id);
          console.log('[APP] Rendering OrderDetailPage');
          console.log('[APP] ========================================');
          return <ProtectedRoute component={OrderDetailPage} />;
        }}
      </Route>
      <Route path="/orders"><ProtectedRoute component={OrdersPage} /></Route>
      <Route path="/customers/:id"><ProtectedRoute component={CustomerDetailPage} /></Route>
      <Route path="/customers"><ProtectedRoute component={CustomersPage} /></Route>
      <Route path="/suppliers"><ProtectedRoute component={SuppliersPage} /></Route>
      <Route path="/items"><ProtectedRoute component={ItemsPage} /></Route>
      <Route path="/expenses"><ProtectedRoute component={ExpensesPage} /></Route>
      <Route path="/reports"><ProtectedRoute component={ReportsPage} /></Route>
      <Route path="/analytics"><ProtectedRoute component={AnalyticsPage} /></Route>
      <Route path="/history"><ProtectedRoute component={HistoryPage} /></Route>
      <Route path="/admin/stages"><ProtectedRoute component={StageManagementPage} /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsersPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
