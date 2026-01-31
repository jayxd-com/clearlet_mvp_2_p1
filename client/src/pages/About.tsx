import { APP_TITLE } from "@/const";
import { BackButton } from "@/components/BackButton";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 bg-primary/5 border-b border-border relative">
        <div className="absolute top-4 left-4">
          <BackButton fallbackPath="/" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About {APP_TITLE}</h1>
          <p className="text-xl text-muted-foreground">
            Making renting transparent, modern, and fully digital
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Renting should be simple, transparent, and fair for everyone. But too often, it's not. Tenants struggle with hidden requirements, slow responses, and unclear processes. Landlords waste time on unverified applicants and manual paperwork.
          </p>
          <p className="text-lg text-muted-foreground mb-4">
            {APP_TITLE} was built to fix this. We're creating a platform where verified tenants meet verified landlords, where applications are ranked by real data, and where digital contracts replace stacks of paper.
          </p>
          <p className="text-lg text-muted-foreground">
            Our goal is to make renting feel sane again—for landlords and tenants alike.
          </p>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-16 bg-primary/5 border-y border-border">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold mb-6">How We're Different</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Verification First</h3>
              <p className="text-muted-foreground">
                Every user—landlord and tenant—goes through ID verification. No anonymous listings, no mystery applicants.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Transparent Scoring</h3>
              <p className="text-muted-foreground">
                Applicants are ranked by verification status, income, and rental history. Landlords see real data, not guesswork.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Fully Digital</h3>
              <p className="text-muted-foreground">
                From property search to contract signing, everything happens online. No more printing, scanning, or mailing documents.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Built for Everyone</h3>
              <p className="text-muted-foreground">
                We understand rental markets. Our platform is designed for local regulations, customs, and expectations globally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Transparency</h3>
              <p className="text-muted-foreground">
                No hidden fees, no surprise requirements. Everything is clear from day one.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Trust</h3>
              <p className="text-muted-foreground">
                Verification builds trust. We make sure everyone is who they say they are.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Efficiency</h3>
              <p className="text-muted-foreground">
                Time is valuable. We automate what can be automated and streamline the rest.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Fairness</h3>
              <p className="text-muted-foreground">
                Landlords and tenants both deserve a fair process. We build for both sides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-primary/5 border-y border-border">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Built by renters, for renters</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Our team has experienced the frustrations of renting firsthand. We know what works and what doesn't. That's why we're building {APP_TITLE}—to create the platform we wish existed when we were searching for homes.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Have questions? Want to partner with us? We'd love to hear from you.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <p className="text-muted-foreground">
              Email: <a href="mailto:hello@clearlet.com" className="text-primary hover:underline">hello@clearlet.com</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
