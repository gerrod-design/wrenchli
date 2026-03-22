import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import {
  Users,
  DollarSign,
  Shield,
  Star,
  Wrench,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SectionReveal from "@/components/SectionReveal";
import StatCounter from "@/components/StatCounter";
import WaitlistForm from "@/components/WaitlistForm";

const valueProps = [
  {
    icon: Users,
    title: "Pre-Qualified Leads",
    desc: "Every customer already knows their diagnosis and expected cost. No tire-kickers.",
  },
  {
    icon: DollarSign,
    title: "No Upfront Fees",
    desc: "Zero cost to join. You only pay when you earn — $25 per booked appointment or 5% of completed jobs, whichever is lower.",
  },
  {
    icon: Shield,
    title: "Free Digital Tools",
    desc: "Online booking, digital invoicing, and customer management — all included.",
  },
  {
    icon: Star,
    title: "Build Your Reputation",
    desc: "Verified reviews, trust badges, and featured placement for top-rated shops.",
  },
];

const steps = [
  { num: "1", title: "Apply to Join", desc: "Fill out a quick form. We verify your shop and credentials." },
  { num: "2", title: "Set Up Your Profile", desc: "Add services, pricing, photos, and availability." },
  { num: "3", title: "Receive Leads", desc: "Pre-qualified customers in your area request quotes." },
  { num: "4", title: "Win the Job", desc: "Compete on price, reviews, and availability — not ad spend." },
  { num: "5", title: "Get Paid", desc: "We handle financing for customers who need it. You get paid in full." },
];

const testimonials = [
  {
    quote: "Wrenchli sends us customers who already know what they need. Our close rate went from 40% to 78%.",
    name: "Marcus T.",
    shop: "Detroit Auto Works",
    rating: 5,
  },
  {
    quote: "No more chasing leads or paying for ads that don't convert. This is how shop marketing should work.",
    name: "Sarah K.",
    shop: "Precision Auto Care, Ann Arbor",
    rating: 5,
  },
  {
    quote: "The financing option means customers say yes to bigger repairs. Our average ticket went up 35%.",
    name: "James R.",
    shop: "J&R Automotive, Toledo",
    rating: 5,
  },
];

export default function Shops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Repair Shops — Wrenchli"
        description="Grow your auto repair shop with pre-qualified leads, free digital tools, and no upfront fees. Join the Wrenchli network today."
        path="/shops"
      />

      {/* Hero */}
      <section className="bg-wrenchli-trust-blue text-accent-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">
              Grow Your Shop with Wrenchli
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-accent-foreground/80 leading-relaxed md:text-xl">
              Pre-qualified leads. Free tools. No upfront fees. Join 300+
              shops already winning with Wrenchli.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/for-shops">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-wrenchli-trust-blue text-accent-foreground py-16 md:py-20">
        <div className="container-wrenchli">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatCounter end={300} suffix="+" label="Partner Shops" />
            <StatCounter end={78} suffix="%" label="Lead Close Rate" />
            <StatCounter end={35} suffix="%" label="Avg Ticket Increase" />
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-center md:text-4xl mb-10">
              Why Shops Choose Wrenchli
            </h2>
          </SectionReveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 100}>
                <Card className="h-full border border-border hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                      <v.icon className="h-7 w-7 text-wrenchli-trust-blue" />
                    </div>
                    <h3 className="mb-2 font-heading text-lg font-semibold">
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {v.desc}
                    </p>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground mb-8">
              You only pay when you earn. No subscriptions. No hidden fees.
            </p>
          </SectionReveal>
          <SectionReveal delay={100}>
            <Card className="border-2 border-wrenchli-trust-blue shadow-lg">
              <CardContent className="p-8 md:p-10">
                <div className="font-heading text-3xl font-bold text-wrenchli-trust-blue md:text-4xl">
                  $25 per booked appointment
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                  OR 5% of completed jobs —{" "}
                  <span className="font-semibold text-foreground">
                    whichever is lower
                  </span>
                </p>
                <div className="mt-6 grid gap-3 text-left max-w-md mx-auto">
                  {[
                    "No monthly fees",
                    "No setup costs",
                    "No long-term contracts",
                    "Cancel anytime",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-wrenchli-green flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-center md:text-4xl mb-10">
              How It Works
            </h2>
          </SectionReveal>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <SectionReveal key={step.num} delay={i * 80}>
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-wrenchli-trust-blue text-accent-foreground font-bold">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold text-center md:text-4xl mb-10">
              What Shop Owners Say
            </h2>
          </SectionReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <SectionReveal key={t.name} delay={i * 120}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                      "{t.quote}"
                    </p>
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.shop}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <Wrench className="h-12 w-12 mx-auto mb-4 text-accent" />
            <h2 className="font-heading text-3xl font-bold md:text-5xl">
              Ready to Grow Your Shop?
            </h2>
            <p className="mt-4 text-lg text-accent-foreground/70">
              Join the Wrenchli network and start receiving pre-qualified
              customers today.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/for-shops">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
