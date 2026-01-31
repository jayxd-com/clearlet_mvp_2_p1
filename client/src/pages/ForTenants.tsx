import { useLocation } from "wouter";
import { 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  FileText, 
  Search,
  Star,
  Clock,
  Award
} from "lucide-react";
import { BackButton } from "@/components/BackButton";

export default function ForTenantsPage() {
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
            src="/tenant-using-app.jpg" 
            alt="Tenant searching for properties" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
            <span className="text-sm font-semibold text-cyan-400">For Renters</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Find Your Perfect Home,<br />Stand Out
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Build your tenant reputation, access verified listings, and move in faster with transparent digital processes
          </p>
          <button
            onClick={() => setLocation('/search')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all text-lg"
          >
            Start Searching
          </button>
        </div>
      </section>

      {/* Key Benefits Grid */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">Why tenants love ClearLet</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Stand out in applications, move in faster, and rent with confidence
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Build Your Score</h3>
              <p className="text-muted-foreground">
                Portable tenant reputation that rewards on-time payments and good behavior
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Verified Listings</h3>
              <p className="text-muted-foreground">
                No scams, no fake photos—every property is verified by ClearLet
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Move In Faster</h3>
              <p className="text-muted-foreground">
                Digital contracts and instant verification cut weeks off the process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ClearLet Score for Tenants */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src="/rental-app-screens.png" 
                alt="ClearLet tenant score interface" 
                className="rounded-2xl shadow-2xl border border-border"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                <Star className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Your Competitive Edge</span>
              </div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Your ClearLet Score opens doors
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Build a <strong className="text-cyan-400">portable tenant reputation</strong> (300-850 score) that follows you from property to property. Landlords see your score first—the higher it is, the faster you get approved.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Every on-time payment, positive review, and lease renewal improves your score, helping you compete in tight rental markets.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Stand Out in Applications</p>
                    <p className="text-sm text-muted-foreground">High scores get priority—landlords see you first</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Faster Approvals</p>
                    <p className="text-sm text-muted-foreground">Verified profile speeds up landlord decisions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Portable Reputation</p>
                    <p className="text-sm text-muted-foreground">Your score follows you—no starting from scratch</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Tenant Premium */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ClearLet is free to use. Upgrade to Premium for a competitive advantage.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Tenant Premium</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-cyan-400">€9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Cancel anytime</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Prioritised landlord response",
                  "Profile boost (featured in searches)",
                  "Premium verification badge",
                  "Unlimited saved searches",
                  "Application history & analytics",
                  "Priority support",
                  "Referral rewards",
                  "Profile customization"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setLocation('/signup?plan=tenant_premium')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all"
              >
                Get Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">Everything you need to find home</h2>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
            Search, apply, sign, and move in—all in one place
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Search className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Smart Property Search</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Filter by location, price, bedrooms, move-in date, and more. Save favorites, set alerts, and view properties on an interactive map.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Advanced filters & map view
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Instant availability updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Save favorites & alerts
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">One-Click Applications</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Apply to multiple properties with one profile. Your verification, income proof, and score are shared automatically—no repeated paperwork.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Reusable verified profile
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Track application status
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Direct landlord messaging
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Verified Listings Only</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Every property is verified by ClearLet. No fake photos, no scams, no hidden fees. What you see is what you get.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Property ownership verified
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Accurate photos & details
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Transparent pricing
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-background/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Digital Contracts</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Sign your lease digitally from your phone. LAU-compliant contracts with legal validity—no printing, no in-person meetings.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Sign from anywhere
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Legally binding e-signature
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                  Instant copy to your email
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
            From search to move-in in four simple steps
          </p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Create Profile</h3>
              <p className="text-muted-foreground">
                Verify your identity, add income proof, and build your ClearLet Score.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Search & Apply</h3>
              <p className="text-muted-foreground">
                Browse verified listings, save favorites, and apply with one click.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Get Approved</h3>
              <p className="text-muted-foreground">
                Landlords review your score and profile, schedule viewings, approve you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">
                4
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Sign & Move In</h3>
              <p className="text-muted-foreground">
                Sign contract digitally, pay deposit, get keys, move into your new home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to find your perfect home?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join tenants who are renting smarter with ClearLet
          </p>
          <button
            onClick={() => setLocation('/search')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 transition-all text-lg"
          >
            Start Your Search
          </button>
          <p className="text-sm text-muted-foreground mt-4">Free to join • No credit card required</p>
        </div>
      </section>
    </div>
  );
}
