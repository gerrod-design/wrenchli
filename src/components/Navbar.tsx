import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Car, Crown, Settings } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import wrenchliLogo from "@/assets/wrenchli-logo.jpeg";
import GarageDropdown from "@/components/garage/GarageDropdown";
import GarageBadge from "@/components/vehicle/GarageBadge";
import { useGarage } from "@/hooks/useGarage";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadRecallCount } from "@/hooks/useUnreadRecallCount";
import { useProSubscription } from "@/hooks/useProSubscription";
import RecommendShopModal from "@/components/recommend/RecommendShopModal";
import ManageSubscriptionModal from "@/components/ManageSubscriptionModal";

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
    label: "For Vehicle Owners",
    to: "/for-car-owners",
    dropdown: [
      { label: "How It Works", to: "/for-car-owners" },
      { label: "Vehicle Insights", to: "/vehicle-insights" },
      { label: "DIY Repair Guides", to: "/diy" },
      { label: "Photo Damage Diagnosis", to: "/damage-diagnosis" },
      { label: "Find Shops", to: "/find-shops" },
      { label: "Financing", to: "/financing-options" },
      { label: "🏛️ MI Affordable Loan ✨", to: "/mi-affordable-loan" },
    ],
  },
  {
    label: "For Shops",
    to: "/for-shops",
    dropdown: [
      { label: "Partner Program", to: "/for-shops" },
      { label: "How It Works", to: "/for-shops#how-it-works" },
      { label: "Shop Software", to: "/for-shops#features" },
      { label: "💬 Recommend a Shop", to: "__recommend__" },
    ],
  },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

function DesktopDropdown({ item, onRecommendClick }: { item: NavItem; onRecommendClick?: () => void }) {
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
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
          <ul className="py-1.5">
            {item.dropdown.map((sub) =>
              sub.to === "__recommend__" ? (
                <li key={sub.label}>
                  <button
                    onClick={() => { setOpen(false); onRecommendClick?.(); }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-wrenchli-teal font-medium transition-colors hover:bg-accent/10"
                  >
                    {sub.label}
                  </button>
                </li>
              ) : (
                <li key={sub.to}>
                  <Link
                    to={sub.to}
                    className="block px-4 py-2.5 text-sm text-card-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    {sub.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [manageSubOpen, setManageSubOpen] = useState(false);
  const location = useLocation();
  const { vehicles } = useGarage();
  const { user } = useAuth();
  const unreadRecalls = useUnreadRecallCount();
  const { subscription, isPro } = useProSubscription();

  useEffect(() => {
    setOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg" style={{ WebkitTransform: "translate3d(0,0,0)" }}>
      <div className="container-wrenchli flex h-16 items-center justify-between md:h-[68px]">
        {/* Logo */}
        <Link to="/" className="flex flex-col">
          <span className="flex items-center gap-2 font-heading text-xl font-bold">
            <img src={wrenchliLogo} alt="Wrenchli logo" className="h-8 w-8 object-contain" />
            Wrenchli
          </span>
          <span className="text-xs font-medium tracking-wide text-primary-foreground/60 ml-10">
            Mobility for All.
          </span>
        </Link>

        {/* Desktop nav - center */}
        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) =>
            item.dropdown ? (
              <DesktopDropdown key={item.to} item={item} onRecommendClick={() => setRecommendOpen(true)} />
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
          {user && (
            <Link
              to="/garage"
              className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-accent ${
                location.pathname === "/garage" ? "text-accent" : "text-primary-foreground/80"
              }`}
            >
              <Car className="h-4 w-4" />
              My Garage
              {unreadRecalls > 0 && (
                <span className="absolute -top-1.5 -right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadRecalls}
                </span>
              )}
            </Link>
          )}
          {user && isPro && (
            <button
              onClick={() => setManageSubOpen(true)}
              className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-accent flex items-center gap-1"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
          <NotificationBell />
          <GarageDropdown />
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <Link to="/#quote">Get a Quote</Link>
          </Button>
          <Button asChild size="sm" className="bg-wrenchli-trust-blue text-white hover:bg-wrenchli-trust-blue/90 font-semibold">
            <Link to="/for-shops#apply">For Shops</Link>
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
        <div className="fixed inset-0 top-16 z-[55] flex flex-col bg-primary px-6 pt-4 lg:hidden overflow-y-auto pb-24" style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
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
                      {item.dropdown.map((sub) =>
                        sub.to === "__recommend__" ? (
                          <button
                            key={sub.label}
                            onClick={() => { setOpen(false); setRecommendOpen(true); }}
                            className="block w-full text-left py-2.5 text-base text-wrenchli-teal font-medium hover:underline"
                          >
                            💬 Recommend a Shop
                          </button>
                        ) : (
                          <Link
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setOpen(false)}
                            className="block py-2.5 text-base text-primary-foreground/60 hover:text-accent"
                          >
                            {sub.label}
                          </Link>
                        )
                      )}
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
          {user && (
            <div className="border-b border-primary-foreground/10">
              <Link
                to="/garage"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-4 text-lg font-medium text-primary-foreground/80"
              >
                <Car className="h-5 w-5" />
                My Garage
                {unreadRecalls > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-white">
                    {unreadRecalls}
                  </span>
                )}
              </Link>
            </div>
          )}
          {user && isPro && (
            <div className="border-b border-primary-foreground/10">
              <button
                onClick={() => { setOpen(false); setManageSubOpen(true); }}
                className="flex items-center gap-2 py-4 text-lg font-medium text-primary-foreground/80 w-full text-left"
              >
                <Settings className="h-5 w-5" />
                Manage Subscription
              </button>
            </div>
          )}

          {/* Trust items */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/50">
            <span>✓ Free diagnosis</span>
            <span>✓ DIY tutorials</span>
            <span>✓ Shop quotes</span>
            <span>✓ No account required</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base" onClick={() => setOpen(false)}>
              <Link to="/#quote">Get a Quote</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground text-base" onClick={() => setOpen(false)}>
              <Link to="/for-shops#apply">For Shops</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-base" onClick={() => setOpen(false)}>
              <Link to="/investors">Investors</Link>
            </Button>
          </div>
        </div>
      )}
      <RecommendShopModal open={recommendOpen} onClose={() => setRecommendOpen(false)} />
      <ManageSubscriptionModal
        open={manageSubOpen}
        onClose={() => setManageSubOpen(false)}
        subscription={subscription}
        onUpdated={() => {}}
      />
    </nav>
  );
}
