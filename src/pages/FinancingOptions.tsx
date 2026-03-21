import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, CreditCard, DollarSign, Building, Shield, Star, Sparkles, ArrowRight,
} from "lucide-react";

export default function FinancingOptions() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";
  const year = searchParams.get("year") || "";
  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";

  const isMichigan = zip.startsWith("48") || zip.startsWith("49");
  const miEligibleAmount = repairCost <= 1200;
  const miMonthly = Math.round((repairCost * 1.36) / 12);

  const affirmMonthly = Math.round((repairCost * 1.10) / 12);

  const options = [
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
      id: "mi-loan",
      title: "MI Affordable Loan",
      icon: <Star className="h-6 w-6" />,
      highlight: true,
      badge: "NEW! Michigan Residents Only",
      amount: `~$${miMonthly}/mo`,
      subtitle: "12 months • 36% APR max",
      features: [
        "Up to $1,200 available",
        "✨ No traditional credit check",
        "✅ State of Michigan program",
        "Quick eligibility check",
      ],
      buttonText: "Check Eligibility",
      buttonLink: `/mi-loan-eligibility?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${zip}&year=${year}&make=${make}&model=${model}`,
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

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Financing Options — Wrenchli"
        description="Flexible financing for car repairs including MI Affordable Loan, Affirm, and credit union options."
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
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {options.map((opt, i) => (
              <SectionReveal key={opt.id} delay={i * 80}>
                <Card
                  className={`relative h-full transition-shadow hover:shadow-lg ${
                    opt.highlight
                      ? "border-2 border-accent ring-2 ring-accent/20"
                      : "border-border"
                  }`}
                >
                  {opt.badge && (
                    <Badge className="absolute -top-3 left-4 bg-accent text-accent-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {opt.badge}
                    </Badge>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        opt.highlight ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                      }`}>
                        {opt.icon}
                      </div>
                      <CardTitle className="text-lg">{opt.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-heading text-3xl font-extrabold text-foreground">{opt.amount}</p>
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
                    {opt.buttonLink?.startsWith("/") ? (
                      <Button
                        className={`w-full ${opt.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                        variant={opt.highlight ? "default" : "outline"}
                        asChild
                      >
                        <Link to={opt.buttonLink}>
                          {opt.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : opt.buttonLink ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => window.open(opt.buttonLink!, "_blank")}
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
              </SectionReveal>
            ))}
          </div>

          {isMichigan && miEligibleAmount && (
            <SectionReveal delay={400}>
              <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
                <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Based on your ZIP code <span className="font-mono font-semibold">{zip}</span>, you may qualify for the
                  <span className="font-semibold text-foreground"> MI Affordable Loan</span> program.
                </p>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </main>
  );
}
