import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Car, ClipboardList, Store, ArrowRight } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Car,
    title: "Describe what's wrong",
    body: "Tell Wrenchli what your car is doing — the sound, the smell, the shake, the warning light. Plain words are fine.",
  },
  {
    icon: ClipboardList,
    title: "Get your free assessment",
    body: "Likely causes, how urgent it is, and typical cost ranges for Columbus-area repairs — in seconds.",
  },
  {
    icon: Store,
    title: "Walk in prepared",
    body: "Know what to ask and what's fair before you visit a shop. No more nodding along to a $900 estimate you don't understand.",
  },
];

export default function Columbus() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Free Vehicle Symptom Assessment in Columbus, Ohio — Wrenchli"
        description="Columbus drivers: describe your car problem and get a free symptom assessment with likely causes, urgency, and typical cost ranges."
        path="/columbus"
      />

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <span className="inline-block rounded-full bg-accent/10 text-accent px-4 py-1.5 text-sm font-semibold mb-6">
              Now launching in Columbus, Ohio
            </span>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Car trouble in Columbus? Get a free symptom assessment.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Describe what's wrong in plain English. Wrenchli gives you likely
              causes, how urgent it is, and typical cost ranges — free, in
              seconds.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/owners">
                Start your free assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              The assessment is always free. No account, no credit card.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl text-center">
              How it works
            </h2>
          </SectionReveal>
          <ol className="mt-8 space-y-6">
            {steps.map((step, i) => (
              <SectionReveal key={step.title} delay={i * 80}>
                <li className="flex gap-4 items-start">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <step.icon className="h-6 w-6 text-accent" />
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

      {/* Columbus launch note */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              We're meeting Columbus shops this October
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Wrenchli is launching in Columbus. The free assessment is live
              today for every driver — and we're meeting local independent
              shops to build our free referral pilot. If you run a shop,{" "}
              <Link
                to="/columbus-shops"
                className="text-accent underline hover:text-accent/80"
              >
                join the pilot
              </Link>
              .
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-wrenchli-trust-blue text-accent-foreground">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              Know before you go
            </h2>
            <p className="mt-4 text-lg text-accent-foreground/80">
              A surprise repair is a financial shock for too many drivers. Get
              the facts first — free.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/owners">
                Start your free assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
