import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import heroShops from "@/assets/hero-shops.jpg";
import {
  ArrowRight, Users, ClipboardCheck, TrendingUp, Plug, CheckCircle,
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
    desc: "Customers who understand their repair approve bigger jobs. Built-in financing means they can afford it too.",
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
                Apply for the Free Pilot <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
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
    </main>
  );
}
