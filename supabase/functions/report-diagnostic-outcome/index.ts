// supabase/functions/report-diagnostic-outcome/index.ts
// ============================================================
// WRENCHLI — Edge Function: Report Diagnostic Outcome (Stage 5)
// Uses semantic similarity scoring via Claude, NOT string matching.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ────────────────────────────────────────────────────

interface OutcomeInput {
  session_id: string;
  shop_visit: boolean;
  actual_diagnosis?: string;
  actual_cost?: number;
  problem_fixed?: "yes" | "no" | "partial";
  repair_date?: string;
  shop_name?: string;
  shop_feedback?: string;
  no_visit_reason?: string;
  diy_notes?: string;
}

interface SemanticMatchResult {
  accuracy_score: number;
  match_label: "exact" | "close" | "partial" | "miss" | "unverified";
  match_explanation: string;
  confidence_was_correct: boolean;
  symptom_category: string;
}

// ── Semantic Match System Prompt ─────────────────────────────

const MATCH_SYSTEM_PROMPT = `You are an automotive diagnostic expert evaluating how accurately a predicted diagnosis matched the actual shop finding.

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

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 1. Parse input ─────────────────────────────────────
    const outcome = await req.json() as OutcomeInput;

    if (!outcome.session_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fetch the original diagnosis from Supabase ──────
    const { data: sessionData, error: sessionError } = await supabase
      .from("diagnostic_sessions")
      .select(`
        id,
        vehicle_id,
        diagnoses (
          id,
          confidence,
          urgency,
          explanation
        ),
        possible_causes:diagnoses (
          possible_causes (
            name,
            probability,
            sort_order
          )
        ),
        vehicles (
          make,
          model,
          year
        )
      `)
      .eq("id", outcome.session_id)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagnosis = sessionData.diagnoses?.[0];
    const vehicle = sessionData.vehicles;

    // ── 3. Save outcome report ─────────────────────────────
    const { data: outcomeRecord, error: outcomeError } = await supabase
      .from("outcome_reports")
      .insert({
        session_id: outcome.session_id,
        shop_visit: outcome.shop_visit,
        actual_diagnosis: outcome.actual_diagnosis ?? null,
        actual_cost: outcome.actual_cost ?? null,
        problem_fixed: outcome.problem_fixed ?? null,
        repair_date: outcome.repair_date ?? null,
        shop_name: outcome.shop_name ?? null,
        shop_feedback: outcome.shop_feedback ?? null,
        no_visit_reason: outcome.no_visit_reason ?? null,
        diy_notes: outcome.diy_notes ?? null,
      })
      .select()
      .single();

    if (outcomeError) throw outcomeError;

    // ── 4. Compute semantic accuracy match ─────────────────
    let matchResult: SemanticMatchResult;
    const canScore = outcome.shop_visit && outcome.actual_diagnosis && diagnosis;

    if (canScore) {
      const allCauses = sessionData.possible_causes?.[0]?.possible_causes ?? [];
      const sortedCauses = [...allCauses].sort((a: any, b: any) => a.sort_order - b.sort_order);
      const topCause = sortedCauses[0]?.name ?? "Unknown";
      const allCauseNames = sortedCauses.map((c: any) => c.name);

      const matchPrompt = `
Predicted diagnosis:
- Top predicted cause: ${topCause}
- All predicted causes: ${allCauseNames.join(", ")}
- Prediction confidence: ${diagnosis.confidence}
- Wrenchli explanation: ${diagnosis.explanation}

Actual shop finding:
- What the shop found: ${outcome.actual_diagnosis}
- Problem fixed: ${outcome.problem_fixed}

Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}

