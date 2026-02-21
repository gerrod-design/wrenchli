import SEO from "@/components/SEO";
import WaitlistForm from "@/components/WaitlistForm";
import SectionReveal from "@/components/SectionReveal";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Wrench, Car, TrendingUp, Shield } from "lucide-react";

const benefits = [
  { icon: Wrench, title: "Free AI Diagnostics", desc: "Unlimited access to Wrenchli's AI-powered vehicle diagnosis during the pilot." },
  { icon: Car, title: "Garage & Maintenance Tracking", desc: "Save your vehicles, track maintenance history, and get proactive alerts." },
  { icon: TrendingUp, title: "Market Value Monitoring", desc: "Real-time tracking of your vehicle's value with buy/sell recommendations." },
  { icon: Shield, title: "Recall Alerts", desc: "Instant notifications when safety recalls affect your vehicle." },
];

export default function Pilot() {
  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Pilot Program"
        description="Join Wrenchli's pilot program in Detroit. Get free AI-powered vehicle diagnostics, maintenance tracking, and repair cost estimates."
        path="/pilot"
      />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container-wrenchli text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-accent/20 text-accent px-4 py-1.5 text-sm font-semibold mb-6">
            Now accepting pilot members
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Join the Wrenchli Pilot Program
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 leading-relaxed">
            Be among the first to experience AI-powered vehicle care. Free access for early members in the Detroit metro area.
          </p>
          <div className="max-w-xl mx-auto">
            <WaitlistForm source="pilot" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container-wrenchli">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold text-center mb-4">What Pilot Members Get</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Everything you need to stay ahead of vehicle issues — completely free during the pilot.
            </p>
          </SectionReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <SectionReveal key={b.title} delay={i * 100}>
                <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-start gap-3">
                    <div className="rounded-lg bg-accent/10 p-2.5">
                      <b.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold text-center mb-12">How It Works</h2>
          </SectionReveal>
          {[
            { step: "1", title: "Sign up above", desc: "Enter your name and email to reserve your spot." },
            { step: "2", title: "Get early access", desc: "We'll send you an invite when your spot opens up." },
            { step: "3", title: "Start diagnosing", desc: "Enter your vehicle info and describe any symptoms — Wrenchli handles the rest." },
          ].map((item, i) => (
            <SectionReveal key={item.step} delay={i * 120}>
              <div className="flex gap-5 items-start mb-8">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container-wrenchli text-center max-w-2xl mx-auto">
          <SectionReveal>
            <CheckCircle className="h-12 w-12 text-accent mx-auto mb-5" />
            <h2 className="font-heading text-3xl font-bold mb-4">Spots Are Limited</h2>
            <p className="text-muted-foreground mb-8">
              We're rolling out in waves across Detroit. Join now to secure your place.
            </p>
            <div className="max-w-xl mx-auto">
              <WaitlistForm source="pilot-bottom" />
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
