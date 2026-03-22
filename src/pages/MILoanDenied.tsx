import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Info, CreditCard, Building, Phone, ArrowRight,
} from "lucide-react";
import { MI_LOAN } from "@/lib/financing";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function MILoanDenied() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";

  useEffect(() => {
    trackEvent({
      event_type: "ad_conversion",
      category: "finance_option",
      action: "mi_loan_denied",
      value: repairCost,
      label: diagnosis,
      zip_code: zip,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Application Update — Wrenchli"
        description="Your MI Affordable Loan application update and alternative financing options."
        path="/mi-loan/denied"
      />

      <section className="section-padding bg-background min-h-[80vh]">
        <div className="container-wrenchli max-w-lg">
          <SectionReveal>
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Info className="h-10 w-10 text-blue-600" />
              </div>

              <div>
                <h1 className="font-heading text-2xl font-bold md:text-3xl">Application Update</h1>
                <p className="mt-2 text-muted-foreground">
                  We weren't able to approve your application at this time. But don't worry — there are other ways to finance your repair.
                </p>
              </div>

              <div className="text-left space-y-4">
                <h3 className="font-heading font-semibold text-center">Here are other options:</h3>

                <Card className="border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">Affirm Financing</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Split your repair into easy monthly payments. Quick online application with instant decision.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => window.open("https://www.affirm.com", "_blank")}>
                      Check If I Qualify <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-base">Credit Union Loans</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Local credit unions often offer the lowest rates with flexible terms and personalized service.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/financing-options?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${zip}`}>
                        View Credit Union Partners <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground text-center">
                  <p className="font-medium text-foreground mb-1">💡 Ask your shop about payment plans</p>
                  <p>Many repair shops offer in-house payment options for their customers.</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/financing-options?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}&zip=${zip}`}>
                    ← Back to Financing Options
                  </Link>
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Questions? Call {MI_LOAN.supportPhone}</span>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
