const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is ClearLet?",
        a: "ClearLet is a digital rental marketplace that connects verified tenants with landlords directly. We eliminate agents, reduce friction, and make renting transparent through verified profiles, income checks, and digital contracts.",
      },
      {
        q: "Is ClearLet a real estate agency?",
        a: "No. ClearLet is a digital platform that connects tenants and landlords directly. We are not an agent and we do not take commission from rent.",
      },
      {
        q: "Where is ClearLet available?",
        a: "We are currently in early access in select markets, with plans to expand across Europe and beyond. Sign up to be notified when we launch in your country.",
      },
      {
        q: "Does it cost anything to use ClearLet?",
        a: "During early access, ClearLet is completely free for both tenants and landlords. We may introduce transparent pricing in the future, but we'll always offer a free tier.",
      },
    ],
  },
  {
    category: "For Tenants",
    questions: [
      {
        q: "How do I create a profile?",
        a: "Sign up with your email, add your basic information, and upload verification documents (ID and income proof). Your profile is then reviewed and you get a verification score.",
      },
      {
        q: "What documents do I need?",
        a: "You'll need a valid ID (passport or national ID) and proof of income (recent payslips, employment letter, or bank statements). These help landlords understand your financial situation.",
      },
      {
        q: "Can I apply to multiple properties?",
        a: "Yes! Once your profile is verified, you can apply to as many properties as you want. Your verified profile makes applications stronger and faster.",
      },
      {
        q: "What is the affordability score?",
        a: "Your affordability score shows landlords whether you can comfortably afford the rent based on your income. It's calculated automatically from your verified income.",
      },
      {
        q: "Can I hide my information from certain landlords?",
        a: "Yes. You control who sees your profile. You can share your information selectively with landlords you're interested in.",
      },
    ],
  },
  {
    category: "For Landlords",
    questions: [
      {
        q: "How do I list a property?",
        a: "Create an account, add your property details (address, bedrooms, rent price, amenities), upload photos, and publish. Your listing goes live immediately.",
      },
      {
        q: "How do I receive applications?",
        a: "Once your property is listed, verified tenants can apply. You'll see their verified profile, affordability score, and can message them directly.",
      },
      {
        q: "Do you guarantee rent payments?",
        a: "No. We provide verification tools and information, but the decision and responsibility remain with the landlord. We recommend checking references and using legal contracts.",
      },
      {
        q: "Can I set application requirements?",
        a: "Yes. You can specify minimum income requirements, preferred move-in dates, and other criteria. Tenants see these upfront.",
      },
      {
        q: "How do I manage inquiries?",
        a: "All inquiries appear in your dashboard. You can message tenants directly, accept applications, or request additional information.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        q: "Is my data secure?",
        a: "We use industry-standard encryption and strict access controls. Your documents are stored securely and only shared with landlords you approve.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. You can delete your account anytime. Your data will be securely deleted in accordance with our Privacy Policy.",
      },
      {
        q: "Who can see my documents?",
        a: "Only landlords you choose to share with can see your documents. You have full control over what information is visible.",
      },
      {
        q: "How is my identity verified?",
        a: "We use secure document verification to confirm your identity. Your documents are checked against official databases to prevent fraud.",
      },
    ],
  },
  {
    category: "Contracts & Legal",
    questions: [
      {
        q: "Does ClearLet provide contracts?",
        a: "Yes. We provide digital contract templates that comply with Spanish law. Both parties can sign digitally.",
      },
      {
        q: "Are ClearLet contracts legally binding?",
        a: "Our contract templates are designed to comply with local rental laws. We recommend consulting a lawyer for complex situations.",
      },
      {
        q: "What if there's a dispute?",
        a: "ClearLet is a platform, not a mediator. Disputes are handled between the parties according to local law. We recommend having clear contracts and communication.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="bg-background text-foreground">
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Everything you need to know about ClearLet. Can't find your answer? Contact our support team.
          </p>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">
                  {section.category}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((item) => (
                    <div
                      key={item.q}
                      className="rounded-2xl border border-border bg-card/50 p-6 hover:border-cyan-400/50 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-foreground">
                        {item.q}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-border bg-card/50 p-8 text-center">
            <h3 className="text-xl font-semibold">Still have questions?</h3>
            <p className="mt-2 text-muted-foreground">
              Our support team is here to help. Reach out anytime.
            </p>
            <button className="mt-4 rounded-full bg-cyan-400 px-6 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
