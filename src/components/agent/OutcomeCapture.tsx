import { useState } from "react";
import { Star, CheckCircle, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OutcomeCaptureProps {
  trackingNumber: string;
  originalDiagnosis: string;
  estimatedCost: number;
  shopName: string;
  onDone: () => void;
}

export default function OutcomeCapture({
  trackingNumber, originalDiagnosis, estimatedCost, shopName, onDone
}: OutcomeCaptureProps) {
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [wouldReturn, setWouldReturn] = useState(true);
  const [issuesSinceRepair, setIssuesSinceRepair] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [actualDiagnosis, setActualDiagnosis] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const costNum = actualCost ? parseFloat(actualCost.replace(/[^0-9.]/g, "")) : null;
  const costVariance = costNum !== null ? costNum - estimatedCost : null;
  const costVariancePercent = costNum !== null && estimatedCost > 0
    ? Math.round(((costNum - estimatedCost) / estimatedCost) * 100)
    : null;
  const diagnosisMatch = actualDiagnosis.trim().length > 0
    ? actualDiagnosis.toLowerCase().includes(originalDiagnosis.toLowerCase().split(" ")[0])
    : null;

  const handleSubmit = async () => {
    if (satisfaction === 0) {
      toast.error("Please rate your experience");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the diagnosis record by tracking number
      const { data: diagRecord } = await supabase
        .from("diagnosis_records")
        .select("id, selected_shop_id")
        .eq("tracking_number", trackingNumber)
        .single();

      if (!diagRecord) {
        toast.error("Could not find your diagnosis record. Please contact support.");
        return;
      }

      const { error } = await supabase.from("repair_outcomes").insert({
        diagnosis_record_id: diagRecord.id,
        shop_id: diagRecord.selected_shop_id,
        shop_actual_diagnosis: actualDiagnosis || null,
        shop_actual_cost: costNum,
        customer_satisfaction: satisfaction,
        customer_would_return: wouldReturn,
        customer_issues_since_repair: issuesSinceRepair,
        customer_feedback: feedback || null,
        customer_reported_at: new Date().toISOString(),
        diagnosis_match: diagnosisMatch,
        cost_variance: costVariance,
        cost_variance_percent: costVariancePercent,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you! Your feedback helps improve our accuracy.");
    } catch (e) {
      console.error("Outcome submission error:", e);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <CheckCircle className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
          Outcome Recorded
        </h2>
        <p className="text-muted-foreground mb-6">
          Your feedback directly improves our diagnostic accuracy for everyone.
        </p>

        {/* Match summary */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-left space-y-3 mb-6">
          <h3 className="font-bold text-foreground">Repair Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">We recommended</span>
            <span className="font-medium text-foreground">{originalDiagnosis}</span>
          </div>
          {actualDiagnosis && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shop found</span>
              <span className="font-medium text-foreground">{actualDiagnosis}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Diagnosis match</span>
            <span className={cn("font-medium", diagnosisMatch ? "text-accent" : "text-destructive")}>
              {diagnosisMatch === null ? "—" : diagnosisMatch ? "YES ✓" : "NO ✗"}
            </span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">We estimated</span>
            <span className="font-medium text-foreground">${estimatedCost.toLocaleString()}</span>
          </div>
          {costNum !== null && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shop charged</span>
                <span className="font-medium text-foreground">${costNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost variance</span>
                <span className={cn("font-medium", 
                  costVariancePercent !== null && Math.abs(costVariancePercent) <= 10 ? "text-accent" : "text-amber-500"
                )}>
                  {costVariancePercent !== null ? `${costVariancePercent >= 0 ? "+" : ""}${costVariancePercent}%` : "—"}
                </span>
              </div>
            </>
          )}
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your rating</span>
            <span className="text-foreground">{"★".repeat(satisfaction)}{"☆".repeat(5 - satisfaction)}</span>
          </div>
        </div>

        <Button onClick={onDone} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          <CheckCircle className="h-4 w-4" />
          Post-Repair: Report Outcome
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          How Did It Go?
        </h2>
        <p className="text-muted-foreground mt-2">
          Help us improve by reporting what actually happened. This closes the feedback loop.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tracking: {trackingNumber} • Shop: {shopName}
        </p>
      </div>

      <div className="space-y-4">
        {/* What the shop actually found */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-3">What did the shop find?</h3>
          <div className="bg-secondary/30 rounded-lg p-3 mb-3 text-sm">
            <span className="text-muted-foreground">Our diagnosis was: </span>
            <span className="font-medium text-foreground">{originalDiagnosis}</span>
          </div>
          <input
            type="text"
            placeholder="What did the shop actually diagnose? (e.g. Dead battery cell)"
            value={actualDiagnosis}
            onChange={(e) => setActualDiagnosis(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Actual cost */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-3">Final Cost</h3>
          <div className="bg-secondary/30 rounded-lg p-3 mb-3 text-sm">
            <span className="text-muted-foreground">Our estimate was: </span>
            <span className="font-medium text-foreground">${estimatedCost.toLocaleString()}</span>
          </div>
          <input
            type="text"
            placeholder="What did the shop charge? (e.g. 450)"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Satisfaction */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-3">Rate Your Experience</h3>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSatisfaction(n)}
                className="transition-transform hover:scale-110"
              >
                <Star className={cn(
                  "h-10 w-10 transition-colors",
                  n <= satisfaction ? "fill-amber-400 text-amber-400" : "text-border"
                )} />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {satisfaction === 0 ? "Tap to rate" : `${satisfaction}/5 stars`}
          </p>
        </div>

        {/* Quick toggles */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Would you use this shop again?</span>
            <Switch checked={wouldReturn} onCheckedChange={setWouldReturn} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Any issues since repair?</span>
            <Switch checked={issuesSinceRepair} onCheckedChange={setIssuesSinceRepair} />
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-3">Additional Feedback (optional)</h3>
          <Textarea
            placeholder="Anything else you'd like to share about the experience?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="bg-background min-h-[80px] resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || satisfaction === 0}
            size="lg"
            className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSubmitting ? "Submitting..." : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit Outcome Report
              </>
            )}
          </Button>
          <Button onClick={onDone} variant="ghost" className="text-muted-foreground">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
