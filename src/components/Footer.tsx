import { Link } from "react-router-dom";
import { Wrench, Linkedin } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "For Car Owners", to: "/for-car-owners" },
    { label: "For Shop Owners", to: "/for-shops" },
    { label: "Vehicle Insights", to: "/vehicle-insights" },
  ],
  Company: [
    { label: "About Us", to: "/about" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact", to: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wrenchli py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-2 font-heading text-xl font-bold">
              <Wrench className="h-6 w-6 text-accent" />
              Wrenchli
            </Link>
            <p className="mb-4 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Fixing the broken auto repair experience. Transparent pricing, vetted shops, and financing — coming soon to Detroit.
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

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground/50">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Wrenchli, Inc. All rights reserved. Delaware C Corporation.
        </div>
      </div>
    </footer>
  );
}
