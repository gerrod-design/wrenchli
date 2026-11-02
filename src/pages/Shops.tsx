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
import WaitlistForm from "@/components/WaitlistForm";

const valueProps = [
  {
    icon: Users,
    title: "Pre-Qualified Leads",
    desc: "Every customer already knows their assessment and expected cost. No tire-kickers.",
  },
  {
    icon: DollarSign,
    title: "No Upfront Fees",
    desc: "Zero cost to join. The 90-day referral pilot is free — no monthly fees and no setup costs during the pilot.",
  },
  {
    icon: Shield,
    title: "Stage 1 Packages",
    desc: "Each referral arrives as a Stage 1 package: the vehicle and the concern, with the owner's pre-assessment — never the owner's name or contact details.",
  },
  {
    icon: Star,
    title: "Report Outcomes",
    desc: "After each referred repair, send back a short outcome report. Completed work builds your record in the program.",
  },
];

const steps = [
  {
    num: "1",
    title: "Join the Pilot",
    desc: "Independent shops can join Wrenchli's free 90-day referral pilot now, and the steps below describe how it works.",
  },
  { num: "2", title: "Tell Us About Your Shop", desc: "Share your services, the makes you work on, and the jobs you want." },
  { num: "3", title: "Receive Stage 1 Packages", desc: "Each referral arrives as a Stage 1 package: the vehicle and the concern, with the owner's pre-assessment — never the owner's contact details." },
  { num: "4", title: "Accept and Report", desc: "Accept the jobs you want — the owner then contacts you directly. After the repair, send back a short outcome report." },
  { num: "5", title: "Get Paid", desc: "Financing isn't available yet — it's coming soon." },
];


export default function Shops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="For Repair Shops — Wrenchli"
        description="Wrenchli runs a free 90-day referral pilot for independent repair shops — pre-assessed customers, no upfront fees, no exclusivity."
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
              Pre-qualified leads. A free 90-day pilot. No upfront fees.
            </p>
            <p className="mt-8 mx-auto max-w-2xl rounded-xl border border-accent/40 bg-accent/10 px-6 py-4 text-lg font-semibold leading-relaxed">
              Now onboarding — our free 90-day referral pilot for independent
              shops is open nationally. Join the pilot.
            </p>
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
              Free 90-Day Pilot
            </h2>
            <p className="text-muted-foreground mb-8">
              The referral pilot is free for 90 days. No hidden fees.
            </p>
          </SectionReveal>
          <SectionReveal delay={100}>
            <Card className="border-2 border-wrenchli-trust-blue shadow-lg">
              <CardContent className="p-8 md:p-10">
                <div className="font-heading text-3xl font-bold text-wrenchli-trust-blue md:text-4xl">
                  $0 for 90 days
                </div>
                <p className="mt-2 text-lg text-muted-foreground">
                  Founding shops get their post-pilot terms{" "}
                  <span className="font-semibold text-foreground">
                    in writing before anything is charged
                  </span>
                </p>
                <div className="mt-6 grid gap-3 text-left max-w-md mx-auto">
                  {[
                    "No monthly fees during the pilot",
                    "No setup costs during the pilot",
                    "No long-term contracts",
                    "Nothing is automatic — continuing after the pilot is your choice",
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


      {/* CTA */}
      <section className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <Wrench className="h-12 w-12 mx-auto mb-4 text-accent" />
            <h2 className="font-heading text-3xl font-bold md:text-5xl">
              Ready to Grow Your Shop?
            </h2>
            <p className="mt-4 text-lg text-accent-foreground/70">
              Wrenchli is focused on the free driver assessment right now.
            </p>
            <p className="mt-8 mx-auto max-w-xl rounded-xl border border-accent/40 bg-accent/10 px-6 py-4 text-lg font-semibold leading-relaxed">
              Now onboarding — our free 90-day referral pilot for independent
              shops is open nationally. Join the pilot.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
