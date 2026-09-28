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
import ShopNominationForm from "@/components/shops/ShopNominationForm";
import ShopInterestForm from "@/components/shops/ShopInterestForm";

const valueProps = [
  {
    icon: Users,
    title: "Pre-Qualified Leads",
    desc: "Every customer already knows their assessment and expected cost. No tire-kickers.",
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
  {
    num: "1",
    title: "Program Paused",
    desc: "Wrenchli is not onboarding repair shops right now. The steps below describe how the program would work when it is open.",
  },
  { num: "2", title: "Set Up Your Profile", desc: "Add services, pricing, photos, and availability." },
  { num: "3", title: "Receive Leads", desc: "Pre-qualified customers in your area request quotes." },
  { num: "4", title: "Win the Job", desc: "Compete on price, reviews, and availability — not ad spend." },
  { num: "5", title: "Get Paid", desc: "Financing isn't available yet — it's coming soon." },
];


export default function Shops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Repair Shops — Wrenchli"
        description="Wrenchli's shop partner program is currently paused — no repair shops are being onboarded at this time. When open, the program offers pre-qualified leads, free digital tools, and no upfront fees."
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
              Pre-qualified leads. Free tools. No upfront fees.
            </p>
            <p className="mt-8 mx-auto max-w-2xl rounded-xl border border-accent/40 bg-accent/10 px-6 py-4 text-lg font-semibold leading-relaxed">
              Shop partner program currently paused — Wrenchli is not
              onboarding repair shops at this time.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#nominate">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  Nominate your shop
                </Button>
              </a>
              <a href="#shop-interest">
                <Button size="lg" variant="outline" className="border-accent/40 text-accent-foreground hover:bg-accent/10 font-semibold">
                  I'm a shop — express interest
                </Button>
              </a>
            </div>
          </SectionReveal>
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


      {/* CTA — paused program interest capture */}
      <section className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-5xl">
          <SectionReveal>
            <div className="text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-accent" />
              <h2 className="font-heading text-3xl font-bold md:text-5xl">
                Help Bring Wrenchli to Your Area
              </h2>
              <p className="mt-4 text-lg text-accent-foreground/70 max-w-2xl mx-auto">
                Wrenchli is focused on the free driver assessment right now.
                We're onboarding shops gradually — make your interest known
                and we'll reach out when we open in your area.
              </p>
              <p className="mt-6 mx-auto max-w-xl rounded-xl border border-accent/40 bg-accent/10 px-6 py-4 text-base font-semibold leading-relaxed">
                Shop partner program currently paused — Wrenchli is not
                onboarding repair shops at this time.
              </p>
            </div>
          </SectionReveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-start">
            <SectionReveal>
              <div id="nominate" className="scroll-mt-24">
                <ShopNominationForm source="for-shops" />
              </div>
            </SectionReveal>
            <SectionReveal delay={100}>
              <div id="shop-interest" className="scroll-mt-24">
                <ShopInterestForm />
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>
    </main>
  );
}
