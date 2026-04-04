import { useState } from "react";
import { Loader2, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { VehicleData, DiagnosisResult, RecommendationResult } from "../DiagnosticWizard";

interface Props {
  diagnosis: DiagnosisResult;
  vehicle: VehicleData;
  sessionId: string;
  onNext: (recommendation: RecommendationResult) => void;
  onBack: () => void;
}

const urgencyConfig: Record<string, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  immediate: { label: "DO NOT DRIVE", color: "#EF4444", bg: "#EF444420", icon: AlertTriangle },
  soon: { label: "FIX SOON", color: "#F59E0B", bg: "#F59E0B20", icon: AlertTriangle },
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
  professional_only: "Pro Only",
};

export default function DiagnosisStep({ diagnosis, vehicle, sessionId, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const u = urgencyConfig[diagnosis.urgency] ?? urgencyConfig.schedule;
  const c = confidenceConfig[diagnosis.confidence] ?? confidenceConfig.medium;

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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 3 — DIAGNOSIS</div>
          <h3 className="text-lg font-semibold" style={{ color: "#F5F5F5" }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: c.color + "20", color: c.color }}>
            {c.label}
          </span>
          <span className="flex items-center gap-1 text-xs font-mono px-2 py-1 rounded" style={{ background: u.bg, color: u.color }}>
            <u.icon className="h-3 w-3" />
            {u.label}
          </span>
        </div>
      </div>

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
              <span>${cause.estimated_cost_low}–${cause.estimated_cost_high}</span>
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
    </div>
  );
}
