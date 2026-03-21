import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, CalendarDays, DollarSign, Wrench, ArrowRight, Sparkles, Download,
} from "lucide-react";
import { calculateMonthlyPayment, formatCurrency, MI_LOAN } from "@/lib/financing";
import { format, addDays } from "date-fns";

export default function MILoanApproved() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";

  const monthly = calculateMonthlyPayment(repairCost, MI_LOAN.maxApr, MI_LOAN.termMonths);
  const totalCost = monthly * MI_LOAN.termMonths;
  const firstPaymentDate = addDays(new Date(), 30);

  const loanDetails = [
    { label: "Loan Amount", value: formatCurrency(repairCost) },
    { label: "Interest Rate", value: `${MI_LOAN.maxApr}% APR` },
    { label: "Term", value: `${MI_LOAN.termMonths} months` },
    { label: "Monthly Payment", value: formatCurrency(monthly), highlight: true },
    { label: "First Payment Due", value: format(firstPaymentDate, "MMMM d, yyyy") },
    { label: "Total Cost", value: formatCurrency(totalCost) },
  ];

  const nextSteps = [
    { icon: <CalendarDays className="h-5 w-5" />, text: "Book appointment with your repair shop" },
    { icon: <DollarSign className="h-5 w-5" />, text: "We transfer funds directly to the shop" },
    { icon: <Wrench className="h-5 w-5" />, text: "Get your car repaired" },
    { icon: <CheckCircle className="h-5 w-5" />, text: "Make easy monthly payments" },
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

              {/* Next steps */}
              <div className="text-left space-y-3">
                <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Next Steps
                </h3>
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-accent/5 border border-accent/10 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-foreground">{step.text}</span>
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
