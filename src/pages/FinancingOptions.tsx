import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, CreditCard, DollarSign, Building, ArrowRight,
} from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function FinancingOptions() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";

  useEffect(() => {
    trackEvent({
      event_type: "page_view",
      category: "finance_option",
      action: "financing_options_viewed",
      value: repairCost,
      zip_code: zip,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const affirmMonthly = Math.round((repairCost * 1.10) / 12);

  const otherOptions = [
    {
      id: "pay-full",
      title: "Pay in Full",
      icon: <DollarSign className="h-6 w-6" />,
      highlight: false,
      badge: null,
      amount: `$${repairCost.toLocaleString()}`,
      subtitle: "One-time payment",
      features: ["No interest or fees", "Simplest option", "Pay at the shop"],
      buttonText: "Select",
      buttonLink: null,
    },
    {
      id: "affirm",
      title: "Affirm Financing",
      icon: <CreditCard className="h-6 w-6" />,
      highlight: false,
      badge: null,
      amount: `~$${affirmMonthly}/mo`,
      subtitle: "12 months • ~10% APR",
      features: ["Credit check required", "Instant decision", "No prepayment penalty"],
      buttonText: "Check If I Qualify",
      buttonLink: "https://www.affirm.com",
    },
    {
      id: "credit-union",
      title: "Credit Union Loan",
      icon: <Building className="h-6 w-6" />,
      highlight: false,
      badge: null,
      amount: "Low rates",
      subtitle: "For credit union members",
      features: ["Lowest interest rates", "Local community lenders", "Flexible terms"],
      buttonText: "View Partners",
      buttonLink: null,
    },
  ];

  function renderCard(opt: typeof otherOptions[0]) {
    return (
      <Card className="relative h-full transition-all duration-300 hover:shadow-lg border-border">
        {opt.badge && (
          <Badge className="absolute -top-3 left-4 bg-accent text-accent-foreground">
            {opt.badge}
          </Badge>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {opt.icon}
            </div>
            <CardTitle className="text-lg">{opt.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-heading font-extrabold text-foreground text-3xl">
              {opt.amount}
            </p>
            <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
          </div>
          <ul className="space-y-2">
            {opt.features.map((f, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          {opt.buttonLink ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => window.open(opt.buttonLink!, "_blank", "noopener,noreferrer")}
            >
              {opt.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              {opt.buttonText}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Financing Options — Wrenchli"
        description="Compare ways to pay for your car repair: pay in full, Affirm, or a credit union loan."
        path="/financing-options"
      />

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">Financing Options</h1>
            <p className="mt-2 text-primary-foreground/70">
              Choose how you'd like to pay for your <span className="font-semibold">${repairCost.toLocaleString()}</span> repair
              {diagnosis !== "Car Repair" && <> — {diagnosis}</>}.
            </p>
            <p className="mt-3 text-xs text-primary-foreground/60">
              Wrenchli repair financing is on the way. Until then, here are third-party options to consider.
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherOptions.map((opt, i) => (
              <SectionReveal key={opt.id} delay={i * 80}>
                {renderCard(opt)}
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
