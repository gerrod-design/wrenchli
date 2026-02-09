import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";

const footerLinks = {
  Company: [
    { label: "About Us", to: "/about" },
    { label: "Leadership", to: "/about#leadership" },
    { label: "Careers", to: "/about", badge: "Coming Soon" },
    { label: "Contact", to: "/contact" },
  ],
  "For Car Owners": [
    { label: "How It Works", to: "/for-car-owners" },
    { label: "Get a Quote", to: "/#quote" },
    { label: "Find a Shop", to: "/#quote", badge: "Coming Soon" },
    { label: "Financing Options", to: "/for-car-owners#financing" },
  ],
  "For Repair Shops": [
    { label: "Partner Program", to: "/for-shops" },
    { label: "How It Works", to: "/for-shops#how-it-works" },
    { label: "Shop Software", to: "/for-shops#features" },
    { label: "Apply Now", to: "/for-shops#apply" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy", badge: "Coming Soon" },
    { label: "Terms of Service", to: "/terms", badge: "Coming Soon" },
    { label: "Accessibility", to: "/accessibility", badge: "Coming Soon" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wrenchli py-12 pb-24 md:py-16 md:pb-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2 font-heading text-xl font-bold">
              <img src={wrenchliLogo} alt="Wrenchli logo" className="h-7 w-7 rounded object-contain" />
              Wrenchli
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-primary-foreground/60">
              Fixing the broken auto repair experience. Coming soon to Detroit.
            </p>
            <a
              href="https://linkedin.com/company/wrenchli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-primary-foreground/10"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 font-heading text-xs font-semibold uppercase tracking-widest text-primary-foreground/40">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    <Link
                      to={link.to}
                      className="text-sm text-primary-foreground/60 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                    {link.badge && (
                      <span className="rounded bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] text-primary-foreground/40">
                        {link.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6 flex flex-col items-center gap-2 text-xs text-primary-foreground/40">
          <p>© {new Date().getFullYear()} Wrenchli, Inc. | Delaware Corporation | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
}
