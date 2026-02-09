import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "For Car Owners", to: "/for-car-owners" },
  { label: "For Shops", to: "/for-shops" },
  { label: "Vehicle Insights", to: "/vehicle-insights" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container-wrenchli flex h-16 items-center justify-between md:h-18">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold">
          <Wrench className="h-6 w-6 text-accent" />
          Wrenchli
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                location.pathname === link.to ? "text-accent" : "text-primary-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            <Link to="/#waitlist">Join the Waitlist</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-primary px-6 pt-8 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`border-b border-primary-foreground/10 py-4 text-lg font-medium ${
                location.pathname === link.to ? "text-accent" : "text-primary-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Button
            asChild
            className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-semibold"
            onClick={() => setOpen(false)}
          >
            <Link to="/#waitlist">Join the Waitlist</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
