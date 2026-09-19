import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, DiagnosisResult, RecommendationResult } from "../DiagnosticWizard";
import AssessmentDisclaimer from "@/components/diagnosis/AssessmentDisclaimer";
import { showDIY } from "@/lib/diyVisibility";


interface Props {
  diagnosis: DiagnosisResult;
  vehicle: VehicleData;
  sessionId: string;
  onNext: (recommendation: RecommendationResult) => void;
  onBack: () => void;
}

const urgencyConfig: Record<string, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  immediate: { label: "IMMEDIATE — DO NOT DRIVE", color: "#EF4444", bg: "#EF444420", icon: AlertTriangle },
  soon: { label: "SOON", color: "#F59E0B", bg: "#F59E0B20", icon: AlertTriangle },
  schedule: { label: "SCHEDULE", color: "#E07B39", bg: "#E07B3920", icon: Clock },
  monitor: { label: "MONITOR", color: "#22C55E", bg: "#22C55E20", icon: Eye },
};

const confidenceConfig: Record<string, { label: string; color: string }> = {
  high: { label: "HIGH CONFIDENCE", color: "#22C55E" },
  medium: { label: "MEDIUM CONFIDENCE", color: "#F59E0B" },
  low: { label: "LOW CONFIDENCE", color: "#EF4444" },
};

const difficultyColors: Record<string, string> = {
  easy: "#22C55E",
  moderate: "#F59E0B",
  professional_only: "#EF4444",
};
const difficultyLabels: Record<string, string> = {
  easy: "DIY Friendly",
  moderate: "Intermediate",
  professional_only: "Shop Required",
};

export default function DiagnosisStep({ diagnosis, vehicle, sessionId, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const u = urgencyConfig[diagnosis.urgency] ?? urgencyConfig.schedule;
  const c = confidenceConfig[diagnosis.confidence] ?? confidenceConfig.medium;
  const diyEligible = showDIY(diagnosis.urgency, diagnosis.possible_causes);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("generate-recommendation", {
        body: {
          session_id: sessionId,
          vehicle,
          diagnosis: {
            confidence: diagnosis.confidence,
            urgency: diagnosis.urgency,
            explanation: diagnosis.explanation,
            possible_causes: diagnosis.possible_causes,
          },
        },
      });

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      onNext(data as RecommendationResult);
    } catch (e: any) {
      setError(e.message || "Failed to generate recommendation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 3 — ASSESSMENT</div>
          <h3 className="text-lg font-semibold truncate" style={{ color: "#F5F5F5" }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <span className="text-xs font-mono px-2 py-1 rounded whitespace-nowrap" style={{ background: c.color + "20", color: c.color }}>
            {c.label}
          </span>
          <span className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded whitespace-nowrap" style={{ background: u.bg, color: u.color }}>
            <u.icon className="h-3 w-3" />
            {u.label}
          </span>
        </div>
      </div>

      {/* Plain-English Summary Card */}
      {diagnosis.possible_causes.length > 0 && (() => {
        const top = diagnosis.possible_causes[0];
        const urgencyText: Record<string, string> = {
          immediate: "This is urgent — do not drive.",
          soon: "This should be fixed soon.",
          schedule: "Schedule a repair when you can.",
          monitor: "You can monitor this for now.",
        };
        return (
          <div
            className="rounded-lg p-4"
            style={{ background: "#E07B3910", borderLeft: "4px solid #E07B39", border: "1px solid #2A2D3750", borderLeftColor: "#E07B39", borderLeftWidth: 4 }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#F5F5F5" }}>
              <span className="font-bold">Most likely your issue is {top.name.toLowerCase()}</span>
              {diagnosis.explanation ? `, based on the symptoms you described` : ""}.{" "}
              {urgencyText[diagnosis.urgency] ?? ""}
            </p>
            <p className="text-[11px] mt-2" style={{ color: "#6B7280" }}>📱 Screenshot this to share with your mechanic</p>
          </div>
        );
      })()}

      {diyEligible && diagnosis.possible_causes[0] && (() => {
        const top = diagnosis.possible_causes[0];
        return (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #2A2D37" }}>
            <div className="px-4 py-2 text-xs font-mono" style={{ background: "#141720", color: "#E07B39" }}>DIY VS. SHOP</div>
            <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#2A2D37" }}>
              <div className="p-4 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "#22C55E" }}>DIY</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Parts: <span style={{ color: "#F5F5F5" }}>${top.diy_parts_cost_low}–${top.diy_parts_cost_high}</span></p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Time: <span style={{ color: "#F5F5F5" }}>{top.diy_time}</span></p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "#E07B39" }}>SHOP</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Parts: <span style={{ color: "#F5F5F5" }}>${top.shop_parts_cost_low}–${top.shop_parts_cost_high}</span></p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Labor: <span style={{ color: "#F5F5F5" }}>${top.shop_labor_cost_low}–${top.shop_labor_cost_high}</span></p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Total: <span style={{ color: "#F5F5F5" }}>${top.estimated_cost_low}–${top.estimated_cost_high}</span></p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Time: <span style={{ color: "#F5F5F5" }}>{top.shop_time}</span></p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Explanation */}
      <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
        <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{diagnosis.explanation}</p>
      </div>

      {/* Causes */}
      <div className="space-y-2">
        {diagnosis.possible_causes.map((cause) => (
          <div key={cause.name} className="rounded-lg p-3" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm" style={{ color: "#F5F5F5" }}>{cause.name}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: (difficultyColors[cause.diy_difficulty] ?? "#6B7280") + "15", color: difficultyColors[cause.diy_difficulty] ?? "#6B7280" }}>
                {difficultyLabels[cause.diy_difficulty] ?? cause.diy_difficulty}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#2A2D37" }}>
              <div className="h-full rounded-full" style={{ width: `${cause.probability * 100}%`, background: "#E07B39" }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: "#6B7280" }}>
              <span>{Math.round(cause.probability * 100)}% likely</span>
              <span>{cause.diy_difficulty === "professional_only" ? `Shop total: $${cause.estimated_cost_low}–$${cause.estimated_cost_high}` : "See comparison above"}</span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleGetRecommendation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "#E07B39", color: "#0F1117" }}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating plan...</>
          ) : (
            <>Get Repair Plan <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>

      <AssessmentDisclaimer />
    </div>
  );

}
