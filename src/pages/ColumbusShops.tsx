import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Customer describes their symptoms",
    body: "A driver in Columbus describes their car problem on Wrenchli and gets a free symptom assessment.",
  },
  {
    title: "We refer them to your shop",
    body: "Partner shops receive the referral with the vehicle details, symptom description, likely causes, and a fair cost range attached.",
  },
  {
    title: "The customer arrives prepared",
    body: 'No 20-minute intake conversation decoding "it makes a noise." Your advisor starts halfway done.',
  },
  {
    title: "You confirm the outcome",
    body: "A 2-minute report: what you found, what was done, what it cost. This is the price of admission — and it's what makes every referral smarter.",
  },
];

const terms = [
  "90 days. Free referrals. No exclusivity, no volume commitments.",
  "Outcome report within 7 days for each referral you accept.",
  "Either party can end participation at any time.",
];

export default function ColumbusShops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Referral Pilot for Independent Columbus Shops"
        description="Wrenchli is launching in Columbus, Ohio. Free 90-day referral pilot for independent auto repair shops. Customers arrive pre-assessed with symptoms, likely causes, and a fair cost range."
        path="/columbus-shops"
      />

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <span className="inline-block rounded-full bg-accent/10 text-accent px-4 py-1.5 text-sm font-semibold mb-6">
              Now launching in Columbus, Ohio
            </span>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Free Referral Pilot for Independent Columbus Shops
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Wrenchli is launching in Columbus this October. Join the free
              90-day pilot and get customers who arrive pre-assessed — symptoms,
              likely causes, and a fair cost range attached.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Customers arrive pre-assessed */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Customers arrive pre-assessed
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Vehicle details, symptom description, likely causes, and a fair
              cost range — before they walk in. Free 90-day pilot for
              independent shops.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              How it works
            </h2>
          </SectionReveal>
          <ol className="mt-8 space-y-6">
            {steps.map((step, i) => (
              <SectionReveal key={step.title} delay={i * 80}>
                <li className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-heading font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              </SectionReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Pilot terms */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Pilot terms
            </h2>
            <ul className="mt-6 space-y-3">
              {terms.map((term) => (
                <li key={term} className="flex gap-3 items-start">
                  <span
                    aria-hidden
                    className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent"
                  />
                  <p className="leading-relaxed">{term}</p>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </section>

      {/* After 90 days */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              After 90 days
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Nothing happens automatically. No auto-billing, no contract
              renewal. We schedule a call to review your results — and pilot
              shops get founding terms on paid partner tiers before public
              pricing.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <Button
              asChild
              size="lg"
              className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/contact">
                Join the free pilot <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="mt-6 text-sm italic text-accent-foreground/80">
              Wrenchli never charges consumers. The assessment is always free.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
