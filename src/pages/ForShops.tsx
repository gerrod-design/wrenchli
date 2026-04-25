import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import heroShops from "@/assets/hero-shops.jpg";
import {
  ArrowRight, Users, ClipboardCheck, TrendingUp, Plug, CheckCircle, MessageSquare,
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const valueCards = [
  {
    icon: Users,
    title: "Pre-Qualified Leads",
    desc: "Customers arrive with a structured assessment, vehicle details, and cost expectations. They're not shopping — they're booking.",
  },
  {
    icon: ClipboardCheck,
    title: "Zero Intake Friction",
    desc: "The repair likelihood report is the intake form. VIN, symptoms, confidence scores — all captured before they walk in.",
  },
  {
    icon: TrendingUp,
    title: "Higher Approval Rates",
    desc: "Customers who understand the repair approve bigger jobs. They walk in ready to book, not negotiate.",
  },
];

const integrations = ["Tekmetric", "AutoLeap", "Mitchell 1"];

export default function ForShops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Pilot Program for Independent Repair Shops | Wrenchli"
        description="Join Wrenchli's free 90-day pilot. Your customers arrive pre-assessed — vehicle details, likely causes, and fair cost range before they walk in. No fees, no commission."
        path="/for-shops"
      />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <img src={heroShops} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/60" />
        <div className="container-wrenchli text-center relative">
          <SectionReveal>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Every customer arrives already knowing what's wrong.
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Your customers come pre-assessed, cost-educated, and ready to approve the work. No more 20-minute intake calls. No more sticker shock at the counter.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]"
            >
              <Link to="/for-shops/onboarding">
                Join the Free Pilot <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:text-base font-semibold text-primary-foreground/90">
              {["Free 90-day pilot", "No fees, no commission", "No auto-billing after pilot"].map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  {point}
                </li>
              ))}
            </ul>

            {/* Founding partners — quick proof near CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="text-primary-foreground/70 font-medium">Founding partners:</span>
              {[
                { name: "Curt's Service", location: "Oak Park, MI" },
                { name: "McInerney Auto Center", location: "Troy, MI" },
              ].map((shop) => (
                <span
                  key={shop.name}
                  className="inline-flex items-center gap-2 rounded-full border bg-accent/15 border-accent/40 px-3 py-1 text-primary-foreground"
                >
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent text-[10px] uppercase tracking-wide px-1.5 py-0">
                    Founding Partner
                  </Badge>
                  <span className="font-semibold">{shop.name}</span>
                  <span className="text-primary-foreground/70">· {shop.location}</span>
                </span>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Value Cards */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">
              Why shops choose Wrenchli
            </h2>
          </SectionReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {valueCards.map((v, i) => (
              <SectionReveal key={v.title} delay={i * 100}>
                <Card className="h-full border border-border hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col items-center text-center p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                      <v.icon className="h-7 w-7 text-wrenchli-trust-blue" />
                    </div>
                    <h3 className="mb-2 font-heading text-lg font-semibold">{v.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — step-by-step flow */}
      <section id="how-it-works" className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-12">
              What happens when a customer chooses your shop
            </h2>
          </SectionReveal>

          <div className="space-y-8">
            {[
              {
                num: 1,
                title: "Customer describes their symptoms",
                body: "A vehicle owner in Metro Detroit describes their car problem on Wrenchli. They enter their vehicle details and symptoms in plain English.",
              },
              {
                num: 2,
                title: "Your shop appears in their results",
                body: "If your shop is in our partner network and near their location, your shop appears in their assessment results with your Verified Score.",
              },
              {
                num: 3,
                title: "You receive an alert",
                body: "You get a notification — via dashboard, email, or directly in Tekmetric, AutoLeap, or Mitchell 1 — with the customer's vehicle details, symptoms, top 3 likely causes, and a fair cost range.",
              },
              {
                num: 4,
                title: "The customer arrives prepared",
                body: "The customer walks in knowing what to ask. No 20-minute intake conversation. No sticker shock. You can focus on the repair.",
              },
              {
                num: 5,
                title: "Confirm the outcome",
                body: "After the repair, confirm what you found in your dashboard. This updates your Verified Score and increases how often Wrenchli recommends your shop to new customers.",
              },
            ].map((step, i) => (
              <SectionReveal key={step.num} delay={i * 80}>
                <div className="flex gap-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold text-accent-foreground"
                    style={{ backgroundColor: "#E07B39" }}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                    {step.num === 3 && (
                      <Card className="mt-4 border-2 border-wrenchli-trust-blue/30 bg-background shadow-sm max-w-md">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                              <MessageSquare className="h-3.5 w-3.5 text-wrenchli-trust-blue" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">Wrenchli Alert</p>
                              <p className="text-[10px] text-muted-foreground">New customer match · just now</p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground">
                            <span className="font-semibold">2019 Ford F-150, 5.0L.</span> Customer reports grinding noise when braking. Top cause: <span className="font-semibold">Worn front brake pads (68%)</span>. Estimated repair: <span className="font-semibold">$180–$260</span>. Customer is <span className="font-semibold">3.2 miles away</span>.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Not Another Platform */}
      <section className="section-padding bg-background border-t border-border">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              We do one thing. We do it well.
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg">
              Wrenchli doesn't replace your shop management software, your invoicing, or your scheduling — and we don't charge $300 a month to try. We do one thing: make sure your next customer walks in already knowing what's wrong, what it costs, and ready to say yes. The 90-day pilot is free, with no fees, no commission, and no strings.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Founding Partners — social proof */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-10">
              Founding partner shops in Metro Detroit
            </h2>
          </SectionReveal>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: "Curt's Service", location: "Oak Park, MI", note: "Founding pilot partner — Tekmetric user" },
              { name: "McInerney Auto Center", location: "Troy, MI (multiple locations)", note: "Founding pilot partner — Tekmetric user" },
            ].map((shop, i) => (
              <SectionReveal key={shop.name} delay={i * 100}>
                <Card className="h-full border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-3">
                    <Badge
                      className="text-xs font-semibold px-3 py-1 border"
                      style={{ backgroundColor: "rgba(224,123,57,0.1)", color: "#E07B39", borderColor: "rgba(224,123,57,0.3)" }}
                    >
                      Founding Partner
                    </Badge>
                    <h3 className="font-heading text-lg font-bold text-foreground">{shop.name}</h3>
                    <p className="text-sm text-muted-foreground">{shop.location}</p>
                    <p className="text-sm text-muted-foreground italic">{shop.note}</p>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal delay={250}>
            <p className="mt-8 text-center text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Founding partner spots are limited to the first 50 shops in Michigan and Ohio. Founding partners receive priority placement in consumer results during the pilot period.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Pilot Terms */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              The pilot is free. No strings attached.
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg">
              No setup fees. No monthly fees. No commission on repairs. The 90-day pilot is completely free. After 90 days, we discuss whether to continue — no automatic rollover, no pressure.
            </p>
            <p className="text-xs text-muted-foreground mt-6 mb-2 leading-relaxed max-w-xl mx-auto">
              Shop partners are disclosed to consumers at the time of recommendation.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/for-shops/onboarding">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* SMS Integration */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-wrenchli-trust-blue/10 px-4 py-1 text-sm font-medium text-wrenchli-trust-blue">
              <Plug className="h-4 w-4" /> Integrations
            </div>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              Built to work with your existing shop software
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg mb-8">
              Wrenchli is designed to integrate with Tekmetric, AutoLeap, and Mitchell 1 — so customer vehicle and symptom data pre-fills your repair orders before they arrive. Integration setup is completed during onboarding. CSV export is available for all other systems.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="px-5 py-2.5 text-sm font-semibold"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4 text-wrenchli-green" />
                  {name}
                </Badge>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Verified Score */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              Your Verified Score is yours to earn
            </h2>
            <div className="text-muted-foreground leading-relaxed md:text-lg text-left space-y-4">
              <p>
                Your Verified Score is calculated from three things: how often our assessment matched what you actually found (symptom-to-repair accuracy), how your pricing compares to the local market average, and ratings from customers who visited through Wrenchli.
              </p>
              <p>
                We require a minimum of 5 confirmed outcomes before displaying a score publicly. If a customer declined the recommended repair, that outcome is flagged — not counted against you. You can see your full score history and flag any outcome you believe was recorded incorrectly.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* After the Pilot */}
      <section className="section-padding bg-background border-t border-border">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              No surprises after 90 days
            </h2>
            <div className="text-muted-foreground leading-relaxed md:text-lg text-left space-y-4">
              <p>
                When your 90-day pilot ends, nothing happens automatically. We schedule a call to review your results and discuss whether continuing makes sense for your shop. There is no auto-billing, no contract renewal, and no pressure.
              </p>
              <p>
                If you decide to leave at any time: your shop listing is removed within 48 hours. No customer data collected through Wrenchli is retained under your shop profile after you leave.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Post-Pilot Pricing */}
      <section className="section-padding bg-muted/30 border-t border-border">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-6 text-center">
              What happens after 90 days
            </h2>
            <div className="space-y-5 text-muted-foreground leading-relaxed md:text-lg">
              <p>
                We schedule a call to review your results. If Wrenchli delivered value, we discuss continuing. If not, you walk away with zero obligation.
              </p>
              <div className="rounded-xl border border-border bg-card p-6 md:p-7">
                <p className="text-foreground">
                  Post-pilot pricing starts at <span className="font-bold text-accent">$299/month</span> for unlimited leads and full analytics. <span className="font-semibold text-foreground">Founding pilot partners receive a 90-day rate lock at pilot terms</span> before any pricing takes effect.
                </p>
              </div>
              <p className="text-center text-base md:text-lg pt-2">
                Questions? Call Gerrod directly:{" "}
                <a href="tel:+13133125455" className="font-bold text-accent hover:underline whitespace-nowrap">
                  313.312.5455
                </a>
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
