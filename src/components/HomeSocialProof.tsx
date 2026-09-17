import { UserX, ShieldCheck, FileText } from "lucide-react";
import SectionReveal from "@/components/SectionReveal";

// NOTE (2026-09-17): Shop-matching track is paused with zero partner shops.
// Previous version listed "founding partner" shops and a shop-database stat;
// both removed. This section now states only verifiable consumer facts.
export default function HomeSocialProof() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wrenchli max-w-5xl">
        <SectionReveal>
          <h2 className="text-center font-heading text-2xl font-bold md:text-4xl mb-3">
            Built for drivers, not upsells
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Every claim on this page is verifiable. No inflated numbers. No fake reviews.
          </p>
        </SectionReveal>

        {/* Verifiable facts */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SectionReveal delay={100}>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <UserX className="h-6 w-6 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="font-heading text-base font-semibold text-foreground">Free for every driver</p>
                <p className="text-sm text-muted-foreground">No account required to get your assessment</p>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={200}>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <FileText className="h-6 w-6 shrink-0 text-wrenchli-trust-blue mt-0.5" />
              <div>
                <p className="font-heading text-base font-semibold text-foreground">Symptom assessment</p>
                <p className="text-sm text-muted-foreground">Likely causes and urgency — never presented as a diagnosis</p>
              </div>
            </div>
          </SectionReveal>
          <SectionReveal delay={300}>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <ShieldCheck className="h-6 w-6 shrink-0 text-green-600 mt-0.5" />
              <div>
                <p className="font-heading text-base font-semibold text-foreground">Safety first</p>
                <p className="text-sm text-muted-foreground">Urgent issues are always routed to professional repair</p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
