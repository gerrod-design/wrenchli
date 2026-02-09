import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import StatCounter from "@/components/StatCounter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, AlertTriangle, Target } from "lucide-react";

export default function Investors() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Investors — Wrenchli"
        description="Wrenchli is fixing the $288B auto repair industry. Learn about our market opportunity, traction, and vision."
        path="/investors"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold md:text-5xl lg:text-6xl">
              Fixing a $288B Broken Industry
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Auto repair is one of the largest consumer markets in America — and one of the least trusted. Wrenchli is changing that.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Market Stats */}
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

      {/* The Problem */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-accent" />
              <h2 className="font-heading text-2xl font-bold md:text-4xl">The Problem</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Car owners face a broken experience every time something goes wrong with their vehicle. They don't know what's wrong, they don't know what it should cost, and they don't know who to trust.
              </p>
              <p>
                Independent repair shops — which make up 70%+ of the market — struggle with customer acquisition, payment collection, and competing against dealership service departments with larger marketing budgets.
              </p>
              <p>
                The result: consumers overpay, shops underperform, and trust erodes on both sides.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Our Solution */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-wrenchli-teal" />
              <h2 className="font-heading text-2xl font-bold md:text-4xl">Our Solution</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Wrenchli integrates three pillars into one platform: a <span className="font-semibold text-foreground">consumer marketplace</span> for transparent price comparison, <span className="font-semibold text-foreground">shop management SaaS</span> ($299/mo) for modern operations, and <span className="font-semibold text-foreground">embedded financing</span> that increases repair approval rates.
              </p>
              <p>
                We make money when shops make money — aligning incentives across the entire ecosystem.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Traction */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-accent" />
              <h2 className="font-heading text-2xl font-bold md:text-4xl">Early Traction</h2>
            </div>
          </SectionReveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { stat: "500+", label: "Survey Respondents" },
              { stat: "78%", label: "Strong Consumer Interest" },
              { stat: "30+", label: "Warm Shop Relationships in Detroit" },
            ].map((item, i) => (
              <SectionReveal key={item.label} delay={i * 120}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
                  <div className="font-stats text-3xl font-bold text-accent md:text-4xl">{item.stat}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Real data from our pre-launch research. Launching in Detroit.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold md:text-5xl">Interested in Wrenchli?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70">
              We'd love to share more about our vision, market opportunity, and roadmap.
            </p>
            <Button asChild size="lg" className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg">
              <Link to="/contact">
                Get in Touch <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
