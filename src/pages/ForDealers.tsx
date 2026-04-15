import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ArrowRight, Car, Plug, MapPin, ShieldCheck } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ForDealers() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli for Auto Dealers | Free Service Department Partner Program — Michigan & Ohio"
        description="Help your service advisors prepare for every trade-in, service visit, and CPO inspection. Pre-assessed customers, Tekmetric integration, and a free 90-day pilot for Michigan and Ohio dealerships."
        path="/for-dealers"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground section-padding">
        <div className="container-wrenchli text-center">
          <SectionReveal>
            <h1 className="mt-6 font-heading text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Your Service Department, One Step Ahead
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-primary-foreground/70 leading-relaxed md:text-xl">
              Customers who ran a Wrenchli assessment before their visit arrive knowing what's wrong — cutting intake time and increasing RO approval rates.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg transition-transform hover:scale-[1.02]"
            >
              <Link to="/for-shops/onboarding">
                Apply for the Dealer Pilot Program <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>

      {/* Trade-In Appraisal */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Car className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-4">
              Faster Trade-In Appraisals
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg text-center">
              Run a rapid symptom assessment on any trade-in vehicle before setting ACV. Enter the VIN, describe what you observe, and get a probable cause list and cost range in under 60 seconds. Document it directly in Tekmetric.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Service Department Integration */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wrenchli-trust-blue/10">
                <Plug className="h-6 w-6 text-wrenchli-trust-blue" />
              </div>
            </div>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-4">
              Service Department Integration
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg text-center">
              Wrenchli integrates directly with Tekmetric. Pre-visit assessment data drops into a new or existing RO — no double entry for your service advisors.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Multi-Location Support */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wrenchli-green/10">
                <MapPin className="h-6 w-6 text-wrenchli-green" />
              </div>
            </div>
            <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-4">
              Multi-Location Support
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg text-center">
              Managing more than one rooftop? Wrenchli supports dealer groups with consolidated reporting across locations. One account, all your stores.
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* Pilot Terms */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h2 className="font-heading text-2xl font-bold md:text-4xl mb-4">
              Free 90-day pilot. No strings attached.
            </h2>
            <p className="text-muted-foreground leading-relaxed md:text-lg">
              No fees, no commission, no auto-billing. The 90-day pilot is completely free. After 90 days, we schedule a call to review your results and discuss whether continuing makes sense for your dealership.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/for-shops/onboarding">
                Apply for the Dealer Pilot Program <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
