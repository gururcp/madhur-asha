import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CalculatorPage from "@/pages/calculator";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import HistoryPage from "@/pages/history";
import AdminUsersPage from "@/pages/admin-users";
import NotFound from "@/pages/not-found";

// Configure API base URL for all API requests
// In development, the API server runs on a different port (localhost:3000)
// In production, Vercel proxies /api/* to Render, so we use relative URLs
const apiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";
setBaseUrl(apiBaseUrl);

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/calculator"><ProtectedRoute component={CalculatorPage} /></Route>
      <Route path="/customers"><ProtectedRoute component={CustomersPage} /></Route>
      <Route path="/customers/:id"><ProtectedRoute component={CustomerDetailPage} /></Route>
      <Route path="/history"><ProtectedRoute component={HistoryPage} /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsersPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
