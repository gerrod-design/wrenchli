import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle, ArrowRight, ArrowLeft, Sparkles, Shield, User, Briefcase, FileText, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateFinancingScenario, formatCurrency, MI_LOAN } from "@/lib/financing";

interface FormData {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  addressDuration: string;
  employmentStatus: string;
  employerName: string;
  monthlyIncome: string;
  employmentDuration: string;
  agreeTerms: boolean;
  agreeDisclosure: boolean;
  agreePartialPayment: boolean;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  dob: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
  addressDuration: "",
  employmentStatus: "",
  employerName: "",
  monthlyIncome: "",
  employmentDuration: "",
  agreeTerms: false,
  agreeDisclosure: false,
  agreePartialPayment: false,
};

export default function MILoanApplication() {
  const [searchParams] = useSearchParams();
  const repairCost = Number(searchParams.get("repair")) || 500;
  const diagnosis = searchParams.get("diagnosis") || "Car Repair";
  const zip = searchParams.get("zip") || "";
  const year = searchParams.get("year") || "";
  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...initialForm, zip });
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const scenario = calculateFinancingScenario(repairCost);
  const monthlyPayment = scenario.monthlyPayment;
  const totalCost = scenario.totalLoanCost;

  const update = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed1 = form.firstName && form.lastName && form.email && form.phone && form.zip;
  const canProceed2 = form.employmentStatus && form.monthlyIncome;

  const handleSubmit = async () => {
    if (!form.agreeTerms || !form.agreeDisclosure) {
      toast.error("Please agree to both checkboxes to continue.");
      return;
    }
    if (scenario.isPartial && !form.agreePartialPayment) {
      toast.error("Please acknowledge the additional shop payment.");
      return;
    }
    }
    setSubmitting(true);
    try {
      await supabase.from("finance_selections" as any).insert({
        provider: "MI Affordable Loan",
        option_type: scenario.isPartial ? "state_program_partial" : "state_program",
        apr: MI_LOAN.maxApr,
        monthly_payment: monthlyPayment,
        term_months: MI_LOAN.termMonths,
        total_cost: totalCost,
        repair_cost: repairCost,
        vehicle_year: year || null,
        vehicle_make: make || null,
        vehicle_model: model || null,
        zip_code: form.zip || null,
      } as any);

      // Demo: show reviewing state then route to approved
      setSubmitting(false);
      setReviewing(true);
    } catch (e) {
      console.error("Submit error:", e);
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // Demo: after 3 seconds of reviewing, navigate to approved
  useEffect(() => {
    if (!reviewing) return;
    const timer = setTimeout(() => {
      navigate(`/mi-loan/approved?repair=${repairCost}&diagnosis=${encodeURIComponent(diagnosis)}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [reviewing, navigate, repairCost, diagnosis]);

  if (reviewing) {
    return (
      <main className="pb-[60px] md:pb-0">
        <SEO title="Reviewing Application — Wrenchli" description="Your MI Affordable Loan application is being reviewed." path="/mi-loan-application" />
        <section className="section-padding bg-background min-h-[60vh] flex items-center">
          <div className="container-wrenchli max-w-lg text-center">
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
                <Loader2 className="h-14 w-14 text-accent mx-auto animate-spin" />
                <h2 className="font-heading text-2xl font-bold">Reviewing Your Application...</h2>
                <p className="text-muted-foreground">
                  We're checking your eligibility. This will only take a moment.
                </p>
                <Progress value={66} className="h-2" />
              </div>
            </SectionReveal>
          </div>
        </section>
      </main>
    );
  }

  const steps = [
    { num: 1, label: "Basic Info", icon: <User className="h-4 w-4" /> },
    { num: 2, label: "Employment", icon: <Briefcase className="h-4 w-4" /> },
    { num: 3, label: "Review", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO title="MI Affordable Loan Application — Wrenchli" description="Apply for Michigan's MI Affordable Loan for car repairs." path="/mi-loan-application" />

      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <Badge className="mb-3 bg-accent text-accent-foreground">
              <Sparkles className="h-3 w-3 mr-1" /> MI Affordable Loan
            </Badge>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">Loan Application</h1>
            <p className="mt-2 text-primary-foreground/70">
              {formatCurrency(scenario.loanAmount)} loan • ~{formatCurrency(monthlyPayment)}/mo for 12 months
              {scenario.isPartial && ` • ${formatCurrency(scenario.outOfPocket)} at shop`}
            </p>
          </SectionReveal>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-3">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    step >= s.num ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </div>
              ))}
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-heading text-lg font-bold">Basic Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Smith" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(313) 555-0123" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="street">Street Address</Label>
                  <Input id="street" value={form.street} onChange={(e) => update("street", e.target.value)} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Detroit" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="MI" maxLength={2} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="appZip">ZIP</Label>
                    <Input id="appZip" value={form.zip} onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="48201" maxLength={5} inputMode="numeric" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>How long at this address?</Label>
                  <Select value={form.addressDuration} onValueChange={(v) => update("addressDuration", v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<1yr">Less than 1 year</SelectItem>
                      <SelectItem value="1-2yr">1–2 years</SelectItem>
                      <SelectItem value="2-5yr">2–5 years</SelectItem>
                      <SelectItem value="5+yr">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed1}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </SectionReveal>
          )}

          {/* Step 2: Employment */}
          {step === 2 && (
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-heading text-lg font-bold">Income & Employment</h2>
                <div className="space-y-1.5">
                  <Label>Employment Status *</Label>
                  <Select value={form.employmentStatus} onValueChange={(v) => update("employmentStatus", v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.employmentStatus === "employed" || form.employmentStatus === "self-employed") && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="employer">Employer Name</Label>
                      <Input id="employer" value={form.employerName} onChange={(e) => update("employerName", e.target.value)} placeholder="Company name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>How long with employer?</Label>
                      <Select value={form.employmentDuration} onValueChange={(v) => update("employmentDuration", v)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<6mo">Less than 6 months</SelectItem>
                          <SelectItem value="6mo-1yr">6 months – 1 year</SelectItem>
                          <SelectItem value="1-3yr">1–3 years</SelectItem>
                          <SelectItem value="3+yr">3+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="income">Monthly Income (before taxes) *</Label>
                  <Input id="income" value={form.monthlyIncome} onChange={(e) => update("monthlyIncome", e.target.value)} placeholder="$2,500" inputMode="numeric" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceed2}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SectionReveal>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <h2 className="font-heading text-lg font-bold">Review & Submit</h2>

                {/* Repair details */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Repair Details</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">Issue</span><span className="font-medium">{diagnosis}</span></div>
                  {(year || make || model) && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="font-medium">{[year, make, model].filter(Boolean).join(" ")}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold text-accent">{formatCurrency(repairCost)}</span></div>
                </div>

                {/* Loan summary */}
                <div className="rounded-lg border-2 border-accent bg-accent/5 p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-accent">Loan Summary</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">Loan Amount</span><span className="font-medium">{formatCurrency(scenario.loanAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Term</span><span className="font-medium">12 months</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Est. APR</span><span className="font-medium">{MI_LOAN.maxApr}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly Payment</span><span className="font-bold text-accent text-lg">~{formatCurrency(monthlyPayment)}/mo</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Repayment</span><span className="font-medium">{formatCurrency(totalCost)}</span></div>
                </div>

                {/* Partial financing notice */}
                {scenario.isPartial && (
                  <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2 text-sm">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      ⚠️ Additional Payment at Shop
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Repair Cost</span>
                      <span className="font-medium">{formatCurrency(repairCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MI Loan Covers</span>
                      <span className="font-medium text-green-700">{formatCurrency(MI_LOAN.maxAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-300 pt-2">
                      <span className="font-semibold text-amber-800 dark:text-amber-300">You Pay at Shop</span>
                      <span className="font-bold text-amber-800 dark:text-amber-300">{formatCurrency(scenario.outOfPocket)}</span>
                    </div>
                  </div>
                )

                {/* Applicant info */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Your Information</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.firstName} {form.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{form.city ? `${form.city}, ` : ""}{form.state} {form.zip}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Employment</span><span className="font-medium capitalize">{form.employmentStatus}</span></div>
                </div>

                {/* Agreements */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox id="terms" checked={form.agreeTerms} onCheckedChange={(v) => update("agreeTerms", v === true)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                      I agree to the <span className="underline">terms and conditions</span> of the MI Affordable Loan program and authorize verification of the information provided.
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="disclosure" checked={form.agreeDisclosure} onCheckedChange={(v) => update("agreeDisclosure", v === true)} className="mt-0.5" />
                    <label htmlFor="disclosure" className="text-xs text-muted-foreground cursor-pointer">
                      I understand this is a <span className="font-semibold">pre-qualification</span> only. Final approval, terms, and APR are determined by the lending partner.
                    </label>
                  </div>
                </div>

                <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-accent shrink-0" />
                  Your information is encrypted and never shared without your consent.
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !form.agreeTerms || !form.agreeDisclosure}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  >
                    {submitting ? "Submitting..." : "Submit Application"} {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </main>
  );
}
