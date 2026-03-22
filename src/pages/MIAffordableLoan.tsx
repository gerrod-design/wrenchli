import { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function MIAffordableLoan() {
  useEffect(() => {
    trackEvent({ event_type: "page_view", category: "finance_option", action: "mi_loan_landing_page_viewed" });
  }, []);

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Michigan Affordable Loan: Up to $1,200 for Car Repairs (2026)"
        description="Michigan residents can access state-backed affordable loans up to $1,200 for car repairs. 12 months, 36% APR max. No traditional credit check. Apply through Wrenchli."
        path="/mi-affordable-loan"
      />

      {/* Hero */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-4xl text-center">
          <SectionReveal>
            <span className="text-5xl mb-4 block">🏛️</span>
            <h1 className="font-heading text-3xl font-bold md:text-5xl">
              Michigan Affordable Loan: Get Up to $1,200 for Car Repairs
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              State-backed program • 12 months • 36% APR max • No traditional credit check
            </p>
            <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild>
              <Link to="/mi-loan-eligibility">
                Check If You Qualify <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* What is it */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">What is the MI Affordable Loan Program?</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The Michigan Affordable Loan program is a state-funded initiative designed to help
              residents access small loans for unexpected expenses like car repairs. Unlike payday
              loans with 400%+ APR, MI Affordable Loans have a maximum 36% APR — making them a
              significantly more affordable option.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Loan details card */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <Card className="border-accent/30">
              <CardContent className="p-8">
                <h2 className="font-heading text-2xl font-bold mb-6">Loan Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Maximum Amount", "$1,200"],
                    ["Term", "12 months"],
                    ["APR", "Up to 36%"],
                    ["Credit Check", "No traditional credit score"],
                    ["Eligibility", "Michigan residents only"],
                    ["Prepayment Penalty", "None"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground text-sm">{label}</span>
                      <span className="font-semibold text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </SectionReveal>
        </div>
      </section>

      {/* Who qualifies */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">Who Qualifies?</h2>
            <ul className="mt-6 space-y-3">
              {[
                "Michigan resident (ZIP codes starting with 48xxx or 49xxx)",
                "Need car repair (partial financing available for repairs over $1,200)",
                "Stable source of income (employment, benefits, etc.)",
                "18 years or older",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </section>

      {/* How to apply */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl">How to Apply Through Wrenchli</h2>
            <ol className="mt-6 space-y-4">
              {[
                "Get your free AI diagnosis",
                "View repair cost estimate",
                "Check if you qualify (2-minute form)",
                "Complete application (5 minutes)",
                "Get instant or 24-hour decision",
                "Book repair with approved funds",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </SectionReveal>
        </div>
      </section>

      {/* Comparison table */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">Why This is Better Than Alternatives</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-3 text-left font-semibold">Option</th>
                    <th className="px-4 py-3 text-left font-semibold">APR</th>
                    <th className="px-4 py-3 text-left font-semibold">Credit Check</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-accent/10 font-semibold">
                    <td className="px-4 py-3">🏛️ MI Affordable Loan</td>
                    <td className="px-4 py-3">36% max</td>
                    <td className="px-4 py-3">No traditional score</td>
                  </tr>
                  {[
                    ["Payday Loan", "400%+", "Minimal"],
                    ["Credit Card Cash Advance", "25–30%", "Yes"],
                    ["Personal Loan", "10–36%", "Yes (hard pull)"],
                  ].map(([name, apr, credit]) => (
                    <tr key={name} className="border-t border-border">
                      <td className="px-4 py-3 text-muted-foreground">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{apr}</td>
                      <td className="px-4 py-3 text-muted-foreground">{credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "When do I start making payments?", a: "Your first payment is due 30 days after the loan is approved." },
                { q: "Can I pay off early?", a: "Yes, there are no prepayment penalties." },
                { q: "What if I'm denied?", a: "We'll show you alternative financing options like Affirm or credit union loans." },
                { q: "Is this a government loan?", a: "The program is funded by the State of Michigan but administered by approved credit unions and lenders." },
                { q: "Can I use this if my repair costs more than $1,200?", a: "Yes! The loan covers up to $1,200 and you pay the remaining balance at the shop. For example, a $1,500 repair = $1,200 loan + $300 at the shop." },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h3 className="font-semibold text-foreground">{q}</h3>
                  <p className="mt-1 text-muted-foreground text-sm">{a}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70">
              Check if you qualify in under 2 minutes
            </p>
            <Button size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 font-bold" asChild>
              <Link to="/mi-loan-eligibility">
                Check Eligibility Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
