import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle, DollarSign, Store, Landmark, BellRing, Percent,
  ShieldCheck, AlertTriangle, ArrowRight, BadgePercent,
} from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import WaitlistForm from "@/components/WaitlistForm";

type Status = "available" | "state" | "coming";

interface Option {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: Status;
  statusLabel: string;
  amount: string;
  subtitle: string;
  features: string[];
  action: "waitlist" | "info";
  note?: string;
}

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

  const zeroPctMonthly = Math.max(1, Math.round(repairCost / 12));

  const statusStyles: Record<Status, string> = {
    available: "bg-green-100 text-green-800",
    state: "bg-blue-100 text-blue-800",
    coming: "bg-amber-100 text-amber-800",
  };

  const options: Option[] = [
    {
      id: "pay-full",
      title: "Pay in Full",
      icon: <DollarSign className="h-6 w-6" />,
      status: "available",
      statusLabel: "Available now",
      amount: `$${repairCost.toLocaleString()}`,
      subtitle: "One-time payment at the shop",
      features: ["No interest or fees", "Simplest option", "Bring your Wrenchli estimate so the price is agreed upfront"],
      action: "info",
    },
    {
      id: "shop-plan",
      title: "Shop Payment Plan",
      icon: <Store className="h-6 w-6" />,
      status: "available",
      statusLabel: "Ask your shop",
      amount: "Varies",
      subtitle: "Split the repair into payments",
      features: [
        "Many independent shops will split a repair into 2–4 payments — ask your service advisor",
        "Get the plan in writing before work starts",
        "We're standardizing this into a simple Wrenchli split-pay option",
      ],
      action: "info",
    },
    {
      id: "mi-loan",
      title: "MI Affordable Loan Program",
      icon: <Landmark className="h-6 w-6" />,
      status: "state",
      statusLabel: "State program launching",
      amount: "Up to $1,200",
      subtitle: "Same-day small-dollar loans for low-income Michiganders",
      features: [
        "Michigan is launching state-backed, same-day loans up to $1,200 — car repairs explicitly included",
        "Built for people with adverse credit who banks turn away",
        "Applications aren't open yet — join the list and we'll notify you the day they are",
      ],
      action: "waitlist",
      note: "Wrenchli is working to become a referral and verification partner for this program.",
    },
    {
      id: "zero-pct",
      title: "0% Installment Plans",
      icon: <BadgePercent className="h-6 w-6" />,
      status: "coming",
      statusLabel: "Coming soon",
      amount: `~$${zeroPctMonthly}/mo`,
      subtitle: `True 0% on your $${repairCost.toLocaleString()} repair`,
      features: [
        "We're vetting installment partners that offer genuine 0% plans",
        "No deferred interest, no gotchas — nothing above our 24% ceiling, ever",
        "Join the list for early access in Michigan",
      ],
      action: "waitlist",
    },
    {
      id: "cdfi",
      title: "Community Lender Loans",
      icon: <Percent className="h-6 w-6" />,
      status: "coming",
      statusLabel: "Coming soon",
      amount: "Low rates",
      subtitle: "Detroit credit unions & CDFIs",
      features: [
        "We're building partnerships with Detroit community lenders",
        "Counseling-first loans designed for thin credit files",
        "Repair-anchored: money goes to the shop, released when the work is verified",
      ],
      action: "waitlist",
    },
  ];

  function renderCard(opt: Option) {
    return (
      <Card className="relative h-full flex flex-col transition-all duration-300 hover:shadow-lg border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {opt.icon}
              </div>
              <CardTitle className="text-lg">{opt.title}</CardTitle>
            </div>
          </div>
          <Badge className={`mt-3 w-fit ${statusStyles[opt.status]}`}>{opt.statusLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div>
            <p className="font-heading font-extrabold text-foreground text-3xl">{opt.amount}</p>
            <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
          </div>
          <ul className="space-y-2 flex-1">
            {opt.features.map((f, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          {opt.note && <p className="text-xs text-muted-foreground italic">{opt.note}</p>}
          {opt.action === "waitlist" ? (
            <Button className="w-full" variant="default" asChild>
              <a href="#notify">
                <BellRing className="mr-2 h-4 w-4" /> Notify me <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button className="w-full" variant="outline" asChild>
              <a href="/find-shops">
                Find a shop <ArrowRight className="ml-2 h-4 w-4" />
              </a>
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
        description="Ways to pay for your car repair: pay in full, shop payment plans, Michigan's Affordable Loan program, 0% installments, and community lender loans — never above 24% APR."
        path="/financing-options"
      />

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">Ways to Pay for Your Repair</h1>
            <p className="mt-2 text-primary-foreground/70">
              Options for your <span className="font-semibold">${repairCost.toLocaleString()}</span> repair
              {diagnosis !== "Car Repair" && <> — {diagnosis}</>} — ranked by total cost to you, never by who pays us.
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary-foreground/10 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm text-primary-foreground/80">
                <span className="font-semibold text-primary-foreground">Our ceiling: 24% APR.</span>{" "}
                Wrenchli will never show you a loan above 24% APR — no matter who offers it. If a product can't meet that bar, it doesn't belong here.
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {options.map((opt, i) => (
              <SectionReveal key={opt.id} delay={i * 60}>
                {renderCard(opt)}
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="notify" className="section-padding bg-muted/40">
        <div className="container-wrenchli max-w-2xl text-center">
          <SectionReveal>
            <BellRing className="h-8 w-8 mx-auto text-accent" />
            <h2 className="font-heading text-xl font-bold md:text-2xl mt-3">Get notified when repair financing launches</h2>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">
              Michigan's Affordable Loan program, 0% installment plans, and community lender loans are on the way.
              Leave your email and we'll tell you the moment you can apply — no spam, just the launch.
            </p>
            <WaitlistForm
              source="financing-options"
              className="mt-6 max-w-xl mx-auto"
              toastTitle="You're on the financing list!"
              toastDescription="We'll email you the moment affordable repair financing opens in Michigan."
            />
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
              <h2 className="font-heading text-xl font-bold md:text-2xl">Two traps to know about</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">"No interest for 12 months*" — the deferred-interest trap</p>
                <p className="mt-1">
                  The asterisk matters. With deferred interest, if you don't pay the <em>entire</em> balance by the deadline,
                  you're charged interest on the full amount going back to day one — often near 30% APR or more. A true 0% plan
                  never does this. Always ask: "Is this deferred interest?"
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="font-semibold text-foreground">Lease-to-own / rent-to-own repair financing</p>
                <p className="mt-1">
                  You're not borrowing — you're "leasing" the repair, and the total can run to double the price or more.
                  Consumer regulators have flagged effective costs above 200% of the repair price. If the paperwork says
                  "lease," walk away.
                </p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-muted/40">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-xl font-bold md:text-2xl">How Wrenchli financing will work</h2>
            <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-none">
              {[
                "Start with a verified estimate — you only borrow what the repair actually costs.",
                "The money goes to the shop, not your pocket — released when the repair is verified complete.",
                "Every offer is ranked by total cost to you. Nothing above 24% APR. No paid placement, ever.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Wrenchli is not a lender. Financing will be provided by licensed lending partners; Wrenchli provides the
              verified estimate, the shop, and the outcome confirmation.
            </p>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
