// supabase/functions/_shared/accuracy-match.ts
// ============================================================
// The diagnostic accuracy MATCH rubric — SINGLE SOURCE.
//
// This module is the one and only definition of the semantic
// scoring rubric used to grade a predicted diagnosis against an
// actual finding. It was extracted verbatim from
// report-diagnostic-outcome (Brief 4, 2026-11-15) so that the
// new grade-referral-outcome path grades shop-reported referral
// outcomes with exactly the same rubric as consumer self-report
// outcomes. Two copies of this rubric diverging would silently
// break the accuracy readout; there must never be a second one.
// ============================================================

export interface SemanticMatchResult {
  accuracy_score: number;
  match_label: "exact" | "close" | "partial" | "miss" | "unverified";
  match_explanation: string;
  confidence_was_correct: boolean;
  symptom_category: string;
}

// ── Semantic Match System Prompt ─────────────────────────────

export const MATCH_SYSTEM_PROMPT = `You are an automotive diagnostic expert evaluating how accurately a predicted diagnosis matched the actual shop finding.

Return ONLY valid JSON. No explanation, no markdown:

{
  "accuracy_score": 0.0 to 1.0,
  "match_label": "exact" | "close" | "partial" | "miss" | "unverified",
  "match_explanation": "One plain-English sentence explaining the match.",
  "confidence_was_correct": true | false,
  "symptom_category": "brakes" | "engine" | "electrical" | "transmission" | "suspension" | "cooling" | "fuel" | "exhaust" | "tires" | "ac_heating" | "body" | "other"
}

Scoring rules:
- 1.0 (exact): Same root cause. "Worn brake pads" vs "Brake pads needed replacement" = 1.0
- 0.75-0.99 (close): Same system, related component. "Battery" vs "Alternator" = 0.80 (both charging system). "Brake pads" vs "Brake rotors" = 0.75 (same repair event).
- 0.40-0.74 (partial): Same general area but different issue. "Transmission fluid" vs "Transmission slipping" = 0.50.
- 0.0-0.39 (miss): Different system entirely. "Brake pads" vs "Alternator" = 0.05.
- unverified: No shop visit or no actual_diagnosis provided. Score = null, confidence_was_correct = false.

confidence_was_correct: true if predicted_confidence was "high" AND accuracy_score >= 0.75, OR if predicted_confidence was "low"/"medium" (lower bar, any result is acceptable). false if predicted_confidence was "high" but accuracy_score < 0.75.

symptom_category: categorize based on the PREDICTED diagnosis (or actual if no prediction), not the symptom.

match_explanation example: "Wrenchli predicted worn brake pads. Shop confirmed brake pad and rotor replacement. Strong match — same repair event."
Another: "Wrenchli predicted a battery issue. Shop found a failing alternator. Close match — both are charging system components."`;

// ── Match prompt ─────────────────────────────────────────────

export interface MatchScoreInput {
  topCause: string;
  allCauseNames: string[];
  confidence: string;
  explanation: string;
  actualDiagnosis: string;
  problemFixed?: string;
  vehicleYear?: number | string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export function buildMatchPrompt(input: MatchScoreInput): string {
  return `
Predicted diagnosis:
- Top predicted cause: ${input.topCause}
- All predicted causes: ${input.allCauseNames.join(", ")}
- Prediction confidence: ${input.confidence}
- Wrenchli explanation: ${input.explanation}

Actual shop finding:
- What the shop found: ${input.actualDiagnosis}
- Problem fixed: ${input.problemFixed}

Vehicle: ${input.vehicleYear} ${input.vehicleMake} ${input.vehicleModel}

Score this diagnostic accuracy.`.trim();
}

// ── Response parsing ─────────────────────────────────────────
// The model's reply may sit in a later content block, arrive
// wrapped in markdown fences, or carry prose around the JSON —
// a strict JSON.parse(content[0].text) silently put every
// scored outcome on the 0.5 fallback (measured in Batch 7's
// live acceptance proofs). Keep this extraction robust.

export function parseSemanticMatch(rawText: string): SemanticMatchResult {
  try {
    return JSON.parse(rawText);
  } catch {
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");
    let extracted: SemanticMatchResult | null = null;
    if (start >= 0 && end > start) {
      try {
        extracted = JSON.parse(rawText.slice(start, end + 1));
      } catch {
        extracted = null;
      }
    }
    return extracted ?? {
      accuracy_score: 0.5,
      match_label: "unverified",
      match_explanation: "Outcome recorded. Accuracy scoring unavailable.",
      confidence_was_correct: false,
      symptom_category: "other",
    };
  }
}

// ── The unverified result (no score can be produced) ─────────

export function unverifiedMatchResult(explanation: string): SemanticMatchResult {
  return {
    accuracy_score: 0,
    match_label: "unverified",
    match_explanation: explanation,
    confidence_was_correct: false,
    symptom_category: "other",
  };
}

// ── Scoring call ─────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export interface MatchScoreOptions {
  apiKey?: string;
  model?: string;
  fetchFn?: typeof fetch;
}

function envGet(name: string): string | undefined {
  // Lazy + guarded so this module can also be imported by the
  // Node/Vitest test stack, where the Deno global does not exist.
  const deno = (globalThis as { Deno?: { env?: { get?: (n: string) => string | undefined } } }).Deno;
  return deno?.env?.get?.(name);
}

export async function scoreDiagnosisMatch(
  input: MatchScoreInput,
  options: MatchScoreOptions = {},
): Promise<SemanticMatchResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const aiResponse = await fetchFn(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": options.apiKey ?? envGet("ANTHROPIC_API_KEY") ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model ?? envGet("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6",
      max_tokens: 400,
      system: MATCH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildMatchPrompt(input) }],
    }),
  });

  if (!aiResponse.ok) throw new Error(`AI service error: ${aiResponse.status}`);

  const aiData = await aiResponse.json();
  const rawText = (aiData.content ?? [])
    .filter((b: { type?: string }) => b?.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");

  return parseSemanticMatch(rawText);
}
