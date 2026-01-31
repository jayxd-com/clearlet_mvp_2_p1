import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border text-muted-foreground">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-cyan-500">ClearLet</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Transparent rental marketplace for verified tenants and trusted landlords.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-cyan-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              {/* <a
                href="#"
                className="text-muted-foreground hover:text-cyan-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a> */}
              {/* <a
                href="#"
                className="text-muted-foreground hover:text-cyan-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a> */}
              <a
                href="#"
                className="text-muted-foreground hover:text-cyan-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* For Tenants - Hidden for now */}
          {/* 
          <div>
            <h4 className="font-semibold text-white mb-4">For Tenants</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Find a Home
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  My Applications
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Verification Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          */}

          {/* For Landlords - Hidden for now */}
          {/* 
          <div>
            <h4 className="font-semibold text-white mb-4">For Landlords</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  List a Property
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Manage Applications
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          */}

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/trust-and-safety" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0 text-cyan-400" />
                <a href="mailto:hello@clearlet.com" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                  hello@clearlet.com
                </a>
              </li>
              {/* Phone removed as requested */}
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-cyan-400" />
                <span className="text-muted-foreground">{t("globalPresence")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-foreground0">
              © {currentYear} ClearLet. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                Terms of Service
              </Link>
              {/* Cookie Policy and Accessibility removed as requested */}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="bg-card/50 border-t border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Verified Landlords & Tenants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Legal Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}