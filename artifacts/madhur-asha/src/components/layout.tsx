import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2, LayoutDashboard, Calculator, Users, FileText, Settings, LogOut, Menu, X } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading Madhur Asha Portal...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    window.location.href = "/";
    return null;
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-3xl shadow-xl border border-border/50">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-3xl font-display font-bold">Awaiting Approval</h2>
          <p className="text-muted-foreground">
            Your access request has been sent to Manish and Guru. You will be able to access the portal once approved.
          </p>
          <Button onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => window.location.href = "/" })} variant="outline" className="mt-4">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (user.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-3xl shadow-xl border border-destructive/20">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <X className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-display font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            Your request to access the portal was not approved. Please contact the administrators if you believe this is an error.
          </p>
          <Button onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => window.location.href = "/" })} variant="outline" className="mt-4">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/calculator", label: "Calculator", icon: Calculator, show: true },
    { href: "/customers", label: "Customers", icon: Users, show: user.role === "admin" || user.role === "customer_access" },
    { href: "/history", label: "History", icon: FileText, show: user.role === "admin" || user.role === "customer_access" },
    { href: "/admin/users", label: "Admin Panel", icon: Settings, show: user.role === "admin" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border/50 sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-display font-extrabold leading-tight text-foreground">
              MADHUR ASHA<br/><span className="text-primary text-sm tracking-widest">ENTERPRISES</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {navItems.filter(item => item.show).map(item => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
              location === item.href 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 rounded-xl mb-4">
            <img src={user.picture || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="w-5 h-5 mr-3" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 rounded-md" />
          <h1 className="text-lg font-display font-extrabold text-foreground leading-none">
            MADHUR ASHA
          </h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background pt-20 pb-4 px-4 flex flex-col">
          <nav className="flex-1 space-y-2">
            {navItems.filter(item => item.show).map(item => (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={cn(
                "flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-200",
                location === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <item.icon className="w-6 h-6" />
                <span className="text-lg">{item.label}</span>
              </Link>
            ))}
          </nav>
          <Button onClick={handleLogout} variant="destructive" className="w-full mt-auto">
            <LogOut className="w-5 h-5 mr-2" />
            Sign out
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
