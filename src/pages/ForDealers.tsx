import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";

// Dealer service departments join the same referral pilot as independent
// shops, under the same partner standard and the same founding rate
// (founder rulings Nov 7 and Nov 9, 2026: dealerships are treated like
// any other shop; the test is conduct toward the consumer, not channel).
// There is no separate dealer program and no integration to sell: this
// page says exactly that, and states the pilot's real terms.
export default function ForDealers() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli for Dealer Service Departments — Same Pilot, Same Standard"
        description="Dealer service departments can join Wrenchli's referral pilot on the same standard and the same founding rate as independent shops: free for the first five completed repairs, then $50 per owner-confirmed repair, capped at $299 a month."
        path="/for-dealers"
      />

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Dealer service departments, on the same list as everyone else
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Wrenchli lists dealer service departments and independent repair
              shops under one partner standard, on the same terms and the same
              rate. What decides whether a shop belongs on the list is how it
              treats the customer, never what kind of business it is.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/contact">
                Talk to Us About the Pilot <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-muted/40">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">
              How a referral reaches your service department
            </h2>
            <ol className="space-y-4 text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">The owner starts with a free Wrenchli pre-assessment.</strong>{" "}
                  Before anything is sent, the owner sees the likely causes of
                  the problem and a fair cost range for the repair. Wrenchli's
                  job is that pre-assessment; the hands-on inspection and the
                  repair are yours.
                </span>
              </li>
              <li className="flex gap-3">
                <Users className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">One shop at a time.</strong>{" "}
                  The owner is sent to a single listed shop, not blasted to a
                  list. Your department receives a private link describing the
                  vehicle, the problem, and the area. The customer's name,
                  email, and phone number are shared only after you accept the
                  job.
                </span>
              </li>
              <li className="flex gap-3">
                <Clock className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">Answer within one business day.</strong>{" "}
                  Accept or decline inside the window. If the window passes,
                  the owner moves to the next shop rather than waiting in
                  silence. Declining costs nothing and carries no penalty.
                </span>
              </li>
              <li className="flex gap-3">
                <FileText className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">After the repair, file the outcome report.</strong>{" "}
                  You report what was done and what the customer was actually
                  charged. That report is how Wrenchli's published price
                  ranges stay honest, and it is a condition of staying listed.
                </span>
              </li>
            </ol>
          </SectionReveal>
        </div>
      </section>

      {/* The rate */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">
              The rate, in full
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The pilot is free for your department until it completes its
                first five referred repairs. After the free first five, the
                founding rate is <strong className="text-foreground">$50 per
                completed repair, capped at $299 per month</strong>. Founding
                partners hold that rate in writing.
              </p>
              <p>
                A repair counts as completed only when the car owner confirms
                it was done. That confirmation is the counting trigger, and a
                counted completion disputed within 30 days is removed from the
                count.
              </p>
              <p>
                The rate above is the whole fee. It is never a percentage of
                the repair bill, and it does not grow with the size of the
                job. Receiving, accepting, or declining a referral is always
                free, and there is no exclusivity: nothing here limits the
                other work your department takes.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* What we ask / what we never do */}
      <section className="section-padding bg-muted/40">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">
              What we ask of every listed shop
            </h2>
            <ul className="space-y-4 text-muted-foreground leading-relaxed list-none mb-12">
              <li className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">Stand behind the work.</strong>{" "}
                  Every listed shop declares a warranty of at least 12 months
                  or 12,000 miles on its repairs, in writing, as a condition of
                  listing.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">Hold the published range.</strong>{" "}
                  The Wrenchli range for a repair is the ceiling for the agreed
                  scope. If the scope or the price has to change, the customer
                  hears it before the additional work is done, and Wrenchli is
                  notified the same day when a change takes the price above the
                  range.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">Keep your listing current.</strong>{" "}
                  Contact information, services, and your warranty declaration
                  stay up to date with Wrenchli.
                </span>
              </li>
            </ul>
            <h2 className="font-heading text-2xl font-bold md:text-3xl mb-6">
              What we will never do
            </h2>
            <ul className="space-y-4 text-muted-foreground leading-relaxed list-none">
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">We never ask for your customer list.</strong>{" "}
                  Not at listing, not ever after. Your customers remain yours.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">We never bill you for your own customer.</strong>{" "}
                  A fee exists only when an owner confirms a referred repair
                  was completed. There is no first-touch claim on work that
                  would have come to you anyway.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-wrenchli-teal shrink-0 mt-1" />
                <span>
                  <strong className="text-foreground">We never share customer details before you accept.</strong>{" "}
                  Before acceptance, a referral describes the vehicle, the
                  problem, and the area, not the person.
                </span>
              </li>
            </ul>
          </SectionReveal>
        </div>
      </section>

      {/* Honest scope note */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wrench className="h-6 w-6 text-wrenchli-teal" />
              <h2 className="font-heading text-2xl font-bold md:text-3xl">
                Nothing to install, nothing to integrate
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              There is no Wrenchli software for your department to run and no
              integration to buy. Referrals arrive on a private link, and the
              outcome report is filed on the same link. The pilot is small and
              every partner is approved individually.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/contact">
                Talk to Us About the Pilot <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
