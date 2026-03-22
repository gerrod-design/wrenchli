import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, CalendarDays, DollarSign, Wrench, ArrowRight, Sparkles, Download, AlertTriangle, CreditCard,
} from "lucide-react";
import { calculateFinancingScenario, formatCurrency, MI_LOAN } from "@/lib/financing";
import { format, addDays } from "date-fns";

export default function MILoanApproved() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";

  const scenario = calculateFinancingScenario(repairCost);
  const firstPaymentDate = addDays(new Date(), 30);

  const loanDetails = [
    { label: "Loan Amount", value: formatCurrency(scenario.loanAmount) },
    { label: "Interest Rate", value: `${MI_LOAN.maxApr}% APR` },
    { label: "Term", value: `${MI_LOAN.termMonths} months` },
    { label: "Monthly Payment", value: formatCurrency(scenario.monthlyPayment), highlight: true },
    { label: "First Payment Due", value: format(firstPaymentDate, "MMMM d, yyyy") },
    { label: "Total Loan Cost", value: formatCurrency(scenario.totalLoanCost) },
  ];

  const nextSteps = [
    { icon: <CheckCircle className="h-5 w-5" />, text: "Loan approved ✅" },
    { icon: <CalendarDays className="h-5 w-5" />, text: "Book your appointment (we'll send funds to shop)" },
    { icon: <Wrench className="h-5 w-5" />, text: "Get your car repaired" },
    ...(scenario.isPartial
      ? [{ icon: <CreditCard className="h-5 w-5" />, text: `Pay ${formatCurrency(scenario.outOfPocket)} at shop when picking up` }]
      : []),
    { icon: <DollarSign className="h-5 w-5" />, text: "Make easy monthly payments (auto-pay recommended)" },
  ];

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Loan Approved — MI Affordable Loan | Wrenchli"
        description="Congratulations! Your MI Affordable Loan has been approved."
        path="/mi-loan/approved"
      />

      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <div className="rounded-2xl border-2 border-accent bg-card p-6 md:p-8 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <Badge className="mb-2 bg-green-600 text-white">
                  <Sparkles className="h-3 w-3 mr-1" /> Approved
                </Badge>
                <h1 className="font-heading text-2xl font-bold md:text-3xl">
                  Congratulations! You're Approved!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Your MI Affordable Loan for <span className="font-semibold">{diagnosis}</span> has been approved.
                </p>
              </div>

              {/* Loan details table */}
              <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border text-sm text-left">
                {loanDetails.map((item) => (
                  <div key={item.label} className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={item.highlight ? "font-bold text-accent text-lg" : "font-semibold"}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Partial financing warning */}
              {scenario.isPartial && (
                <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-5 text-left space-y-3">
                  <h3 className="text-base font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5" /> Additional Payment Required
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your total repair cost is <span className="font-semibold">{formatCurrency(repairCost)}</span>. The MI Loan covers{" "}
                    <span className="font-semibold">{formatCurrency(MI_LOAN.maxAmount)}</span>. You'll need to pay the remaining{" "}
                    <span className="font-bold text-amber-700 dark:text-amber-300">{formatCurrency(scenario.outOfPocket)}</span> at the shop.
                  </p>
                  <div className="rounded-lg bg-card border border-border p-3 text-sm">
                    <p className="font-semibold text-foreground mb-1">Payment options at shop:</p>
                    <ul className="list-disc ml-5 text-muted-foreground space-y-1">
                      <li>Credit or Debit Card</li>
                      <li>Cash</li>
                      <li>Shop Payment Plan (ask shop directly)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Next steps */}
              <div className="text-left space-y-3">
                <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Next Steps
                </h3>
                {nextSteps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-accent/5 border border-accent/10 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-foreground">{s.text}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                  <Link to="/find-shops">
                    Book Appointment Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                  <Download className="mr-2 h-4 w-4" /> Download Loan Documents (PDF)
                </Button>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
