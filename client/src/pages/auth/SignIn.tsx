import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BackButton } from "@/components/BackButton";

type FormState = {
  email: string;
  password: string;
};

const initialForm: FormState = {
  email: "",
  password: "",
};

export default function SignInPage() {
  console.log("🔵 [SignIn] Component rendered");
  
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"members" | "admin">("members");
  const [memberForm, setMemberForm] = useState<FormState>(initialForm);
  const [adminForm, setAdminForm] = useState<FormState>(initialForm);
  
  console.log("🔵 [SignIn] Component state:", { activeTab, memberForm, adminForm });

  const signInMutation = trpc.auth.signIn.useMutation({
    onSuccess: async (data) => {
      console.log("✅ [SignIn] SUCCESS - Sign in mutation completed!");
      const redirectPath = (data as any)?.redirectPath;
      console.log("✅ [SignIn] Redirect path extracted:", redirectPath);
      
      toast.success("Welcome back!");
      
      // Invalidate and refetch auth state before redirecting
      console.log("🔄 [SignIn] Invalidating auth query...");
      await utils.auth.me.invalidate();
      await refresh();
      console.log("✅ [SignIn] Auth query invalidated");
      
      // Ensure we have a valid redirect path
      let finalPath = redirectPath;
      
      // If no redirectPath, determine from user data (though we might not have it yet)
      if (!finalPath) {
        console.warn("⚠️ [SignIn] No redirectPath in response, defaulting to /dashboard");
        finalPath = "/dashboard";
      }
      
      // Ensure path starts with /
      if (!finalPath.startsWith("/")) {
        finalPath = "/" + finalPath;
      }
      
      console.log("✅ [SignIn] Final redirect path:", finalPath);
      console.log("✅ [SignIn] Full URL will be:", window.location.origin + finalPath);
      
      // Redirect immediately - the cookie is already set by the server
      // The full page reload will pick up the cookie
      console.log("🚀 [SignIn] Executing redirect NOW to:", finalPath);
      window.location.href = finalPath;
    },
    onError: error => {
      console.error("❌ [SignIn] ERROR - Sign in mutation failed!");
      console.error("❌ [SignIn] Error object:", error);
      console.error("❌ [SignIn] Error message:", error?.message);
      console.error("❌ [SignIn] Error data:", error?.data);
      toast.error(error.message || "Unable to sign in. Please try again.");
    },
    onMutate: () => {
      console.log("🔄 [SignIn] Mutation started - submitting sign in request...");
    },
    onSettled: (data, error) => {
      console.log("🏁 [SignIn] Mutation settled");
      console.log("🏁 [SignIn] Data:", data);
      console.log("🏁 [SignIn] Error:", error);
    },
  });

  const adminSignInMutation = trpc.auth.adminSignIn.useMutation({
    onSuccess: (data) => {
      console.log("✅ [SignIn] ADMIN SUCCESS - Admin sign in mutation completed!");
      console.log("✅ [SignIn] Admin response data:", JSON.stringify(data, null, 2));
      const redirectPath = data?.redirectPath;
      console.log("✅ [SignIn] Admin redirect path:", redirectPath);
      
      toast.success("Welcome back!");
      
      const finalPath = redirectPath || "/admin/dashboard";
      console.log("✅ [SignIn] Admin final redirect path:", finalPath);
      
      setTimeout(() => {
        console.log("🚀 [SignIn] Executing admin redirect to:", finalPath);
        window.location.replace(finalPath);
      }, 300);
    },
    onError: error => {
      console.error("❌ [SignIn] ADMIN ERROR - Admin sign in mutation failed!");
      console.error("❌ [SignIn] Admin error:", error);
      toast.error(error.message || "Unable to sign in as admin.");
    },
    onMutate: () => {
      console.log("🔄 [SignIn] ADMIN Mutation started - submitting admin sign in request...");
    },
    onSettled: (data, error) => {
      console.log("🏁 [SignIn] ADMIN Mutation settled");
      console.log("🏁 [SignIn] ADMIN Data:", data);
      console.log("🏁 [SignIn] ADMIN Error:", error);
    },
  });

  // Only redirect if user is already authenticated and not currently logging in
  useEffect(() => {
    // Don't redirect if mutations are in progress
    if (signInMutation.isPending || adminSignInMutation.isPending) return;
    
    // If user is already authenticated, redirect to their dashboard
    if (isAuthenticated && user) {
      const dashboardPath = user.role === "admin" 
        ? "/admin/dashboard"
        : user.userType === "tenant"
        ? "/tenant/dashboard"
        : user.userType === "landlord"
        ? "/landlord/dashboard"
        : "/dashboard";
      setLocation(dashboardPath);
    }
  }, [isAuthenticated, user, setLocation, signInMutation.isPending, adminSignInMutation.isPending]);

  const handleMemberSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    console.log("📝 [SignIn] ===== MEMBER FORM SUBMITTED =====");
    console.log("📝 [SignIn] Email:", memberForm.email);
    console.log("📝 [SignIn] Password length:", memberForm.password.length);
    event.preventDefault();
    console.log("📝 [SignIn] Calling signInMutation.mutate...");
    signInMutation.mutate({
      email: memberForm.email,
      password: memberForm.password,
    });
    console.log("📝 [SignIn] signInMutation.mutate called");
  };

  const handleAdminSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    console.log("📝 [SignIn] ===== ADMIN FORM SUBMITTED =====");
    console.log("📝 [SignIn] Admin Email:", adminForm.email);
    console.log("📝 [SignIn] Admin Password length:", adminForm.password.length);
    event.preventDefault();
    console.log("📝 [SignIn] Calling adminSignInMutation.mutate...");
    adminSignInMutation.mutate({
      email: adminForm.email,
      password: adminForm.password,
    });
    console.log("📝 [SignIn] adminSignInMutation.mutate called");
  };

  const isLoading =
    loading || signInMutation.isPending || adminSignInMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-16 relative">
      <div className="w-full max-w-6xl grid gap-10 md:grid-cols-2">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 text-sm text-white/80 border border-white/20">
            <ShieldCheck className="h-4 w-4" />
            Secure Sign In
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Welcome back to{" "}
            <span className="text-cyan-400">ClearLet</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Access your personalized dashboard, manage applications,
            and keep your rentals moving—all from one secure place.
          </p>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-cyan-500/10 p-2 text-cyan-300">
                ✓
              </div>
              <div>
                <p className="font-semibold text-white">
                  Tenants & Landlords
                </p>
                <p className="text-sm text-slate-400">
                  Apply to properties, track applicants, manage payments, and
                  sign contracts digitally.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-purple-500/10 p-2 text-purple-300">
                ✓
              </div>
              <div>
                <p className="font-semibold text-white">Admins</p>
                <p className="text-sm text-slate-400">
                  Secure access to analytics, user management, compliance logs,
                  and operational workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
            <p className="text-sm uppercase tracking-wide text-slate-400">
              Need an account?
            </p>
            <h2 className="text-2xl font-semibold text-white">
              New to ClearLet?
            </h2>
            <p className="text-slate-400 text-sm">
              Create your professional tenant or landlord profile in minutes.
            </p>
            <Button
              variant="secondary"
              className="w-full md:w-auto"
              onClick={() => setLocation("/signup")}
            >
              Create an account
            </Button>
          </div>
        </section>

        <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur">
          <div className="flex gap-2 rounded-full bg-slate-800/80 p-1 mb-6">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "members"
                  ? "bg-white text-slate-900"
                  : "text-slate-400"
              }`}
              onClick={() => setActiveTab("members")}
            >
              Tenants & Landlords
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "admin"
                  ? "bg-white text-slate-900"
                  : "text-slate-400"
              }`}
              onClick={() => setActiveTab("admin")}
            >
              Admins
            </button>
          </div>

          {activeTab === "members" ? (
            <form className="space-y-5" onSubmit={handleMemberSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={memberForm.email}
                  onChange={event =>
                    setMemberForm(prev => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={memberForm.password}
                  onChange={event =>
                    setMemberForm(prev => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Use the password you created during sign up.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={
                  isLoading ||
                  !memberForm.email ||
                  !memberForm.password
                }
              >
                {signInMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Continue to dashboard"
                )}
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleAdminSubmit}>
              <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/5 px-4 py-3 text-sm text-purple-200">
                <UserRound className="h-5 w-5 text-purple-300" />
                Admin access is restricted to authorized ClearLet staff.
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Admin Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@clearlet.com"
                  value={adminForm.email}
                  onChange={event =>
                    setAdminForm(prev => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Admin Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={adminForm.password}
                  onChange={event =>
                    setAdminForm(prev => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-purple-500 hover:bg-purple-400 text-base"
                disabled={
                  isLoading || !adminForm.email || !adminForm.password
                }
              >
                {adminSignInMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying admin access...
                  </>
                ) : (
                  "Access admin dashboard"
                )}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
