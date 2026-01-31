export default function Pricing() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Transparent Pricing. <span className="text-cyan-400">No Surprises.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            ClearLet is free during early access for both tenants and landlords. No hidden fees, no commissions, no surprises.
          </p>
        </div>
      </section>

      {/* Early Access Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-slate-900/50 p-8 md:p-12">
            <div className="text-center">
              <span className="inline-block rounded-full bg-cyan-400/20 px-4 py-1 text-sm font-medium text-cyan-400 mb-4">
                Early Access
              </span>
              <h2 className="text-3xl font-bold mb-4">
                Completely Free
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-6">
                During our early access period, ClearLet is 100% free for both tenants and landlords. No subscription fees. No commission on rent. No hidden charges.
              </p>
              <div className="grid gap-6 md:grid-cols-3 mt-8">
                {[
                  {
                    icon: "✓",
                    title: "Unlimited Applications",
                    desc: "Apply to as many properties as you want",
                  },
                  {
                    icon: "✓",
                    title: "Unlimited Listings",
                    desc: "List as many properties as you own",
                  },
                  {
                    icon: "✓",
                    title: "Unlimited Messaging",
                    desc: "Direct communication with no limits",
                  },
                ].map((item) => (
                  <div key={item.title} className="text-left">
                    <div className="text-2xl text-cyan-400 font-bold mb-2">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            What's Included
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "For Tenants",
                features: [
                  "Verified profile creation",
                  "Identity verification",
                  "Income verification",
                  "Affordability scoring",
                  "Apply to unlimited properties",
                  "Direct messaging with landlords",
                  "Document management",
                  "Profile visibility controls",
                ],
              },
              {
                title: "For Landlords",
                features: [
                  "Unlimited property listings",
                  "Professional listing tools",
                  "Verified tenant applications",
                  "Affordability scores for tenants",
                  "Direct messaging",
                  "Application management dashboard",
                  "Digital contract templates",
                  "Tenant verification data",
                ],
              },
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card/50 p-8"
              >
                <h3 className="text-xl font-bold text-cyan-400 mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-cyan-400 font-bold mt-1">✓</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Pricing Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Future Pricing Plans</h2>
          <p className="text-muted-foreground mb-8">
            When we launch paid plans, we'll maintain a free tier for basic usage. Here's what we're considering:
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "€0",
                description: "Perfect for casual users",
                features: [
                  "Profile creation",
                  "Basic verification",
                  "Limited applications/listings",
                  "Standard support",
                ],
              },
              {
                name: "Pro",
                price: "€4.99",
                period: "/month",
                description: "For active users",
                features: [
                  "Everything in Free",
                  "Unlimited applications",
                  "Priority support",
                  "Advanced filters",
                  "Profile analytics",
                ],
                highlighted: true,
              },
              {
                name: "Business",
                price: "€9.99",
                period: "/month",
                description: "For property managers",
                features: [
                  "Everything in Pro",
                  "Unlimited listings",
                  "Team management",
                  "Advanced reporting",
                  "API access",
                  "Dedicated support",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-cyan-400 bg-gradient-to-br from-cyan-400/10 to-slate-900/50"
                    : "border-border bg-card/50"
                }`}
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                <button
                  className={`mt-6 w-full rounded-full py-2 font-medium transition ${
                    plan.highlighted
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "border border-border text-foreground hover:border-cyan-400"
                  }`}
                >
                  Coming Soon
                </button>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Pricing FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: "Will ClearLet always be free?",
                a: "During early access, yes. We may introduce optional premium features in the future, but the core platform will remain free.",
              },
              {
                q: "Do you take commission from rent?",
                a: "No. ClearLet never takes a percentage of rent. We're not an agent. Our revenue model is transparent and fair.",
              },
              {
                q: "Are there any hidden fees?",
                a: "Absolutely not. What you see is what you get. No surprise charges, no fine print.",
              },
              {
                q: "What if I need more features?",
                a: "We're always listening to user feedback. Tell us what you need and we'll consider it for future updates.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-border bg-card/50 p-6"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
