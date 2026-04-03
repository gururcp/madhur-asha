import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Landing() {
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 p-6 bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-primary/10 border border-white/50 animate-in slide-in-from-bottom-8 duration-700">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="Madhur Asha Enterprises Logo" 
            className="w-32 h-32 md:w-48 md:h-48 rounded-2xl mx-auto mb-6 shadow-lg"
          />
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-foreground tracking-tight mb-2">
            MADHUR ASHA <span className="text-primary block md:inline">ENTERPRISES</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-8 max-w-2xl mx-auto text-balance">
            Intelligent GST Profit Calculator & Business Management Portal
          </p>

          <Button
            onClick={() => {
              const apiBaseUrl = import.meta.env.VITE_API_URL || (
                import.meta.env.DEV ? "http://localhost:3000" : ""
              );
              window.location.href = `${apiBaseUrl}/api/auth/google`;
            }}
            size="lg"
            className="w-full sm:w-auto px-12 py-6 text-lg rounded-2xl bg-white text-foreground hover:bg-gray-50 border-2 border-border shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>
          
          <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Secure access restricted to authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
