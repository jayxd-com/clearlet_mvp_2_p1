import { Shield, TrendingUp, FileCheck, MessageSquare, Calendar, MapPin, Search, Clock } from "lucide-react";
import { APP_TITLE } from "@/const";
import { BackButton } from "@/components/BackButton";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 bg-primary/5 border-b border-border relative">
        <div className="absolute top-4 left-4">
          <BackButton fallbackPath="/" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to rent with confidence</h1>
          <p className="text-xl text-muted-foreground">
            {APP_TITLE} brings transparency, speed, and trust to the rental process
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Verified Identities</h3>
                <p className="text-muted-foreground">
                  Every user goes through ID verification. Landlords and tenants can trust who they're dealing with.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Applicant Ranking</h3>
                <p className="text-muted-foreground">
                  Automatic scoring system ranks applicants by verification status, income, and rental history for faster decisions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Document Management</h3>
                <p className="text-muted-foreground">
                  Upload ID, income proof, and employment verification once. Share with landlords with one click.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Direct Messaging</h3>
                <p className="text-muted-foreground">
                  Chat directly with landlords or tenants. No phone tag, no email chains. Everything in one place.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Availability Calendar</h3>
                <p className="text-muted-foreground">
                  See real-time availability and book viewings instantly. No more back-and-forth scheduling.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Map Search</h3>
                <p className="text-muted-foreground">
                  Browse properties on an interactive map. Draw custom search areas and filter by price, bedrooms, and type.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Property Comparison</h3>
                <p className="text-muted-foreground">
                  Save properties and compare them side-by-side. See rent, amenities, and location all at once.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Fast Approvals</h3>
                <p className="text-muted-foreground">
                  Pre-verified documents mean faster application reviews. Get approved in hours, not days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Landlords Section */}
      <section className="py-16 bg-primary/5 border-y border-border">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">For Landlords</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">List Properties</h3>
              <p className="text-muted-foreground">
                Create listings with photos, amenities, and availability calendar in minutes.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Review Applications</h3>
              <p className="text-muted-foreground">
                See ranked applicants with verification scores, income, and employment status.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Accept/Reject</h3>
              <p className="text-muted-foreground">
                One-click approval or rejection. Tenants get instant notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Tenants Section */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">For Tenants</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Search Properties</h3>
              <p className="text-muted-foreground">
                Filter by city, price, bedrooms, and property type. View on map or grid.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Apply Instantly</h3>
              <p className="text-muted-foreground">
                One-click apply with pre-uploaded documents. Share what you choose.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="text-xl font-semibold mb-3">Track Applications</h3>
              <p className="text-muted-foreground">
                See all your applications in one dashboard with real-time status updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to experience better renting?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of landlords and tenants using {APP_TITLE} to make renting transparent and efficient.
          </p>
        </div>
      </section>
    </div>
  );
}
