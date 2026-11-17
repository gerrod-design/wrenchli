import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { trackPlausibleEvent } from "@/lib/analytics";

const steps = [
  {
    title: "Customer describes their symptoms",
    body: "A driver describes their car problem on Wrenchli and gets a free symptom assessment.",
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
  "Free referrals until your shop completes its first five referred repairs. No exclusivity, no volume commitments.",
  "Answer within one business day. Accept or decline each referral inside one business day; if the window passes, the customer is offered the next shop rather than left waiting. Declining costs nothing and carries no penalty.",
  "The published range is the ceiling. For the agreed scope, your price stays within the Wrenchli range the customer saw. If the scope or the price has to change, the customer hears it before the additional work is done, and Wrenchli is notified the same day when a change takes the price above the range.",
  "A written warranty is a condition of listing. Every listed shop declares a warranty of at least 12 months or 12,000 miles on its repairs, in writing.",
  "Fees only on owner-confirmed completions. After the free first five, the founding rate is $50 per completed repair, capped at $299 a month, and a repair counts only when the car owner confirms it was done. Founding shops hold that rate in writing. The fee is never a percentage of the repair bill.",
  "We never ask for your customer list. Not at listing, not ever after. Your customers remain yours.",
  "Customer details only after you accept. Before acceptance, a referral describes the vehicle, the problem, and the area, not the person. The customer's name, email, and phone number are shared only after you accept the job.",
  "Outcome report within 7 days for each referral you accept.",
  "Either party can end participation at any time.",
];

export default function ForShops() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Referral Pilot for Independent Shops and Dealership Service Departments"
        description="Free referral pilot for independent auto repair shops and dealership service departments — free until your shop completes its first five referred repairs. Customers arrive pre-assessed with symptoms, likely causes, and a fair cost range."
        path="/for-shops"
      />

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Free Referral Pilot for Independent Shops and Dealership Service Departments
            </h1>
          </SectionReveal>
        </div>
      </section>

      {/* Customers arrive pre-assessed */}
      <section id="features" className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Customers arrive pre-assessed
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Vehicle details, symptom description, likely causes, and a fair
              cost range — before they walk in. Free for independent shops and dealership service departments
              until each shop completes its first five referred repairs.
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

      {/* After the free period */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              After your first five repairs
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Nothing happens automatically. No auto-billing, no contract
              renewal. The founding rate is $50 per completed repair,
              capped at $299 a month, and a repair counts as completed
              when the car owner confirms it. Founding shops get their
              terms in writing before anything is charged — and we
              schedule a call to review your results first.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* CTA */}
      <section id="apply" className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
              >
                <Link
                  to="/contact"
                  onClick={() =>
                    trackPlausibleEvent("shop_page_cta_click", { placement: "for_shops_pilot" })
                  }
                >
                  Join the free pilot <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 bg-transparent font-bold text-lg text-accent-foreground border-accent-foreground/50 hover:bg-white/10 hover:text-accent-foreground"
              >
                <Link
                  to="/for-shops/talk"
                  onClick={() =>
                    trackPlausibleEvent("shop_page_cta_click", { placement: "for_shops_talk" })
                  }
                >
                  Talk, type, or book a call
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm italic text-accent-foreground/80">
              Wrenchli never charges consumers. The assessment is always free.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
