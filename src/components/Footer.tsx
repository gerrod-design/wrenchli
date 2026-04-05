import { useState } from "react";
import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";
import wrenchliLogo from "@/assets/wrenchli-logo-dark.png";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";


const footerLinks = {
  Company: [
    { label: "About Us", to: "/about" },
    { label: "Leadership", to: "/about#leadership" },
    { label: "Investors", to: "/investors" },
    { label: "Careers", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "Developers", to: "/developers" },
  ],
  "For Vehicle Owners": [
    { label: "How It Works", to: "/for-car-owners" },
    { label: "💬 Recommend a Shop", to: "__recommend__" },
    { label: "Financing Options", to: "/for-car-owners#financing" },
  ],
  "For Repair Shops": [
    { label: "Partner Program", to: "/for-shops" },
    { label: "How It Works", to: "/for-shops#how-it-works" },
    { label: "Shop Software", to: "/for-shops#features" },
    { label: "Apply Now", to: "/for-shops#apply" },
  ],
  "For Finance Providers": [
    { label: "Partner With Us", to: "/contact" },
    { label: "Integration", to: "/contact" },
    { label: "Contact Us", to: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Accessibility", to: "/accessibility" },
    { label: "🍪 Manage Cookies", to: "__cookies__" },
  ],
};

export default function Footer() {
  const [recommendOpen, setRecommendOpen] = useState(false);
  
  return (
    <footer className="text-primary-foreground" style={{ backgroundColor: "#0F1117" }}>
      <div className="container-wrenchli py-12 pb-24 md:py-16 md:pb-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2 font-heading text-xl font-bold" style={{ color: "#F5F5F5" }}>
              <img src={wrenchliLogo} alt="Wrenchli logo" className="h-8 w-8 object-contain" />
              Wrenchli
            </Link>
            <p className="mb-1 text-sm font-medium tracking-wide" style={{ color: "#6B7280" }}>
              Mobility for All.
            </p>
            <p className="mb-5 text-xs leading-relaxed text-primary-foreground/50">
              Fixing the broken vehicle repair experience.
            </p>
            <a
              href="https://linkedin.com/company/wrenchli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-primary-foreground/10"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" style={{ color: "#E07B39" }} />
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 font-heading text-xs font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "#E07B39" }}>
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    {link.to === "__recommend__" ? (
                      <button
                        onClick={() => setRecommendOpen(true)}
                        className="text-sm text-primary-foreground/60 transition-colors hover:text-accent text-left"
                      >
                        {link.label}
                      </button>
                    ) : link.to === "__cookies__" ? (
                      <button
                        onClick={() => {
                          localStorage.removeItem("wrenchli_cookie_consent");
                          window.location.reload();
                        }}
                        className="text-sm text-primary-foreground/60 transition-colors hover:text-accent text-left"
                      >
                        {link.label}
                      </button>
                    ) : link.to.includes("#") ? (
                      <a
                        href={link.to}
                        className="text-sm text-primary-foreground/60 transition-colors hover:text-accent"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-primary-foreground/60 transition-colors hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6 flex flex-col items-center gap-2 text-xs text-primary-foreground/40">
          <p>© {new Date().getFullYear()} Wrenchli, Inc. | Delaware Corporation | All&nbsp;Rights&nbsp;Reserved</p>
          <p className="text-primary-foreground/30 text-[11px]">Built in Michigan. Driven by trust.</p>
          <p className="text-primary-foreground/30 text-[11px]">Wrenchli participates in affiliate programs including Amazon Associates.</p>
        </div>
      </div>
      <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
    </footer>
  );
}
