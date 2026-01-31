import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Building2, CheckCircle2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/BackButton";
import { useLanguage } from "@/contexts/LanguageContext";

type Role = "tenant" | "landlord";

export default function SignUpPage() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<Role>("tenant");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  const signUpMutation = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      toast.success("Account created successfully!");
      // In v2, signUp returns { success: true }, not redirectPath
      // But we can redirect to dashboard or signin
      setLocation("/dashboard");
    },
    onError: error => {
      toast.error(error.message || "Unable to create account. Please try again.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    signUpMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: selectedRole,
      languagePreference: language,
    });
  };

  const isSubmitting = signUpMutation.isPending;

  const roleCards: Array<{
    role: Role;
    title: string;
    description: string;
    icon: JSX.Element;
    benefits: string[];
  }> = [
    {
      role: "tenant",
      title: "I'm a Tenant",
      description: "Verified renter looking for high-quality homes",
      icon: <Home className="h-6 w-6 text-cyan-400" />,
      benefits: [
        "One profile for all applications",
        "Instant messaging with landlords",
        "Digital contracts & payments",
        "Document vault for ID & income",
      ],
    },
    {
      role: "landlord",
      title: "I'm a Landlord",
      description: "Manage your rentals and verify applicants faster",
      icon: <Building2 className="h-6 w-6 text-cyan-400" />,
      benefits: [
        "List properties in minutes",
        "Screen tenants with ClearScore",
        "Automate contracts & renewals",
        "Track maintenance & finances",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-16 relative">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-cyan-300" />
            Trusted rental profiles
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Create your verified{" "}
            <span className="text-cyan-400">ClearLet</span> profile
          </h1>
          <p className="text-slate-300 text-lg">
            Sign up once and manage your entire rental journey—from property
            discovery to digital contracts—securely and transparently.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {roleCards.map(card => (
              <button
                key={card.role}
                type="button"
                onClick={() => setSelectedRole(card.role)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedRole === card.role
                    ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/20"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{card.title}</h3>
                    <p className="text-sm text-slate-400">{card.description}</p>
                  </div>
                  <div className="rounded-full bg-slate-900/70 p-3">
                    {card.icon}
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {card.benefits.map(benefit => (
                    <li key={benefit} className="flex items-center gap-2">
                      <span className="text-cyan-400">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-900/70 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wide text-slate-400 mb-2">
              Step 1 of 2
            </p>
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-slate-400">
              Tell us who you are and we'll tailor your dashboard.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-300">
                Full name
              </label>
              <Input
                placeholder="Alex Johnson"
                value={form.name}
                onChange={event =>
                  setForm(prev => ({ ...prev, name: event.target.value }))
                }
                required
                className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={event =>
                  setForm(prev => ({ ...prev, email: event.target.value }))
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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={event =>
                  setForm(prev => ({ ...prev, password: event.target.value }))
                }
                required
                minLength={8}
                className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">
                Confirm password
              </label>
              <Input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                required
                className="mt-2 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={
                isSubmitting ||
                !form.name ||
                !form.email ||
                !form.password ||
                !form.confirmPassword
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : selectedRole === "tenant" ? (
                "Join as Tenant"
              ) : (
                "Join as Landlord"
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              By continuing you agree to ClearLet's{" "}
              <button
                type="button"
                className="text-cyan-300 underline-offset-4 hover:underline"
                onClick={() => setLocation("/terms")}
              >
                Terms
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="text-cyan-300 underline-offset-4 hover:underline"
                onClick={() => setLocation("/privacy")}
              >
                Privacy Policy
              </button>
              .
            </p>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              className="text-cyan-300 font-medium hover:text-cyan-200"
              onClick={() => setLocation("/signin")}
            >
              Sign in
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
