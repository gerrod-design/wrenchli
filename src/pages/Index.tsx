import { useState } from "react";
import { Link } from "react-router-dom";
import heroHome from "@/assets/hero-home.jpg";
import SEO from "@/components/SEO";
import {
  Search, ShieldCheck, DollarSign, Zap, CreditCard, Clock,
  Car, Store, BarChart3, Users, Wrench, ArrowRight, CheckCircle,
  Smartphone, MessageCircle
} from "lucide-react";
import StatCounter from "@/components/StatCounter";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const valueProps = [
  { icon: ShieldCheck, title: "Transparent Pricing", desc: "See real prices upfront. No surprises, no hidden fees." },
  { icon: Zap, title: "Instant Quotes", desc: "Compare multiple shops in seconds. Book in minutes." },
  { icon: CreditCard, title: "Flexible Financing", desc: "Payment plans that fit your budget. All credit types welcome." },
];

const howItWorks = [
  { step: 1, title: "Tell Us What's Wrong", desc: "Describe your issue or enter a diagnostic code" },
  { step: 2, title: "Get Instant Quotes", desc: "Competitive quotes from verified local shops" },
  { step: 3, title: "Compare & Choose", desc: "Ratings, prices, availability side by side" },
  { step: 4, title: "Book & Pay Your Way", desc: "Schedule online, finance if needed" },
  { step: 5, title: "Get Back on the Road", desc: "Real-time status updates until pickup" },
];

