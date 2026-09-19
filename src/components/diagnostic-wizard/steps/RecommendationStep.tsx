import { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, RotateCcw, Wrench, Clock, ShoppingCart, AlertTriangle, MapPin } from "lucide-react";
import type { VehicleData, DiagnosisResult, RecommendationResult } from "../DiagnosticWizard";
import { showDIY } from "@/lib/diyVisibility";
import { buildAmazonSearchLink } from "@/data/adRecommendations";
import { trackAdClick } from "@/lib/adClickTracker";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import DIYOutcomePrompt from "./DIYOutcomePrompt";
import SaveAssessmentPrompt from "@/components/diagnosis/SaveAssessmentPrompt";
import RecallEmailCapture from "@/components/diagnosis/RecallEmailCapture";
import AssessmentDisclaimer from "@/components/diagnosis/AssessmentDisclaimer";

interface Props {
  recommendation: RecommendationResult;
  diagnosis: DiagnosisResult;
  vehicle: VehicleData;
  sessionId: string;
  onRestart: () => void;
}

export default function RecommendationStep({ recommendation, diagnosis, vehicle, sessionId, onRestart }: Props) {
  const diyEligible = showDIY(diagnosis.urgency, diagnosis.possible_causes);
  const topDIYCause = diyEligible
    ? diagnosis.possible_causes.find(
        (c) => c.diy_difficulty === "easy" || c.diy_difficulty === "moderate"
      )
    : null;

  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Backend-provided DIY vs. shop cost comparison (generate-recommendation).
  // comparison_lines may arrive nested under cost_comparison or top-level;
  // each side may be a string array or a newline-separated string.
  const toLines = (v: string[] | string | null | undefined): string[] =>
    Array.isArray(v) ? v : typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const costComparison = recommendation.cost_comparison ?? null;
  const rawLines = costComparison?.comparison_lines ?? recommendation.comparison_lines ?? null;
  const diyLines = toLines(rawLines?.diy);
  const shopLines = toLines(rawLines?.shop);
  const showDiyColumn = !!costComparison?.diy_available && diyLines.length > 0;
  const showComparison = !!costComparison && (diyLines.length > 0 || shopLines.length > 0);
  // Authoritative DIY time from the backend — replaces the old locally derived estimate.
  const diyTime = recommendation.diy_time ?? null;

  // Check if outcome prompt should show (session older than 3 days)
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeExists, setOutcomeExists] = useState(true);

  useEffect(() => {
    // We show the outcome prompt as a demo in design-preview;
    // in production this would check session.created_at and outcome_reports
    if (diyEligible && sessionId) {
      setShowOutcome(true);
      setOutcomeExists(false);
    }
  }, [diyEligible, sessionId]);

  const handlePartsClick = (partName: string, destination: string, url: string) => {
    trackAdClick({
      click_type: "diy_parts",
      item_title: partName,
      part_name: partName,
      destination,
      session_id: sessionId,
      vehicle_year: String(vehicle.year),
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

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

      {/* Get This Fixed CTA — urgency-gated */}
      {(diagnosis.urgency === "immediate" || diagnosis.urgency === "soon") && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "#E07B3910", border: "1px solid #E07B39" }}>
          <h4 className="text-sm font-heading font-bold" style={{ color: "#F5F5F5" }}>
            Ready to get this fixed?
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
            Take your Wrenchli assessment to a qualified repair shop. You'll walk in knowing what's likely wrong and what it should cost — no sticker shock.
          </p>
          <a
            href="/find-shops"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "#E07B39", color: "#0F1117" }}
          >
            <MapPin className="h-4 w-4" />
            Find a Shop Near Me
          </a>
        </div>
      )}
      {diagnosis.urgency === "schedule" && (
        <div className="rounded-lg p-3" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
            When you're ready, bring your assessment to a qualified shop.{" "}
            <a href="/find-shops" className="underline font-medium" style={{ color: "#E07B39" }}>
              Find a Shop
            </a>
          </p>
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

      {/* DIY vs. Shop cost comparison — backend-provided, side-by-side */}
      {showComparison && (
        <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
          <div className="text-xs font-mono mb-3" style={{ color: "#E07B39" }}>DIY VS. SHOP</div>
          <div className={`grid gap-3 ${showDiyColumn ? "grid-cols-2" : "grid-cols-1"}`}>
            {showDiyColumn && (
              <div className="rounded-lg p-3" style={{ background: "#22C55E10", border: "1px solid #22C55E40" }}>
                <div className="text-xs font-bold mb-2" style={{ color: "#22C55E" }}>DO IT YOURSELF</div>
                <ul className="space-y-1">
                  {diyLines.map((line, i) => (
                    <li key={i} className="text-xs" style={{ color: "#F5F5F5" }}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {shopLines.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: "#E07B3910", border: "1px solid #E07B3940" }}>
                <div className="text-xs font-bold mb-2" style={{ color: "#E07B39" }}>LOCAL SHOP</div>
                <ul className="space-y-1">
                  {shopLines.map((line, i) => (
                    <li key={i} className="text-xs" style={{ color: "#F5F5F5" }}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIY Option Card — only when eligible */}
      {diyEligible && topDIYCause && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "#0F1117", border: "1px solid #22C55E40" }}>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" style={{ color: "#22C55E" }} />
            <div className="text-xs font-mono" style={{ color: "#22C55E" }}>DIY OPTION</div>
          </div>

          <div>
            <p className="text-sm font-medium" style={{ color: "#F5F5F5" }}>{topDIYCause.name}</p>
            {topDIYCause.notes && (
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{topDIYCause.notes}</p>
            )}
          </div>

          {/* Difficulty badge + time estimate */}
          <div className="flex items-center gap-3">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{
                background: topDIYCause.diy_difficulty === "easy" ? "#22C55E20" : "#F59E0B20",
                color: topDIYCause.diy_difficulty === "easy" ? "#22C55E" : "#F59E0B",
                border: `1px solid ${topDIYCause.diy_difficulty === "easy" ? "#22C55E40" : "#F59E0B40"}`,
              }}
            >
              {topDIYCause.diy_difficulty === "easy" ? "Easy" : "Moderate"}
            </span>
            {diyTime && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                <Clock className="h-3 w-3" />
                {diyTime}
              </span>
            )}
          </div>

          {/* Parts links */}
          {recommendation.parts_likely_needed.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-mono" style={{ color: "#E07B39" }}>ORDER PARTS</p>
              {recommendation.parts_likely_needed.map((part, i) => {
                const amazonUrl = buildAmazonSearchLink(part, vehicleStr);
                const rockautoUrl = `https://www.rockauto.com/en/catalog/${vehicle.make.toLowerCase()},${vehicle.model.toLowerCase()},${vehicle.year}`;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <ShoppingCart className="h-3 w-3 shrink-0" style={{ color: "#E07B39" }} />
                    <span style={{ color: "#F5F5F5" }}>{part}</span>
                    <button
                      onClick={() => handlePartsClick(part, "amazon", amazonUrl)}
                      className="underline ml-auto"
                      style={{ color: "#F59E0B" }}
                    >
                      Amazon
                    </button>
                    <button
                      onClick={() => handlePartsClick(part, "rockauto", rockautoUrl)}
                      className="underline"
                      style={{ color: "#3B82F6" }}
                    >
                      RockAuto
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <AffiliateDisclosure />

          {/* Safety disclaimer */}
          <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid #2A2D3750" }}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
            <p className="text-[11px]" style={{ color: "#6B7280" }}>
              Wrenchli is not a licensed mechanic. This is informational only. If you are not confident performing this repair, take your vehicle to a qualified shop.
            </p>
          </div>
        </div>
      )}

      {/* Shop Transparency */}
      <div className="rounded-lg p-4" style={{ background: "#0F1117", border: "1px solid #2A2D37" }}>
        <h4 className="text-xs font-mono mb-2" style={{ color: "#E07B39" }}>ABOUT SHOP MATCHING</h4>
        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
          {recommendation.shop_matching_note ?? "Shop matching is currently paused — Wrenchli has no partner shops. When the shop track reopens, partner shops will earn placement through verified repair outcomes, not paid placement."}
        </p>
      </div>

      {/* DIY Outcome Capture */}
      {diyEligible && showOutcome && !outcomeExists && (
        <DIYOutcomePrompt sessionId={sessionId} />
      )}

      {/* Recall Email Capture — delayed prompt for guests */}
      <RecallEmailCapture
        vehicleYear={vehicle.year}
        vehicleMake={vehicle.make}
        vehicleModel={vehicle.model}
        sessionId={sessionId}
      />

      {/* Deferred Account Creation */}
      <SaveAssessmentPrompt />

      <AssessmentDisclaimer />

      {/* Restart */}
      <button
        onClick={onRestart}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium"
        style={{ background: "#0F1117", border: "1px solid #2A2D37", color: "#9CA3AF" }}
      >
        <RotateCcw className="h-4 w-4" />
        Start New Assessment
      </button>
    </div>

  );
}
