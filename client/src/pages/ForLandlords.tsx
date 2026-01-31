import { useLocation } from "wouter";
import {
  CheckCircle,
  TrendingUp,
  Shield,
  FileText,
  BarChart3,
  Users,
  Clock,
  DollarSign,
  Star
} from "lucide-react";
import { BackButton } from "@/components/BackButton";

export default function ForLandlordsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 z-20">
          <BackButton fallbackPath="/" className="text-white hover:text-cyan-400" />
        </div>
        <div className="absolute inset-0 z-0">
          <img
            src="/landlord-with-keys.webp"
            alt="Landlord managing properties"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
            <span className="text-sm font-semibold text-purple-400">For Property Owners</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Find Quality Tenants,<br />Faster
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Pre-screened applicants, data-driven scoring, and digital contracts—everything you need to rent with confidence
          </p>
          <button
            onClick={() => setLocation('/dashboard')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all text-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">Why landlords choose ClearLet</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Reduce vacancy time, lower risk, and manage everything digitally
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">48 Hours</h3>
              <p className="text-muted-foreground">
                Average decision time (down from 7 days) with instant verification
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Mitigated risk</h3>
              <p className="text-muted-foreground">
                Tenant scoring reduces late payments and problem tenants
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">€0 Upfront</h3>
              <p className="text-muted-foreground">
                No listing fees—only pay when you find the right tenant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ClearLet Score for Landlords */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
                <Star className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-400">Unique Advantage</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                See the best applicants first
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Every tenant on ClearLet has a <strong className="text-purple-400">ClearLet Score</strong> (300-850) based on rental history, income verification, employment stability, and landlord reviews.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Applications are automatically ranked by score, so you can focus on qualified candidates and make data-driven decisions in hours, not days.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Verified Income & Employment</p>
                    <p className="text-sm text-muted-foreground">See proof of income and job stability before scheduling viewings</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Rental Payment History</p>
                    <p className="text-sm text-muted-foreground">Track record of on-time payments from previous landlords</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Identity Verification</p>
                    <p className="text-sm text-muted-foreground">Government ID checks and document verification included</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <img
                src="/digital-verification.jpeg"
                alt="Tenant verification dashboard"
                className="rounded-2xl shadow-2xl border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Landlord Tiers */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Plans for every portfolio</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the right plan for your property management needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-border bg-background p-6 hover:border-purple-400/50 transition-colors">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">Starter</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">€50</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Perfect for new landlords</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>1-2 Properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Up to 2 Tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Basic Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>100MB Storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Email Support</span>
                </li>
              </ul>
              <button
                onClick={() => setLocation('/signup?plan=landlord_starter')}
                className="w-full py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors font-medium"
              >
                Choose Starter
              </button>
            </div>

            {/* Professional */}
            <div className="rounded-2xl border-2 border-purple-500 bg-background p-6 relative shadow-xl shadow-purple-500/10">
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">Professional</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-purple-400">€149</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">For growing portfolios</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>3-5 Properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Up to 10 Tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>500MB Storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <button
                onClick={() => setLocation('/signup?plan=landlord_professional')}
                className="w-full py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors font-medium"
              >
                Choose Professional
              </button>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border border-border bg-background p-6 hover:border-purple-400/50 transition-colors">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">Premium</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">€299</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Full power for pros</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>6-10 Properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Up to 25 Tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Full Analytics Suite</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>2GB Storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Dedicated Support</span>
                </li>
              </ul>
              <button
                onClick={() => setLocation('/signup?plan=landlord_premium')}
                className="w-full py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors font-medium"
              >
                Choose Premium
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-border bg-background p-6 hover:border-purple-400/50 transition-colors">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground">Enterprise</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">€499</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Unlimited scale</p>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Unlimited Properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Unlimited Tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Custom Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>Unlimited Storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                  <span>24/7 Priority Support</span>
                </li>
              </ul>
              <button
                onClick={() => setLocation('/signup?plan=landlord_enterprise')}
                className="w-full py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors font-medium"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">Complete landlord toolkit</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Manage your entire rental business from one platform
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Application Management</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Receive, review, and respond to applications in one dashboard. Track application status, schedule viewings, and communicate directly with candidates.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Ranked by ClearLet Score
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Built-in messaging system
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Viewing scheduler
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Digital Contracts</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Generate LAU-compliant rental contracts automatically. Both parties sign digitally with legal validity—no printing, scanning, or in-person meetings required.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  LAU-compliant templates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  E-signature with legal validity
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Automatic reminders
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Analytics & Insights</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Track listing performance, application conversion rates, and market trends. Optimize pricing and improve your listings based on data.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Listing views & engagement
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Application funnel metrics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Market pricing insights
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Legal Protection</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                All contracts comply with Spanish rental law (LAU). Access to legal resources, dispute resolution support, and eviction assistance if needed.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  LAU-compliant contracts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Legal resource library
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  Dispute resolution support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">How it works</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            From listing to signed contract in four simple steps
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">List Your Property</h3>
              <p className="text-muted-foreground">
                Upload photos, set rent, add details. Your listing goes live instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Review Applications</h3>
              <p className="text-muted-foreground">
                See ranked applicants with verified scores, income, and rental history.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Schedule Viewing</h3>
              <p className="text-muted-foreground">
                Communicate directly, schedule viewings, and select your tenant.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                4
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Sign & Move In</h3>
              <p className="text-muted-foreground">
                Generate contract, both parties sign digitally, tenant moves in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to find your next tenant?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join landlords who are renting smarter with ClearLet
          </p>
          <button
            onClick={() => setLocation('/dashboard')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transition-all text-lg"
          >
            List Your Property
          </button>
          <p className="text-sm text-muted-foreground mt-4">No credit card required • Free to list</p>
        </div>
      </section>
    </div>
  );
}
