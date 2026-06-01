import { Info } from "lucide-react";

/**
 * Locked AI disclaimer — text must appear VERBATIM on every render of the
 * Results Shown (Step 4) and Recommendation Shown (Step 5) screens, including
 * on refresh, browser back, and returning to a saved assessment. Do not alter
 * any word. Do not gate behind a toggle.
 */
export const ASSESSMENT_DISCLAIMER_TEXT =
  "Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician.";

export default function AssessmentDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Assessment disclaimer"
      className="mt-2 rounded-lg p-4 flex gap-3"
      style={{ background: "#0F1117", border: "1px solid #2A2D37" }}
    >
      <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#9CA3AF" }} aria-hidden="true" />
      <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
        {ASSESSMENT_DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
