import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import { useEffect } from "react";

// Configure API base URL for all API requests
// In development, the API server runs on a different port
// In production, both frontend and backend are served from different origins
const apiBaseUrl = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? "http://localhost:3000" : ""
);
setBaseUrl(apiBaseUrl);

const queryClient = new QueryClient();

// Handles ?auth_token= on ANY route after OAuth redirect
function AuthTokenHandler() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get("auth_token");
    if (!authToken) return;

    // Strip token from URL immediately
    window.history.replaceState({}, "", window.location.pathname);

    fetch(`${apiBaseUrl}/api/auth/exchange-token?token=${authToken}`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          // Invalidate all queries so useGetMe refetches with the new session
          queryClient.invalidateQueries();
          setLocation("/dashboard");
        } else {
          console.error("Token exchange failed:", res.status);
          setLocation("/");
        }
      })
      .catch((err) => {
        console.error("Token exchange error:", err);
        setLocation("/");
      });
  }, []); // runs once on mount

  return null;
}

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
        <AuthTokenHandler />
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
