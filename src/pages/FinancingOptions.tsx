import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, CreditCard, DollarSign, Building, Star, Sparkles, ArrowRight,
} from "lucide-react";
import { isMichiganZip, calculateMonthlyPayment, MI_LOAN } from "@/lib/financing";

export default function FinancingOptions() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";
  const year = searchParams.get("year") || "";
  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";

  const isMI = isMichiganZip(zip);
  const miEligible = repairCost <= MI_LOAN.maxAmount;
  const miMonthly = calculateMonthlyPayment(repairCost, MI_LOAN.maxApr, MI_LOAN.termMonths);
  const affirmMonthly = Math.round((repairCost * 1.10) / 12);

  const miLoanCard = {
    id: "mi-loan",
    title: "MI Affordable Loan",
    icon: <Star className="h-6 w-6" />,
    highlight: true,
    badge: "🏛️ FEATURED — Michigan Residents Only",
    amount: `~$${miMonthly}/mo`,
    subtitle: `${MI_LOAN.termMonths} months • ${MI_LOAN.maxApr}% APR max`,
    features: [
      `Up to $${MI_LOAN.maxAmount.toLocaleString()} available`,
      "✨ No traditional credit check",
      "✅ State of Michigan program",
      "🏅 Designed for unexpected car repairs",
      "Quick eligibility check",
    ],
    buttonText: "Check Eligibility",
    buttonLink: `/mi-loan-eligibility?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${zip}&year=${year}&make=${make}&model=${model}`,
  };

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

  function renderCard(opt: typeof otherOptions[0], featured = false) {
    return (
      <Card
        className={`relative h-full transition-all duration-300 hover:shadow-lg ${
          featured
            ? "border-2 border-accent ring-2 ring-accent/20 shadow-xl"
            : opt.highlight
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
        {featured && (
          <div className="absolute -top-3 -right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            🎉 NEW!
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              opt.highlight || featured ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
            }`}>
              {opt.icon}
            </div>
            <CardTitle className={featured ? "text-xl" : "text-lg"}>{opt.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={`font-heading font-extrabold text-foreground ${featured ? "text-4xl" : "text-3xl"}`}>
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
          {opt.buttonLink?.startsWith("/") ? (
            <Button
              className={`w-full ${opt.highlight || featured ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
              variant={opt.highlight || featured ? "default" : "outline"}
              size={featured ? "lg" : "default"}
              asChild
            >
              <Link to={opt.buttonLink}>
                {opt.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : opt.buttonLink ? (
            <Button className="w-full" variant="outline" onClick={() => window.open(opt.buttonLink!, "_blank")}>
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
          {/* MI Loan featured card — full width for MI users */}
          {isMI && miEligible && (
            <SectionReveal className="mb-6">
              {renderCard(miLoanCard, true)}
            </SectionReveal>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherOptions.map((opt, i) => (
              <SectionReveal key={opt.id} delay={i * 80}>
                {renderCard(opt)}
              </SectionReveal>
            ))}
          </div>

          {/* Show MI Loan as smaller card for non-MI or over-limit */}
          {(!isMI || !miEligible) && (
            <SectionReveal delay={300}>
              <div className="mt-6 rounded-xl border border-border bg-muted/50 p-6 text-center">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">MI Affordable Loan</span> — Available to Michigan residents for repairs under $1,200.
                  {!isMI && " Enter a Michigan ZIP code to check eligibility."}
                  {isMI && !miEligible && " This repair exceeds the $1,200 limit."}
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/mi-affordable-loan">Learn More</Link>
                </Button>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </main>
  );
}