export default function Index() {
  const [issueText, setIssueText] = useState("");
  const [dtcCode, setDtcCode] = useState("");
  const [selectedMake, setSelectedMake] = useState("");

  const modelsByMake: Record<string, string[]> = {
    Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Bronco", "Ranger", "Expedition", "Fusion", "Focus"],
    Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Camaro", "Tahoe", "Suburban", "Colorado", "Blazer", "Trax"],
    Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius", "Sienna", "Supra"],
    Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V", "Odyssey", "Ridgeline", "Passport", "Fit", "Insight"],
    Chrysler: ["300", "Pacifica", "Voyager"],
    Jeep: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
    GMC: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon", "Hummer EV"],
    Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Palisade", "Venue", "Ioniq 5"],
    Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul", "Seltos", "EV6"],
    Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Murano", "Kicks", "Versa"],
    BMW: ["3 Series", "5 Series", "X3", "X5", "X1", "4 Series", "7 Series", "iX"],
    Mercedes: ["C-Class", "E-Class", "GLC", "GLE", "A-Class", "S-Class", "GLA", "GLB"],
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli — Car Repair, Finally Fixed"
        description="Get instant quotes from trusted local shops. Compare prices, book with confidence, and finance if you need to. Launching in Detroit."
        path="/"
      />
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <img src={heroHome} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-wrenchli-trust-blue/60" />
        <div className="container-wrenchli relative flex min-h-[80vh] flex-col items-center justify-center py-20 text-center md:py-28">
          <h1 className="animate-fade-in max-w-4xl font-heading text-4xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl">
            Car Repair, Finally <span className="text-accent">Fixed.</span>
          </h1>
          <p
            className="animate-fade-in-up mt-6 max-w-2xl text-lg text-primary-foreground/70 md:text-xl leading-relaxed"
            style={{ animationDelay: "200ms" }}
          >
            Get instant quotes from trusted local shops. Compare prices. Book with confidence. Finance if you need to.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "400ms" }}
          >
            <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
              <Link to="/#quote">Get Your Free Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-10 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold text-lg">
              <Link to="/for-shops#apply">Join as a Partner Shop</Link>
            </Button>
          </div>
          <p
            className="animate-fade-in-up mt-4 text-sm text-primary-foreground/50"
            style={{ animationDelay: "500ms" }}
          >
            No account required • Free for car owners
          </p>
        </div>
      </section>

      {/* Quick Action Bar */}
      <section id="quote" className="relative -mt-8 z-10">
        <div className="container-wrenchli">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
              <Input
                placeholder="Describe your car issue or enter a diagnostic code..."
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                className="h-12 text-base"
              />
              <select className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Year</option>
                {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Make</option>
                {["Ford", "Chevrolet", "Toyota", "Honda", "Chrysler", "Jeep", "GMC", "Hyundai", "Kia", "Nissan", "BMW", "Mercedes", "Other"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select className="flex h-12 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Model</option>
                {(modelsByMake[selectedMake] || []).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <Button className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 whitespace-nowrap">
                Get Quotes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Cards */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <div className="grid gap-6 md:grid-cols-3">
            {valueProps.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 120}>
                <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <v.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Statistics */}
      <section className="bg-primary text-primary-foreground py-16 md:py-20">
        <div className="container-wrenchli">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatCounter end={288} prefix="$" suffix="B" label="U.S. Auto Repair Market" />
            <StatCounter end={300} suffix="%" label="Price Variation for Same Repair" />
            <StatCounter end={66} suffix="%" label="of Consumers Distrust Repair Shops" />
          </div>
          <p className="mt-8 text-center text-primary-foreground/60 md:text-lg">
            We're here to change that. Wrenchli brings trust back to auto repair.
          </p>
        </div>
      </section>

      {/* How It Works — 5 steps */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-3 text-center text-muted-foreground md:text-lg">Five simple steps from problem to solution.</p>
          </SectionReveal>

          {/* Desktop: horizontal flow */}
          <div className="mt-12 hidden md:flex items-start justify-between">
            {howItWorks.map((s, i) => (
              <SectionReveal key={s.step} delay={i * 120} className="flex flex-col items-center text-center flex-1 relative">
                <>
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-heading font-bold text-lg">
                    {s.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-border" />
                  )}
                  <h3 className="mt-4 font-heading text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[140px]">{s.desc}</p>
                </>
              </SectionReveal>
            ))}
          </div>

          {/* Mobile: vertical timeline */}
          <div className="mt-10 space-y-6 md:hidden">
            {howItWorks.map((s, i) => (
              <SectionReveal key={s.step} delay={i * 100}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-heading font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Dual-Audience Split */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli grid gap-8 md:grid-cols-2">
          <SectionReveal>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 h-full flex flex-col">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-wrenchli-green/10 px-3 py-1 text-sm font-medium text-wrenchli-green w-fit">
                <Car className="h-4 w-4" /> For Car Owners
              </div>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                Stop Overpaying. Start Trusting.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed flex-1">
                Instant quotes from vetted shops, transparent pricing, and financing for all credit profiles. Never wonder if you're getting a fair deal again.
              </p>
              <Button asChild className="mt-6 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold w-fit px-8">
                <Link to="/#quote">
                  Get Your Free Quote <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SectionReveal>
          <SectionReveal delay={150}>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-10 h-full flex flex-col">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-wrenchli-trust-blue/10 px-3 py-1 text-sm font-medium text-wrenchli-trust-blue w-fit">
                <Store className="h-4 w-4" /> For Repair Shops
              </div>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                More Customers. Higher Tickets. Less Hassle.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed flex-1">
                Pre-qualified leads, modern software ($299/mo), and embedded financing that increases average ticket size and customer approval rates.
              </p>
              <Button asChild variant="outline" className="mt-6 h-12 border-wrenchli-trust-blue text-wrenchli-trust-blue hover:bg-wrenchli-trust-blue/10 font-semibold w-fit px-8">
                <Link to="/for-shops#apply">
                  Apply to Partner <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* OBD2 Scanner Integration */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <SectionReveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-wrenchli-teal/10 px-3 py-1 text-sm font-medium text-wrenchli-teal mb-4">
                  <Smartphone className="h-4 w-4" /> OBD2 Integration
                </div>
                <h2 className="font-heading text-2xl font-bold md:text-3xl">
                  Already Diagnosed Your Issue?
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Connect your OBD2 scanner results directly to local shop quotes. Enter your diagnostic trouble code and get competitive pricing instantly.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Enter DTC code (e.g., P0420)"
                    value={dtcCode}
                    onChange={(e) => setDtcCode(e.target.value.toUpperCase())}
                    className="h-12 text-base font-mono uppercase"
                    maxLength={10}
                  />
                  <Button className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6 whitespace-nowrap">
                    Get Quotes for This Code
                  </Button>
                </div>
              </SectionReveal>
              <SectionReveal delay={200}>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {["FIXD", "BlueDriver", "Innova"].map((brand) => (
                    <div key={brand} className="rounded-lg border border-border bg-muted px-6 py-3 text-sm font-medium text-muted-foreground opacity-50">
                      {brand}
                    </div>
                  ))}
                  <p className="w-full text-center text-xs text-muted-foreground mt-2">
                    Scanner partnerships coming soon
                  </p>
                </div>
              </SectionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Placeholder */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">What People Are Saying</h2>
            <p className="mt-3 text-muted-foreground">We're building something people genuinely want.</p>
          </SectionReveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { stat: "500+", label: "Survey Respondents" },
              { stat: "78%", label: "Strong Interest from Consumers" },
              { stat: "30+", label: "Warm Shop Relationships in Detroit" },
            ].map((item, i) => (
              <SectionReveal key={item.label} delay={i * 120}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="font-stats text-3xl font-bold text-accent md:text-4xl">{item.stat}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Real data from our pre-launch research. Testimonials coming when we have real users.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold md:text-5xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70">
              Get your first quote in under 60 seconds. No account required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]">
                <Link to="/#quote">Get Your Free Quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold text-lg">
                <Link to="/for-shops#apply">Become a Partner Shop</Link>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Floating Chat Widget Placeholder */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
          title="Chat — Coming Soon"
          onClick={() => {}}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </main>
  );
}
