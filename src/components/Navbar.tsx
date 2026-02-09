import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";
import GarageDropdown from "@/components/garage/GarageDropdown";
import GarageBadge from "@/components/vehicle/GarageBadge";
import { useGarage } from "@/hooks/useGarage";

interface DropdownItem {
  label: string;
  to: string;
}

interface NavItem {
  label: string;
  to: string;
  dropdown?: DropdownItem[];
}

const navItems: NavItem[] = [
  {
    label: "For Car Owners",
    to: "/for-car-owners",
    dropdown: [
      { label: "How It Works", to: "/for-car-owners" },
      { label: "Vehicle Insights", to: "/vehicle-insights" },
      { label: "Financing", to: "/for-car-owners#financing" },
    ],
  },
  {
    label: "For Repair Shops",
    to: "/for-shops",
    dropdown: [
      { label: "Partner Program", to: "/for-shops" },
      { label: "Shop Software", to: "/for-shops#features" },
      { label: "Apply Now", to: "/for-shops#apply" },
    ],
  },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

function DesktopDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<NodeJS.Timeout>();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const onEnter = () => {
    clearTimeout(timeout.current);
    setOpen(true);
  };
  const onLeave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link
        to={item.to}
        className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-accent ${
          location.pathname === item.to ? "text-accent" : "text-primary-foreground/80"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Link>
      {open && item.dropdown && (
        <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
          <ul className="py-1.5">
            {item.dropdown.map((sub) => (
              <li key={sub.to}>
                <Link
                  to={sub.to}
                  className="block px-4 py-2.5 text-sm text-card-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();
  const { vehicles } = useGarage();

  useEffect(() => {
    setOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      {/* Trust bar */}
      <div className="hidden border-b border-primary-foreground/10 bg-primary/90 lg:block">
        <div className="container-wrenchli flex h-8 items-center justify-center gap-6 text-xs text-primary-foreground/60">
          <span>Free diagnosis</span>
          <span className="text-primary-foreground/20">•</span>
          <span>DIY tutorials</span>
          <span className="text-primary-foreground/20">•</span>
          <span>Shop quotes</span>
          <span className="text-primary-foreground/20">•</span>
          <span>No account required</span>
        </div>
      </div>
      <div className="container-wrenchli flex h-16 items-center justify-between md:h-[68px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold">
          <img src={wrenchliLogo} alt="Wrenchli logo" className="h-8 w-8 object-contain" />
          Wrenchli
        </Link>

        {/* Desktop nav - center */}
        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) =>
            item.dropdown ? (
              <DesktopDropdown key={item.to} item={item} />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === item.to ? "text-accent" : "text-primary-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop CTAs - right */}
        <div className="hidden items-center gap-3 lg:flex">
          <GarageDropdown />
          <Button asChild variant="outline" size="sm" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <Link to="/for-shops#apply">Partner With Us</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <Link to="/#quote">Get a Quote</Link>
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
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-primary px-6 pt-4 lg:hidden overflow-y-auto pb-24">
          {navItems.map((item) => (
            <div key={item.to} className="border-b border-primary-foreground/10">
              {item.dropdown ? (
                <>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                    className="flex w-full items-center justify-between py-4 text-lg font-medium text-primary-foreground/80"
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} />
                  </button>
                  {mobileExpanded === item.label && (
                    <div className="pb-3 pl-4 space-y-1">
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setOpen(false)}
                          className="block py-2.5 text-base text-primary-foreground/60 hover:text-accent"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`block py-4 text-lg font-medium ${
                    location.pathname === item.to ? "text-accent" : "text-primary-foreground/80"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          {/* My Garage in mobile menu */}
          <div className="border-b border-primary-foreground/10">
            <Link
              to="/garage"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 py-4 text-lg font-medium text-primary-foreground/80"
            >
              <Car className="h-5 w-5" />
              My Garage
              {vehicles.length > 0 && (
                <span className="text-sm text-primary-foreground/50">
                  ({vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} saved)
                </span>
              )}
              {vehicles.length > 0 && <GarageBadge />}
            </Link>
          </div>

          {/* Trust items */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/50">
            <span>✓ Free diagnosis</span>
            <span>✓ DIY tutorials</span>
            <span>✓ Shop quotes</span>
            <span>✓ No account required</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button asChild variant="outline" className="h-12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground text-base" onClick={() => setOpen(false)}>
              <Link to="/for-shops#apply">Partner With Us</Link>
            </Button>
            <Button asChild className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base" onClick={() => setOpen(false)}>
              <Link to="/#quote">Get a Quote</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
