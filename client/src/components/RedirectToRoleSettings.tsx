import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function RedirectToRoleSettings() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.userType || "tenant";
      // Map 'agency' and 'clearbnb_host' if needed, but standard logic is:
      const target = role === "admin" || user.role === "admin" 
        ? "/admin/settings" 
        : `/${role}/settings`;
      
      setLocation(target);
    } else if (!isLoading && !user) {
        setLocation("/signin");
    }
  }, [user, isLoading, setLocation]);

  return <div className="p-8 text-center">Redirecting...</div>;
}
