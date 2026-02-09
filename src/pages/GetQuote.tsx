import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, DollarSign, Wrench, Clock, Shield, ArrowRight,
  CheckCircle, Loader2, AlertCircle, Car, CreditCard,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ESTIMATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-repair`;

interface CostEstimate {
  metro_area: string;
  cost_low: number;
  cost_high: number;
  parts_estimate: string;
  labor_estimate: string;
  labor_hours: string;
  regional_notes: string;
  what_to_expect: string;
  warranty_note: string;
}

export default function GetQuote() {
  const [searchParams] = useSearchParams();

  // Pre-filled from URL params
  const diagnosis = searchParams.get("diagnosis") || "";
  const code = searchParams.get("code") || "";
  const vehicle = searchParams.get("vehicle") || "";
  const urgency = searchParams.get("urgency") || "";
  const diyFeasibility = searchParams.get("diy") || "";
  const year = searchParams.get("year") || "";
  const make = searchParams.get("make") || "";
  const model = searchParams.get("model") || "";
  const trim = searchParams.get("trim") || "";

  const vehicleStr = vehicle || [year, make, model, trim].filter(Boolean).join(" ");

  // State
  const [zipCode, setZipCode] = useState("");
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  // Referral form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [financingInterested, setFinancingInterested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  const handleGetEstimate = async () => {
    const zip = zipCode.replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) {
      toast.error("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setIsEstimating(true);
    setEstimateError("");
    setEstimate(null);

    try {
      const resp = await fetch(ESTIMATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          diagnosis_title: diagnosis,
          diagnosis_code: code,
          vehicle_year: year,
          vehicle_make: make,
          vehicle_model: model,
          vehicle_trim: trim,
          zip_code: zip,
          diy_feasibility: diyFeasibility,
          urgency,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get estimate");
      }

      const data: CostEstimate = await resp.json();
      setEstimate(data);

      // Save to database
      const { data: inserted, error: insertError } = await supabase
        .from("quote_requests" as any)
        .insert({
          diagnosis_title: diagnosis,
          diagnosis_code: code || null,
          diagnosis_urgency: urgency || null,
          diagnosis_diy_feasibility: diyFeasibility || null,
          vehicle_year: year || null,
          vehicle_make: make || null,
          vehicle_model: model || null,
          vehicle_trim: trim || null,
          zip_code: zip,
          metro_area: data.metro_area,
          estimated_cost_low: data.cost_low,
          estimated_cost_high: data.cost_high,
          cost_estimate_details: data as any,
          financing_interested: financingInterested,
        } as any)
        .select("id")
        .single();

      if (!insertError && inserted) {
        setQuoteId((inserted as any).id);
      }
    } catch (e) {
      console.error("Estimate error:", e);
      const msg = e instanceof Error ? e.message : "Failed to get estimate";
      setEstimateError(msg);
      toast.error(msg);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleRequestReferral = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email so shops can reach you.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (quoteId) {
        await supabase
          .from("quote_requests" as any)
          .update({
            customer_name: name || null,
            customer_email: email,
            customer_phone: phone || null,
            customer_notes: notes || null,
            financing_interested: financingInterested,
            status: "referral_requested",
            referral_requested_at: new Date().toISOString(),
          } as any)
          .eq("id", quoteId);
      } else {
        await supabase.from("quote_requests" as any).insert({
          diagnosis_title: diagnosis,
          diagnosis_code: code || null,
          diagnosis_urgency: urgency || null,
          diagnosis_diy_feasibility: diyFeasibility || null,
          vehicle_year: year || null,
          vehicle_make: make || null,
          vehicle_model: model || null,
          vehicle_trim: trim || null,
          zip_code: zipCode.replace(/\D/g, "").slice(0, 5),
          metro_area: estimate?.metro_area || null,
          estimated_cost_low: estimate?.cost_low || null,
          estimated_cost_high: estimate?.cost_high || null,
          cost_estimate_details: (estimate as any) || {},
          customer_name: name || null,
          customer_email: email,
          customer_phone: phone || null,
          customer_notes: notes || null,
          financing_interested: financingInterested,
          status: "referral_requested",
          referral_requested_at: new Date().toISOString(),
        });
      }

      setSubmitted(true);
      toast.success("Your quote request has been submitted!");
    } catch (e) {
      console.error("Submit error:", e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!diagnosis) {
    return (
      <main className="pb-[60px] md:pb-0">
        <SEO title="Get a Quote — Wrenchli" description="Get repair cost estimates from trusted local shops." path="/get-quote" />
        <section className="section-padding bg-secondary min-h-[60vh] flex items-center">
          <div className="container-wrenchli max-w-2xl text-center">
            <h1 className="font-heading text-2xl font-bold md:text-4xl">Get a Repair Quote</h1>
            <p className="mt-4 text-muted-foreground">
              Start with a diagnosis to get accurate repair cost estimates.
            </p>
            <Button asChild className="mt-6 h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <Link to="/#quote">
                <Car className="mr-2 h-4 w-4" /> Start Your Diagnosis
              </Link>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title={`Repair Quote: ${diagnosis} — Wrenchli`}
        description={`Get estimated repair costs for ${diagnosis}${vehicleStr ? ` on your ${vehicleStr}` : ""}.`}
        path="/get-quote"
      />

      {/* Header */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-2xl font-bold md:text-4xl">Get Your Repair Estimate</h1>
            <div className="mt-4 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 space-y-1">
              <p className="text-sm text-primary-foreground/70">Diagnosis</p>
              <p className="font-heading font-semibold text-lg">{diagnosis}</p>
              {code && (
                <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-mono font-semibold text-accent">
                  {code}
                </span>
              )}
              {vehicleStr && (
                <p className="text-sm text-primary-foreground/60 mt-1">
                  <Car className="inline h-3.5 w-3.5 mr-1" />
                  {vehicleStr}
                </p>
              )}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Step 1: ZIP Code */}
      {!estimate && !isEstimating && (
        <section className="section-padding bg-background">
          <div className="container-wrenchli max-w-lg">
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold">Enter Your ZIP Code</h2>
                    <p className="text-sm text-muted-foreground">We'll estimate costs for shops in your area</p>
                  </div>
                </div>

                <Input
                  placeholder="ZIP code (e.g., 48201)"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="h-12 text-lg text-center font-mono tracking-widest"
                  maxLength={5}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && handleGetEstimate()}
                />

                <Button
                  onClick={handleGetEstimate}
                  disabled={zipCode.length !== 5}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Get Cost Estimate
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Free • No account required • Powered by AI
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Loading */}
      {isEstimating && (
        <section className="section-padding bg-background">
          <div className="container-wrenchli max-w-lg text-center">
            <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
              <h3 className="font-heading text-lg font-semibold">Estimating Repair Costs</h3>
              <p className="text-sm text-muted-foreground">
                Analyzing labor rates, parts costs, and regional pricing for your area...
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {estimateError && (
        <section className="section-padding bg-background">
          <div className="container-wrenchli max-w-lg text-center">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <AlertCircle className="mx-auto h-6 w-6 text-destructive mb-2" />
              <p className="text-sm text-destructive">{estimateError}</p>
              <Button onClick={handleGetEstimate} variant="outline" size="sm" className="mt-4 border-destructive text-destructive hover:bg-destructive/10">
                Try Again
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Estimate Results */}
      {estimate && !submitted && (
        <section className="section-padding bg-background">
          <div className="container-wrenchli max-w-3xl space-y-6">
            <SectionReveal>
              {/* Cost estimate card */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{estimate.metro_area}</span>
                </div>

                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Repair Cost</p>
                  <p className="font-heading text-4xl md:text-5xl font-extrabold text-accent">
                    ${estimate.cost_low.toLocaleString()} – ${estimate.cost_high.toLocaleString()}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                    <Wrench className="h-5 w-5 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Parts</p>
                    <p className="font-semibold text-sm">{estimate.parts_estimate}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                    <DollarSign className="h-5 w-5 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Labor</p>
                    <p className="font-semibold text-sm">{estimate.labor_estimate}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center space-y-1">
                    <Clock className="h-5 w-5 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="font-semibold text-sm">{estimate.labor_hours}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">What to Expect</h4>
                    <p className="text-foreground">{estimate.what_to_expect}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Regional Notes</h4>
                    <p className="text-foreground">{estimate.regional_notes}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Typical Warranty</h4>
                    <p className="text-foreground">{estimate.warranty_note}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-xs text-muted-foreground text-center">
                  <Shield className="inline h-3.5 w-3.5 mr-1 text-accent" />
                  This estimate is transparent — any shop you're referred to will see these same numbers.
                </div>

                {/* Financing interest — post-estimate */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-start gap-3">
                  <Checkbox
                    id="financing-estimate"
                    checked={financingInterested}
                    onCheckedChange={(checked) => setFinancingInterested(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="financing-estimate" className="cursor-pointer space-y-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <CreditCard className="h-4 w-4 text-accent" />
                      I'm interested in financing this repair
                    </span>
                    <p className="text-xs text-muted-foreground">
                      We're building flexible payment options. Check this box and we'll notify you when financing is available in your area.
                    </p>
                  </label>
                </div>
              </div>
            </SectionReveal>

            {/* Step 3: Request referral */}
            <SectionReveal delay={200}>
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4">
                <h3 className="font-heading text-lg font-bold">Ready to Connect with a Shop?</h3>
                <p className="text-sm text-muted-foreground">
                  Share your contact info and we'll connect you with a vetted repair shop in your area. They'll see your diagnosis and this cost estimate — no surprises.
                </p>

                <div className="space-y-3">
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-base"
                  />
                  <Input
                    placeholder="Email address *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                  <Input
                    placeholder="Phone number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-base"
                  />
                  <Textarea
                    placeholder="Any additional notes for the shop? (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-base min-h-[80px]"
                  />

                  {/* Financing interest — referral stage */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-3">
                    <Checkbox
                      id="financing-referral"
                      checked={financingInterested}
                      onCheckedChange={(checked) => setFinancingInterested(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="financing-referral" className="cursor-pointer text-sm text-muted-foreground">
                      <CreditCard className="inline h-3.5 w-3.5 mr-0.5 text-accent" /> I'm interested in financing options for this repair
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleRequestReferral}
                  disabled={isSubmitting || !email.trim()}
                  className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Request Shop Referral
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  We'll match you with a trusted local shop. No spam, no obligation.
                </p>
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* Success state */}
      {submitted && (
        <section className="section-padding bg-background">
          <div className="container-wrenchli max-w-lg text-center">
            <SectionReveal>
              <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
                <CheckCircle className="h-12 w-12 text-wrenchli-green mx-auto" />
                <h2 className="font-heading text-2xl font-bold">You're All Set!</h2>
                <p className="text-muted-foreground">
                  We've received your quote request. A trusted shop in the {estimate?.metro_area || "your area"} will reach out soon with a final quote based on the estimate you saw.
                </p>
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-sm">
                  <p className="font-semibold text-foreground">What happens next:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>A vetted shop will review your diagnosis and estimate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>They'll contact you with a final quote — usually within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>No obligation — you decide if the price is right</span>
                    </li>
                  </ul>
                </div>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </SectionReveal>
          </div>
        </section>
      )}
    </main>
  );
}
