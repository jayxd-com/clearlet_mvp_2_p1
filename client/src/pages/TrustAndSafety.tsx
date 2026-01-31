export default function TrustAndSafety() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Trust and Safety. <span className="text-cyan-400">Built in from day one.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            We combine verification, encryption, and clear processes to keep both tenants and landlords safer on ClearLet. Your safety is our priority.
          </p>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Our Trust & Safety Pillars</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                icon: "✓",
                title: "Verification",
                description: "Identity and income checks reduce fraud and ensure everyone is who they claim to be.",
              },
              {
                icon: "🔒",
                title: "Encryption",
                description: "Your data is encrypted in transit and at rest using industry-standard security.",
              },
              {
                icon: "🛡️",
                title: "Privacy",
                description: "You control who sees your information. Share selectively. Revoke access anytime.",
              },
              {
                icon: "📋",
                title: "Transparency",
                description: "Clear policies, clear processes, and clear communication about how we protect you.",
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-border bg-card/50 p-6 text-center"
              >
                <div className="text-3xl mb-3">{pillar.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Verification Process</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Identity Verification",
                description: "We verify your identity using official documents (passport or national ID). This prevents fraud and ensures everyone is who they claim to be.",
                details: [
                  "Document validation against official databases",
                  "Liveness checks to prevent spoofing",
                  "Secure document storage",
                  "Verification badge on your profile",
                ],
              },
              {
                title: "Income Verification",
                description: "We verify your income using recent payslips, employment letters, or bank statements. This helps landlords assess affordability.",
                details: [
                  "Verification of recent income documents",
                  "Affordability score calculation",
                  "Income-to-rent ratio analysis",
                  "Secure document storage",
                ],
              },
              {
                title: "Affordability Scoring",
                description: "Our algorithm calculates an affordability score based on verified income and rent price. This guides landlords but doesn't make decisions for them.",
                details: [
                  "Data-driven scoring algorithm",
                  "Transparent calculation methodology",
                  "Landlord discretion always applies",
                  "Regular score updates",
                ],
              },
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <h3 className="font-semibold text-cyan-400 mb-3">{section.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.details.map((detail) => (
                    <li key={detail} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Security */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Data Security & Privacy</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/50 p-8">
              <h3 className="font-semibold text-cyan-400 mb-4 text-lg">How We Protect Your Data</h3>
              <ul className="space-y-3">
                {[
                  "Encrypted in transit using TLS 1.3",
                  "Encrypted at rest using AES-256",
                  "Secure authentication with strong passwords",
                  "Regular security audits and penetration testing",
                  "Compliance with GDPR and data protection laws",
                  "No third-party access without your consent",
                  "Automatic data deletion on account closure",
                  "Secure backup and disaster recovery",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-8">
              <h3 className="font-semibold text-cyan-400 mb-4 text-lg">Your Privacy Controls</h3>
              <ul className="space-y-3">
                {[
                  "Control who sees your profile",
                  "Share documents selectively",
                  "Revoke access from landlords anytime",
                  "Download your data anytime",
                  "Delete your account and data",
                  "Opt out of marketing communications",
                  "View access logs",
                  "Report privacy concerns",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground flex items-center gap-2">
                    <span className="text-cyan-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Safety for Both Sides */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Safety for Tenants & Landlords</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/50 p-8">
              <h3 className="font-semibold text-cyan-400 mb-4 text-lg">For Tenants</h3>
              <ul className="space-y-3">
                {[
                  "Verified landlord profiles reduce scams",
                  "Clear property information and photos",
                  "Report suspicious listings or users",
                  "Direct communication with landlords",
                  "Digital contracts for legal protection",
                  "Guidance on safe property viewings",
                  "No unsolicited contact from landlords",
                  "Privacy controls for your information",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card/50 p-8">
              <h3 className="font-semibold text-cyan-400 mb-4 text-lg">For Landlords</h3>
              <ul className="space-y-3">
                {[
                  "Verified tenant profiles reduce fraud",
                  "Income verification for affordability",
                  "Affordability scores guide decisions",
                  "Block problematic users",
                  "Report suspicious activity",
                  "Digital contracts for legal protection",
                  "Messaging records for documentation",
                  "Application history and tracking",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Community Guidelines</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            ClearLet is a community for verified users. We have clear guidelines to keep everyone safe.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Prohibited Behavior",
                items: [
                  "Fraud or misrepresentation",
                  "Discrimination based on protected characteristics",
                  "Harassment or abusive language",
                  "Spam or unsolicited contact",
                  "Illegal activity",
                  "Sharing others' personal information",
                ],
              },
              {
                title: "Enforcement",
                items: [
                  "Reports are reviewed within 24 hours",
                  "Warnings for minor violations",
                  "Account suspension for serious violations",
                  "Permanent ban for repeated violations",
                  "Cooperation with law enforcement when required",
                  "Appeal process for account actions",
                ],
              },
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <h3 className="font-semibold text-cyan-400 mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="text-muted-foreground flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting & Support */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Report & Get Help</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Report a Listing",
                description: "Found a suspicious or fake listing? Report it and we'll investigate within 24 hours.",
              },
              {
                title: "Report a User",
                description: "Experienced harassment or suspicious behavior? Report the user and we'll take action.",
              },
              {
                title: "Report a Scam",
                description: "Suspect fraud? Report it immediately and we'll help investigate.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card/50 p-6 text-center"
              >
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <button className="text-cyan-400 hover:text-cyan-300 font-medium text-sm">
                  Report Now →
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card/50 p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Questions about safety?</h3>
            <p className="text-muted-foreground mb-6">
              Our Trust & Safety team is here to help. Contact us anytime.
            </p>
            <button className="rounded-full bg-cyan-400 px-6 py-2 font-medium text-slate-950 hover:bg-cyan-300">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
