import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2, LayoutDashboard, Calculator, Users, FileText, Settings, LogOut, X, ChevronRight } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      onSuccess: () => { window.location.href = "/"; }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/calculator", label: "Calculator", icon: Calculator, show: true },
    { href: "/customers", label: "Customers", icon: Users, show: user.role === "admin" || user.role === "customer_access" },
    { href: "/history", label: "History", icon: FileText, show: user.role === "admin" || user.role === "customer_access" },
    { href: "/admin/users", label: "Admin", icon: Settings, show: user.role === "admin" },
  ];

  const visibleNav = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border/50 sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-display font-extrabold leading-tight text-foreground">
              MADHUR ASHA<br /><span className="text-primary text-sm tracking-widest">ENTERPRISES</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {visibleNav.map(item => (
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
            <img src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-10 h-10 rounded-full" />
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

      {/* ── Mobile Top Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-7 h-7 rounded-md" />
          <span className="text-base font-display font-extrabold text-foreground tracking-tight">MADHUR ASHA</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full"
        >
          <img src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt="" className="w-5 h-5 rounded-full" />
          {user.name.split(' ')[0]}
        </button>
      </div>

      {/* ── Mobile Slide-over Drawer ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <img src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-bold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {visibleNav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 rounded-xl font-medium transition-all",
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {location !== item.href && <ChevronRight className="w-4 h-4 opacity-40" />}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border/50">
              <Button onClick={handleLogout} variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border/50 flex items-stretch">
        {visibleNav.slice(0, 5).map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all text-xs font-semibold",
              location === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5 mb-0.5", location === item.href && "stroke-[2.5]")} />
            <span className="leading-none">{item.label}</span>
            {location === item.href && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
