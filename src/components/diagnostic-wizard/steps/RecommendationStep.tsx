import { CheckCircle2, ChevronRight, RotateCcw, Wrench } from "lucide-react";
import type { VehicleData, DiagnosisResult, RecommendationResult } from "../DiagnosticWizard";

interface Props {
  recommendation: RecommendationResult;
  diagnosis: DiagnosisResult;
  vehicle: VehicleData;
  onRestart: () => void;
}

export default function RecommendationStep({ recommendation, diagnosis, vehicle, onRestart }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono mb-1" style={{ color: "#E07B39" }}>STEP 4 — YOUR PLAN</div>
        <h3 className="text-lg font-semibold" style={{ color: "#F5F5F5" }}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
      </div>

      {/* Primary action */}
      <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "#E07B3915", border: "1px solid #E07B39" }}>
        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#E07B39" }} />
        <p className="text-sm font-medium" style={{ color: "#F5F5F5" }}>{recommendation.action}</p>
      </div>

      {/* Next steps */}
      <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
        <div className="text-xs font-mono mb-3" style={{ color: "#E07B39" }}>NEXT STEPS</div>
        <ol className="space-y-2">
          {recommendation.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9CA3AF" }}>
              <span className="flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold shrink-0 mt-0.5" style={{ background: "#E07B3920", color: "#E07B39" }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Questions for mechanic */}
      {recommendation.questions_to_ask_mechanic.length > 0 && (
        <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
          <div className="text-xs font-mono mb-3" style={{ color: "#E07B39" }}>QUESTIONS FOR YOUR MECHANIC</div>
          <ul className="space-y-2">
            {recommendation.questions_to_ask_mechanic.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9CA3AF" }}>
                <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#E07B39" }} />
                "{q}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parts needed */}
      {recommendation.parts_likely_needed.length > 0 && (
        <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
          <div className="text-xs font-mono mb-3" style={{ color: "#E07B39" }}>PARTS LIKELY NEEDED</div>
          <div className="flex flex-wrap gap-2">
            {recommendation.parts_likely_needed.map((part, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "#2A2D37", color: "#F5F5F5" }}>
                <Wrench className="h-3 w-3" style={{ color: "#E07B39" }} />
                {part}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium"
        style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
      >
        <RotateCcw className="h-4 w-4" />
        Start New Diagnosis
      </button>
    </div>
  );
}
