import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "tenant",
    subject: "general",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    // Reset form
    setFormData({
      name: "",
      email: "",
      userType: "tenant",
      subject: "general",
      message: "",
    });
  };

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Get in touch. We're here to help.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Have a question about ClearLet? Need support? We'd love to hear from you. Our team responds to all inquiries within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {[
              {
                icon: "📧",
                title: "Email",
                description: "support@clearlet.com",
                detail: "We respond within 24 hours",
              },
              {
                icon: "💬",
                title: "Live Chat",
                description: "Available on the platform",
                detail: "Mon-Fri, 9am-6pm CET",
              },
              {
                icon: "📱",
                title: "Social Media",
                description: "@ClearLetApp",
                detail: "Follow us for updates",
              },
            ].map((method) => (
              <div
                key={method.title}
                className="rounded-2xl border border-border bg-card/50 p-6 text-center"
              >
                <div className="text-4xl mb-3">{method.icon}</div>
                <h3 className="font-semibold text-lg">{method.title}</h3>
                <p className="text-cyan-400 mt-2">{method.description}</p>
                <p className="text-sm text-muted-foreground mt-1">{method.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground0 focus:border-cyan-400 focus:outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground0 focus:border-cyan-400 focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    I am a...
                  </label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Support Request</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground0 focus:border-cyan-400 focus:outline-none"
                    rows={6}
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-slate-950 hover:bg-cyan-300 transition"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Common questions</h2>
              <div className="space-y-4">
                {[
                  {
                    q: "How quickly will I get a response?",
                    a: "Our team aims to respond to all inquiries within 24 hours during business days.",
                  },
                  {
                    q: "What should I do if I found a bug?",
                    a: "Please use the 'Report a Bug' option in the subject dropdown and describe the issue in detail.",
                  },
                  {
                    q: "Can I request a feature?",
                    a: "Absolutely! We love hearing from our users. Select 'Feature Request' and tell us what you'd like to see.",
                  },
                  {
                    q: "Is there a phone number I can call?",
                    a: "We're currently email and chat only, but we're working on adding phone support soon.",
                  },
                  {
                    q: "Do you offer partnership opportunities?",
                    a: "Yes! If you're interested in partnering with ClearLet, select 'Partnership' and we'll be in touch.",
                  },
                ].map((item) => (
                  <div
                    key={item.q}
                    className="rounded-xl border border-border bg-card/50 p-4"
                  >
                    <h3 className="font-semibold text-foreground">{item.q}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Response Time Section */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">We're committed to helping</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're a tenant looking for your perfect home or a landlord seeking reliable renters, our support team is here to make your experience smooth and successful.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { number: "24h", label: "Average response time" },
              { number: "99%", label: "Customer satisfaction" },
              { number: "7/7", label: "Days we're available" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-cyan-400">{stat.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
