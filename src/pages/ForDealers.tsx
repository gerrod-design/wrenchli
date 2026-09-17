import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { ArrowRight, PauseCircle } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";

// NOTE (2026-09-17): The dealer/shop track is paused. Previous version
// advertised a Tekmetric integration and a 90-day dealer pilot — neither
// exists. This page now states the pause honestly.
export default function ForDealers() {
  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Wrenchli for Auto Dealers — Program Paused"
        description="Wrenchli's dealer program is currently paused while we focus on the free consumer symptom assessment."
        path="/for-dealers"
      />

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <PauseCircle className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Our dealer program is on pause
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              We're currently focused on making the free consumer symptom
              assessment the best it can be. We're not onboarding dealer
              partners or offering service-department integrations right now.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 px-10 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg"
            >
              <Link to="/">
                Try the Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
