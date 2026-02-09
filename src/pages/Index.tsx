import { Link } from "react-router-dom";
import { Search, ShieldCheck, DollarSign, Store, Wrench, Car, CreditCard, BarChart3, Users, Clock } from "lucide-react";
import StatCounter from "@/components/StatCounter";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const howItWorks = [
  { icon: Search, title: "Describe Your Repair", desc: "Tell us what's wrong or enter a diagnostic code. No mechanic-speak required." },
  { icon: BarChart3, title: "Compare Quotes", desc: "Get instant, transparent quotes from vetted local shops. See real prices side-by-side." },
  { icon: ShieldCheck, title: "Book & Save", desc: "Choose your shop, book online, and pay with confidence — financing available if you need it." },
];

const pillars = [
  {
    icon: Car,
    title: "Consumer Marketplace",
    desc: "Instant price comparison, verified reviews, and transparent booking. Never overpay for car repairs again.",
    color: "text-wrenchli-green",
    bg: "bg-wrenchli-green/10",
    to: "/for-car-owners",
  },
  {
    icon: Store,
    title: "Shop Management SaaS",
    desc: "Modern tools for independent shops — scheduling, digital inspections, payments, and customer management.",
    color: "text-wrenchli-trust-blue",
    bg: "bg-wrenchli-trust-blue/10",
    to: "/for-shops",
  },
  {
    icon: CreditCard,
    title: "Embedded Financing",
    desc: "Point-of-sale financing so car owners can get repairs done today and pay over time. Multi-lender waterfall.",
    color: "text-accent",
    bg: "bg-accent/10",
    to: "/for-car-owners",
  },
];

const whyWrenchli = [
  { icon: DollarSign, title: "Price Transparency", desc: "Prices for the same repair can vary by 300%. We show you exactly what each shop charges." },
  { icon: ShieldCheck, title: "Vetted Shops Only", desc: "Every shop on Wrenchli is licensed, reviewed, and held to quality standards." },
  { icon: Users, title: "Built for Detroit", desc: "We're starting in our hometown and expanding from there. Local roots, national ambition." },
  { icon: Clock, title: "Save Time & Money", desc: "No more calling around for quotes. Compare prices, read reviews, and book — all in one place." },
];

export default function Index() {
  return (
    <main className="pb-[60px] md:pb-0">
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground">
        <div className="container-wrenchli flex min-h-[75vh] flex-col items-center justify-center py-16 text-center md:min-h-[80vh] md:py-24">
          <h1 className="animate-fade-in max-w-3xl font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            Car repair shouldn't feel like a{" "}
            <span className="text-accent">gamble.</span>
          </h1>
          <p
            className="animate-fade-in-up mt-6 max-w-2xl text-base text-primary-foreground/70 md:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            Wrenchli connects car owners with vetted local shops through instant price comparison, transparent reviews, and built-in financing. Launching in Detroit.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "400ms" }}
          >
            <Link
              to="/#waitlist"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-8 font-semibold text-accent-foreground transition-transform hover:scale-[1.02] hover:bg-accent/90"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              Join the Waitlist
            </Link>
            <Link
              to="/for-shops"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-foreground/20 px-8 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              I'm a Shop Owner
            </Link>
          </div>

          {/* Stats */}
          <div
            className="animate-fade-in-up mt-14 grid w-full max-w-2xl grid-cols-3 gap-6"
            style={{ animationDelay: "600ms" }}
          >
            <StatCounter end={288} prefix="$" suffix="B" label="U.S. auto repair industry" />
            <StatCounter end={300} suffix="%" label="Price variance on same repair" />
            <StatCounter end={2} suffix=" in 3" label="Don't trust their mechanic" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-4xl">
              How Wrenchli Works
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">Three simple steps to fair, transparent auto repair.</p>
          </SectionReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <SectionReveal key={step.title} delay={i * 150}>
                <div className="group flex flex-col items-center rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <step.icon className="h-7 w-7 text-accent" />
                  </div>
                  <div className="mb-1 font-stats text-3xl font-bold text-accent">{i + 1}</div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-4xl">
              One Platform, Three Pillars
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Marketplace + SaaS + Financing — the only integrated solution in auto repair.
            </p>
          </SectionReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pillars.map((p, i) => (
              <SectionReveal key={p.title} delay={i * 150}>
                <Link
                  to={p.to}
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${p.bg}`}>
                    <p.icon className={`h-7 w-7 ${p.color}`} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Wrenchli */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold text-foreground md:text-4xl">
              Why Wrenchli?
            </h2>
          </SectionReveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyWrenchli.map((item, i) => (
              <SectionReveal key={item.title} delay={i * 100}>
                <div className="flex flex-col items-start rounded-xl p-6">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mb-1 font-heading text-base font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Be First in Line
            </h2>
            <p className="mt-3 text-primary-foreground/70 md:text-lg">
              We're launching in Detroit soon. Join the waitlist and get early access.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <WaitlistForm source="home-cta" />
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
