import { useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardSidebar } from "./DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";

interface TenantLayoutProps {
  children: React.ReactNode;
}

export function TenantLayout({ children }: TenantLayoutProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.userType !== "tenant") {
        setLocation("/signin");
      }
    }
  }, [isAuthenticated, user, loading, setLocation]);

  if (loading || !isAuthenticated || user?.userType !== "tenant") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar - Sticky below Navbar */}
      <DashboardSidebar 
        userType="tenant" 
        className="hidden lg:flex sticky top-16 h-[calc(100vh-4rem)]" 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header removed - handled by Navbar now */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}