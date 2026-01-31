import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setLocation("/signin");
      return;
    }

    if (user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (user.userType === "landlord") {
      setLocation("/landlord/dashboard");
    } else {
      setLocation("/tenant/dashboard");
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
