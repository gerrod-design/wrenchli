import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, XCircle, MapPin, DollarSign, ArrowRight, Sparkles, CreditCard, AlertTriangle,
} from "lucide-react";
import { isMichiganZip, calculateFinancingScenario, formatCurrency, MI_LOAN } from "@/lib/financing";
import { trackEvent } from "@/lib/analytics";

export default function MILoanEligibility() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";
  const year = searchParams.get("year") || "";
  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";

  const [enteredZip, setEnteredZip] = useState(zip);
  const [step, setStep] = useState<"zip" | "result">("zip");

  const isMichigan = isMichiganZip(enteredZip);
  const scenario = calculateFinancingScenario(repairCost);
  const isEligible = isMichigan && !scenario.isTooHigh;

  const handleCheck = () => {
    if (enteredZip.length === 5) {
      setStep("result");
      const eligible = isMichiganZip(enteredZip) && !scenario.isTooHigh;
      const financingType = scenario.isPartial ? "partial" : scenario.isTooHigh ? "over_limit" : "full";
      trackEvent({
        event_type: "user_action",
        category: "finance_option",
        action: eligible ? "mi_loan_eligibility_passed" : "mi_loan_eligibility_failed",
        label: !isMichiganZip(enteredZip) ? "non_michigan" : financingType,
        value: repairCost,
        zip_code: enteredZip,
        metadata: { financing_type: financingType, repair_cost: repairCost },
      });
    }
  };

  const applicationLink = `/mi-loan-application?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${enteredZip}&year=${year}&make=${make}&model=${model}`;

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="MI Affordable Loan Eligibility — Wrenchli"
        description="Check if you qualify for Michigan's MI Affordable Loan program for car repairs."
        path="/mi-loan-eligibility"
      />

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <Badge className="mb-3 bg-accent text-accent-foreground">
              <Sparkles className="h-3 w-3 mr-1" /> State of Michigan Program
            </Badge>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">MI Affordable Loan</h1>
            <p className="mt-2 text-primary-foreground/70">
              Up to $1,200 • 12 months • 36% APR max • No traditional credit check
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-lg">
          {step === "zip" && (
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold">Step 1: Verify Your Location</h2>
                    <p className="text-sm text-muted-foreground">Enter your ZIP code to check eligibility</p>
                  </div>
                </div>

                <Input
                  placeholder="ZIP code (e.g., 48201)"
                  value={enteredZip}
                  onChange={(e) => setEnteredZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="h-12 text-lg text-center font-mono tracking-widest"
                  maxLength={5}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Repair cost:</span>
                    <span className="font-semibold">{formatCurrency(repairCost)}</span>
                    {!scenario.isTooHigh ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {scenario.isPartial && (
                    <p className="text-xs text-accent flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Exceeds $1,200 limit — partial financing available
                    </p>
                  )}
                  {scenario.isTooHigh && (
                    <p className="text-xs text-destructive">
                      Exceeds the program's practical range. We'll show alternative options.
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleCheck}
                  disabled={enteredZip.length !== 5}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  Check Eligibility
                </Button>
              </div>
            </SectionReveal>
          )}

          {/* ── ELIGIBLE: full financing ── */}
          {step === "result" && isEligible && scenario.isFullFinancing && (
            <SectionReveal>
              <div className="rounded-2xl border-2 border-accent bg-accent/5 p-6 md:p-8 space-y-5 text-center">
                <Sparkles className="h-12 w-12 text-accent mx-auto" />
                <h2 className="font-heading text-2xl font-bold">✨ You May Qualify!</h2>
                <p className="text-muted-foreground">
                  Based on your location and repair cost, you appear eligible for full financing.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card border border-border p-4">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" /> Michigan
                    </p>
                  </div>
                  <div className="rounded-lg bg-card border border-border p-4">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" /> {formatCurrency(repairCost)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-card border border-border p-5">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                  <p className="font-heading text-4xl font-extrabold text-accent">
                    {formatCurrency(scenario.monthlyPayment)}<span className="text-lg font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">for 12 months • Out-of-pocket: $0</p>
                </div>

                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                  <Link to={applicationLink}>
                    Continue to Application <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </SectionReveal>
          )}

          {/* ── ELIGIBLE: partial financing ── */}
          {step === "result" && isEligible && scenario.isPartial && (
            <SectionReveal>
              <div className="rounded-2xl border-2 border-accent bg-accent/5 p-6 md:p-8 space-y-5 text-center">
                <AlertTriangle className="h-12 w-12 text-accent mx-auto" />
                <h2 className="font-heading text-2xl font-bold">💡 Partial Financing Available</h2>
                <p className="text-muted-foreground">
                  Your repair exceeds the $1,200 limit, but we can still help cover most of it!
                </p>

                <div className="rounded-xl bg-card border border-border p-5 space-y-3 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Repair Cost</span>
                    <span className="font-semibold">{formatCurrency(repairCost)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-sm">
                    <span className="text-green-700 font-medium">✅ MI Loan covers</span>
                    <span className="font-bold text-green-700">{formatCurrency(MI_LOAN.maxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground ml-4">Monthly payment</span>
                    <span className="font-semibold text-accent">{formatCurrency(scenario.monthlyPayment)}/mo × 12</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-sm">
                    <span className="text-amber-700 font-medium">⚠️ You pay at shop</span>
                    <span className="font-bold text-amber-700">{formatCurrency(scenario.outOfPocket)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">(Cash, card, or shop payment plan)</p>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                    <Link to={applicationLink}>
                      Apply for {formatCurrency(MI_LOAN.maxAmount)} Loan <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">Or finance the full amount:</p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/financing-options?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${enteredZip}`}>
                      <CreditCard className="mr-2 h-4 w-4" /> View Affirm Options (up to $17,500)
                    </Link>
                  </Button>
                </div>
              </div>
            </SectionReveal>
          )}

          {/* ── NOT ELIGIBLE ── */}
          {step === "result" && !isEligible && (
            <SectionReveal>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 md:p-8 space-y-5 text-center">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="font-heading text-2xl font-bold">Not Eligible</h2>
                <div className="space-y-2 text-sm">
                  {!isMichigan && (
                    <p className="text-destructive">
                      ❌ MI Affordable Loan is only available to Michigan residents.
                    </p>
                  )}
                  {scenario.isTooHigh && (
                    <p className="text-destructive">
                      ❌ This repair ({formatCurrency(repairCost)}) exceeds the program's practical range.
                    </p>
                  )}
                </div>

                <p className="text-muted-foreground text-sm">Try one of these alternatives:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/financing-options?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${enteredZip}`}>
                      <CreditCard className="mr-2 h-4 w-4" /> Affirm Financing
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/financing-options?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${enteredZip}`}>
                      <DollarSign className="mr-2 h-4 w-4" /> Credit Union Loans
                    </Link>
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setStep("zip")} className="text-muted-foreground">
                  ← Try a different ZIP code
                </Button>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </main>
  );
}
