import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import WaitlistForm from "@/components/WaitlistForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ShieldCheck, Landmark, BellRing, ArrowRight, HandCoins, FileCheck2, Wrench,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import {
  fetchPublicFinancingPartners,
  createFinancingReferral,
  partnerTermsLine,
  PARTNER_TYPE_LABELS,
  type PublicFinancingPartner,
} from "@/lib/financing";

/**
 * /financing — the public repair-financing page.
 *
 * Registry-driven: options come from list_public_financing_partners(),
 * which returns only active, non-mock partners at or below the 24% APR
 * ceiling. Until a real partner is signed and active the list is empty
 * and the page says so plainly — it never invents a partner, a rate,
 * or an availability. Mock (simulation) partners can never appear
 * here; the data layer excludes them.
 */
export default function Financing() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const [partners, setPartners] = useState<PublicFinancingPartner[] | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      category: "finance_option",
      action: "financing_page_viewed",
      value: repairCost,
    });
    let cancelled = false;
    fetchPublicFinancingPartners(Math.round(repairCost * 100))
      .then((rows) => {
        if (!cancelled) setPartners(rows);
      })
      .catch(() => {
        if (!cancelled) setPartners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [repairCost]);

  const apply = async (partner: PublicFinancingPartner) => {
    setApplyingId(partner.id);
    try {
      const referral = await createFinancingReferral({
        partnerId: partner.id,
        amountCents: Math.round(repairCost * 100),
        repairCategory: diagnosis,
      });
      window.location.href = referral.partner_url;
    } catch {
      toast({
        title: "That link didn't start",
        description:
          "We couldn't start your application link just now. Please try again in a moment.",
        variant: "destructive",
      });
      setApplyingId(null);
    }
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Repair Financing — Wrenchli"
        description="How repair financing through Wrenchli will work: a verified estimate, financing partners at or below 24% APR, and an application on the partner's own site. Wrenchli is never the lender."
        path="/financing"
      />

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">
              Pay for your repair over time
            </h1>
            <p className="mt-2 text-primary-foreground/70">
              Financing for your{" "}
              <span className="font-semibold">${repairCost.toLocaleString()}</span> repair
              {diagnosis !== "Car Repair" && <> — {diagnosis}</>}, through lenders and
              community funds that meet Wrenchli's rules.
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary-foreground/10 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm text-primary-foreground/80">
                <span className="font-semibold text-primary-foreground">
                  Wrenchli is not a lender.
                </span>{" "}
                We verify your repair estimate and connect you to a financing partner.
                The partner makes the lending decision, on the partner's own site. Our
                rule: we never show financing above 24% APR.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-5xl">
          {partners === null ? (
            <p className="text-sm text-muted-foreground">Checking financing options…</p>
          ) : partners.length === 0 ? (
            <SectionReveal>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-accent" />
                    Financing partners are being onboarded
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground md:text-base">
                  <p>
                    No financing partner is live on Wrenchli yet, so there is nothing to
                    apply for on this page today. We are onboarding credit unions,
                    community banks, and repair funds first — the partners whose terms
                    can meet the rules below.
                  </p>
                  <p>
                    When the first partner is live, this page will list them by name with
                    their exact rate and term, and your application will start from your
                    repair estimate. Join the list below and we will tell you the moment
                    that happens.
                  </p>
                </CardContent>
              </Card>
            </SectionReveal>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((partner, i) => (
                <SectionReveal key={partner.id} delay={i * 60}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{partner.name}</CardTitle>
                        <Badge variant="secondary">
                          {PARTNER_TYPE_LABELS[partner.partner_type]}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {partnerTermsLine(partner)}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        You apply on {partner.name}'s site. {partner.name} makes the
                        lending decision — Wrenchli does not.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your name and contact details are never sent by Wrenchli.{" "}
                        {partner.name} receives a referral code and your repair cost
                        range only; you enter your own details on their application.
                      </p>
                      <Button
                        className="w-full"
                        disabled={applyingId !== null}
                        onClick={() => void apply(partner)}
                      >
                        {applyingId === partner.id
                          ? "Starting your link…"
                          : `Apply on ${partner.name}'s site`}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-wrenchli max-w-5xl">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold md:text-2xl">How it works</h2>
          </SectionReveal>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <FileCheck2 className="h-6 w-6 text-accent" />,
                title: "1. Start from a verified estimate",
                body: "Financing starts from your Wrenchli repair estimate, so the amount you apply for is tied to a real repair at a documented price.",
              },
              {
                icon: <HandCoins className="h-6 w-6 text-accent" />,
                title: "2. Apply with the partner",
                body: "You choose a partner and apply on their site, under their terms. Every partner shown is at or below 24% APR, and partners can never pay to change your estimate or their position here.",
              },
              {
                icon: <Wrench className="h-6 w-6 text-accent" />,
                title: "3. The outcome comes back here",
                body: "The partner reports the outcome against your referral code — applied, approved, funded, repair completed — so your Wrenchli record shows the whole story, with your identity never passed along.",
              },
            ].map((step, i) => (
              <SectionReveal key={step.title} delay={i * 60}>
                <Card className="h-full">
                  <CardHeader>
                    {step.icon}
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="notify" className="section-padding bg-background">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <BellRing className="h-8 w-8 mx-auto text-accent" />
            <h2 className="font-heading text-xl font-bold md:text-2xl mt-3">
              Get notified when repair financing launches
            </h2>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">
              Leave your email and we will tell you the moment the first financing
              partner is live — no spam, just the launch.
            </p>
            <WaitlistForm
              source="financing"
              className="mt-6 max-w-xl mx-auto"
              toastTitle="You're on the financing list!"
              toastDescription="We'll email you the moment repair financing opens."
            />
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
