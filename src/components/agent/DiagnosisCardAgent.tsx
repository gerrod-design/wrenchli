import { CheckCircle, AlertTriangle, Info, ChevronRight, Brain, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AgentDiagnosis } from "./types";

interface DiagnosisCardAgentProps {
  diagnosis: AgentDiagnosis;
  onApprove: (selectedDiagnosis: string) => void;
  onRequestReview: () => void;
}

const urgencyConfig = {
  low: { color: "text-accent", bg: "bg-accent/10", label: "Low Urgency", icon: Info },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Medium Urgency", icon: AlertTriangle },
  high: { color: "text-destructive", bg: "bg-destructive/10", label: "High Urgency", icon: AlertTriangle },
};

export default function DiagnosisCardAgent({ diagnosis, onApprove, onRequestReview }: DiagnosisCardAgentProps) {
  const urgency = urgencyConfig[diagnosis.urgency] || urgencyConfig.medium;
  const UrgencyIcon = urgency.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          <Brain className="h-4 w-4" />
          Step 2 of 5: Review Diagnosis
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          Your AI Diagnosis
        </h2>
        {diagnosis.trackingNumber && (
          <p className="text-xs text-muted-foreground mt-1">
            Tracking: {diagnosis.trackingNumber}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {/* Primary Diagnosis */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2", urgency.bg, urgency.color)}>
                <UrgencyIcon className="h-3 w-3" />
                {urgency.label}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {diagnosis.primaryDiagnosis}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-accent">
                {diagnosis.primaryConfidence}%
              </div>
              <span className="text-xs text-muted-foreground">confidence</span>
            </div>
          </div>

          <Progress value={diagnosis.primaryConfidence} className="h-2 mb-4" />

          {/* Rationale */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <BarChart3 className="h-4 w-4 text-accent" />
              Why this diagnosis?
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {diagnosis.rationale}
            </p>
          </div>

          {/* Historical data */}
          {diagnosis.historicalData && diagnosis.historicalData.totalCases > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 mb-4">
              <BarChart3 className="h-3.5 w-3.5 text-accent shrink-0" />
              Based on {diagnosis.historicalData.totalCases.toLocaleString()} tracked repair cases • {diagnosis.historicalData.successRate}% network diagnostic accuracy
            </div>
          )}

          {/* Cost estimate */}
          <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
            <div>
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <div className="text-xl font-bold text-foreground">
                ${diagnosis.costEstimate.min.toLocaleString()} – ${diagnosis.costEstimate.max.toLocaleString()}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground max-w-[200px]">
              {diagnosis.costEstimate.breakdown}
            </div>
          </div>

          {/* Confidence warning */}
          {diagnosis.confidenceWarning && (
            <div className="mt-4 flex items-start gap-2 bg-amber-500/10 rounded-xl p-3 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {diagnosis.confidenceWarning}
            </div>
          )}
        </div>

        {/* Alternative Diagnoses */}
        {diagnosis.alternativeDiagnoses.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Other Possibilities</h4>
            <div className="space-y-3">
              {diagnosis.alternativeDiagnoses.map((alt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 text-right">
                    <span className="text-sm font-bold text-foreground">{alt.probability}%</span>
                  </div>
                  <Progress value={alt.probability} className="h-1.5 flex-1" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{alt.diagnosis}</span>
                    <p className="text-xs text-muted-foreground truncate">{alt.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended action */}
        <div className="bg-accent/5 rounded-2xl border border-accent/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-accent mb-1">
            <CheckCircle className="h-4 w-4" />
            Recommended Next Step
          </div>
          <p className="text-sm text-foreground">{diagnosis.recommendedAction}</p>
        </div>

        {/* Decision buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => onApprove(diagnosis.primaryDiagnosis)}
            size="lg"
            className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Accept & Find Shops
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          {diagnosis.primaryConfidence < 70 && (
            <Button
              onClick={onRequestReview}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Request Specialist Review
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            You're in control — nothing happens until you approve each step.
          </p>
        </div>
      </div>
    </div>
  );
}
