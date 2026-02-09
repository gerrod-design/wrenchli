import { Link } from "react-router-dom";
import { ShieldCheck, DollarSign, Star, CreditCard, Search, BarChart3, Car, CheckCircle } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";

const features = [
  { icon: Search, title: "Instant Quotes", desc: "Describe your repair and get real prices from multiple shops — no phone calls needed." },
  { icon: BarChart3, title: "Compare Side-by-Side", desc: "See transparent pricing from vetted local shops. Choose based on price, reviews, and convenience." },
  { icon: Star, title: "Verified Reviews", desc: "Real reviews from real customers. Every review is tied to a completed repair." },
  { icon: CreditCard, title: "Built-In Financing", desc: "Can't cover the full cost today? Apply for financing at checkout — approval in minutes." },
  { icon: ShieldCheck, title: "Vetted Shops", desc: "Every shop is licensed, insured, and meets Wrenchli quality standards." },
  { icon: DollarSign, title: "No Hidden Fees", desc: "The price you see is the price you pay. Wrenchli charges shops, not you." },
];

const howPricing = [
  "You describe your repair or enter a diagnostic code",
  "Shops in your area provide real-time, binding quotes",
  "You compare prices, reviews, and availability",
  "Book and pay — the quoted price is guaranteed",
];

export default function ForCarOwners() {
  return (
    <main className="pb-[60px] md:pb-0">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-wrenchli-green/20 px-4 py-1 text-sm font-medium text-wrenchli-green">
              <Car className="h-4 w-4" /> For Car Owners
            </div>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl">
              Stop overpaying for car repairs.
            </h1>
            <p className="mt-4 text-primary-foreground/70 md:text-lg max-w-2xl mx-auto">
              Wrenchli gives you transparent pricing, vetted shops, and easy booking — so you can get your car fixed with confidence.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">Everything you need</h2>
          </SectionReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <SectionReveal key={f.title} delay={i * 100}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-wrenchli-green/10">
                    <f.icon className="h-5 w-5 text-wrenchli-green" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How Pricing Works */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-2xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl">How pricing works</h2>
            <p className="mt-3 text-center text-muted-foreground">No surprises. No hidden fees. Here's our simple process.</p>
          </SectionReveal>
          <div className="mt-10 space-y-4">
            {howPricing.map((step, i) => (
              <SectionReveal key={i} delay={i * 100}>
                <div className="flex items-start gap-4 rounded-lg bg-card p-4 border border-border">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wrenchli-green text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm md:text-base">{step}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">Get notified when we launch in Detroit</h2>
            <p className="mt-3 text-primary-foreground/70">Be the first to compare prices and book trusted shops.</p>
            <div className="mx-auto mt-8 max-w-xl">
              <WaitlistForm userType="consumer" source="for-car-owners" />
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
