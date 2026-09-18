import { Link } from "react-router-dom";
import { BadgeCheck, Star, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * DEMO ONLY — clearly watermarked sample technician profile.
 *
 * "Dana R." is not a real person. Every stat on this card is illustrative.
 * This route (/shops/demo-tech-profile) is NOT linked from the directory
 * index; it exists to demo the technician-profile vision in the pitch.
 */
export default function SampleTechProfile() {
  return (
    <div className="relative">
      {/* Unmissable watermark banner */}
      <div
        className="bg-destructive text-destructive-foreground text-center font-heading font-extrabold tracking-widest py-3 px-4 text-sm md:text-base"
        role="note"
        aria-label="Sample profile — not a real person"
      >
        SAMPLE PROFILE — ILLUSTRATIVE ONLY, NOT A REAL PERSON
      </div>

      <div className="container-wrenchli max-w-2xl py-8 relative">
        {/* Diagonal watermark overlay */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span className="rotate-[-18deg] text-[64px] md:text-[96px] font-heading font-extrabold text-destructive/15 tracking-widest whitespace-nowrap">
            SAMPLE
          </span>
        </div>

        <Link
          to="/shops"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Detroit shops
        </Link>

        <Card className="relative border-2 border-dashed border-destructive/50">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-5">
              <div
                className="h-20 w-20 rounded-full bg-wrenchli-trust-blue/10 flex items-center justify-center font-heading font-extrabold text-2xl text-wrenchli-trust-blue flex-shrink-0"
                aria-hidden
              >
                DR
              </div>
              <div>
                <p className="font-heading text-2xl font-bold">Dana R.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Master technician · 14 yrs experience · Brakes &amp; steering
                  specialist
                </p>
              </div>
            </div>

            {/* Illustrative Wrenchli-tracked rating */}
            <div className="mt-6 rounded-xl bg-wrenchli-green/10 border border-wrenchli-green/20 px-4 py-3 flex items-center gap-3">
              <Star className="h-6 w-6 fill-accent text-accent flex-shrink-0" />
              <div>
                <p className="font-heading text-xl font-extrabold">
                  4.9{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    across 212 Wrenchli-tracked jobs
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Illustrative example — real ratings come only from
                  Wrenchli-verified completed jobs.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {["ASE Master (A1–A8)", "A5 Brakes — Advanced", "A4 Steering & Suspension"].map(
                  (c) => (
                    <Badge key={c} variant="outline">
                      <BadgeCheck className="h-3.5 w-3.5 mr-1 text-wrenchli-trust-blue" />
                      {c}
                    </Badge>
                  )
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              MI cert #SAMPLE-0000 · illustrative — real profiles show the
              state certification number
            </p>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              "Nobody rates the person who touches your car. Wrenchli will."
              When shops claim their listing, they add each technician's photo,
              credentials, and specialties. Ratings are earned one
              verified completed job at a time — they can't be bought,
              scraped, or invented.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Demo mockup for the Wrenchli buildathon pitch. No real technician
          data exists yet.
        </p>
      </div>
    </div>
  );
}