Score this diagnostic accuracy.`.trim();

      const aiResponse = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          system: MATCH_SYSTEM_PROMPT,
          messages: [{ role: "user", content: matchPrompt }],
        }),
      });

      if (!aiResponse.ok) throw new Error(`AI service error: ${aiResponse.status}`);

      const aiData = await aiResponse.json();
      const rawText = aiData.content?.[0]?.text ?? "";

      try {
        matchResult = JSON.parse(rawText);
      } catch {
        matchResult = {
          accuracy_score: 0.5,
          match_label: "unverified",
          match_explanation: "Outcome recorded. Accuracy scoring unavailable.",
          confidence_was_correct: false,
          symptom_category: "other",
        };
      }
    } else {
      matchResult = {
        accuracy_score: 0,
        match_label: "unverified",
        match_explanation: outcome.shop_visit
          ? "Outcome recorded without a specific shop diagnosis."
          : "No shop visit reported. Accuracy cannot be measured.",
        confidence_was_correct: false,
        symptom_category: "other",
      };
    }

    // ── 5. Save accuracy record ────────────────────────────
    const allCauses = sessionData.possible_causes?.[0]?.possible_causes ?? [];
    const sortedCauses = [...allCauses].sort((a: any, b: any) => a.sort_order - b.sort_order);

    const { error: accuracyError } = await supabase
      .from("diagnostic_accuracy")
      .insert({
        session_id: outcome.session_id,
        outcome_report_id: outcomeRecord.id,
        predicted_top_cause: sortedCauses[0]?.name ?? "Unknown",
        predicted_causes_all: sortedCauses.map((c: any) => c.name),
        predicted_confidence: diagnosis?.confidence ?? "low",
        predicted_urgency: diagnosis?.urgency ?? "monitor",
        actual_diagnosis: outcome.actual_diagnosis ?? null,
        accuracy_score: canScore ? matchResult.accuracy_score : null,
        match_label: matchResult.match_label,
        match_explanation: matchResult.match_explanation,
        confidence_was_correct: matchResult.confidence_was_correct,
        vehicle_make: vehicle?.make ?? null,
        vehicle_model: vehicle?.model ?? null,
        symptom_category: matchResult.symptom_category,
      });

    if (accuracyError) throw accuracyError;

    // ── 6. Mark session as outcome_reported ───────────────
    await supabase
      .from("diagnostic_sessions")
      .update({ status: "outcome_reported" })
      .eq("id", outcome.session_id);

    await supabase
      .from("outcome_reminders")
      .update({ completed_at: new Date().toISOString() })
      .eq("session_id", outcome.session_id);

    // ── 7. Return result for UI display ───────────────────
    return new Response(
      JSON.stringify({
        outcome_id: outcomeRecord.id,
        accuracy_score: matchResult.accuracy_score,
        match_label: matchResult.match_label,
        match_explanation: matchResult.match_explanation,
        confidence_was_correct: matchResult.confidence_was_correct,
        display: {
          badge_color: getBadgeColor(matchResult.match_label),
          badge_text: getBadgeText(matchResult.match_label),
          thank_you_message: getThankYouMessage(matchResult.match_label, outcome.shop_visit),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("report-diagnostic-outcome error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Display Helpers ───────────────────────────────────────────

function getBadgeColor(label: string): string {
  switch (label) {
    case "exact":       return "green";
    case "close":       return "green";
    case "partial":     return "amber";
    case "miss":        return "red";
    default:            return "gray";
  }
}

function getBadgeText(label: string): string {
  switch (label) {
    case "exact":       return "Accurate Diagnosis";
    case "close":       return "Close Match";
    case "partial":     return "Partial Match";
    case "miss":        return "Missed";
    default:            return "Recorded";
  }
}

function getThankYouMessage(label: string, shopVisit: boolean): string {
  if (!shopVisit) {
    return "Thanks for the update. We'll check back if anything changes.";
  }
  switch (label) {
    case "exact":
    case "close":
      return "Thanks — that's a match. This helps us get better for everyone.";
    case "partial":
      return "Thanks for reporting. Partial matches help us improve our confidence scoring.";
    case "miss":
      return "Thanks for telling us. Misses are our most valuable data — we'll learn from this.";
    default:
      return "Thanks for reporting your outcome. Every submission makes Wrenchli better.";
  }
}
