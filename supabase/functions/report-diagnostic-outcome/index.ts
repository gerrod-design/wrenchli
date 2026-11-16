// supabase/functions/report-diagnostic-outcome/index.ts
// ============================================================
// WRENCHLI — Edge Function: Report Diagnostic Outcome (Stage 5)
// Uses semantic similarity scoring via Claude, NOT string matching.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
// The MATCH rubric is single-sourced in _shared/accuracy-match.ts
// (extracted verbatim from this function in Brief 4, 2026-11-15)
// and shared with grade-referral-outcome. Never copy it back here.
import {
  scoreDiagnosisMatch,
  unverifiedMatchResult,
  type SemanticMatchResult,
} from "../_shared/accuracy-match.ts";


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

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── 1. Parse input ─────────────────────────────────────
    let outcome: OutcomeInput;
    try {
      outcome = await req.json() as OutcomeInput;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!outcome.session_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (outcome.shop_visit !== undefined && typeof outcome.shop_visit !== "boolean") {
      return new Response(
        JSON.stringify({ error: "shop_visit must be a boolean" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      outcome.problem_fixed !== undefined &&
      !["yes", "no", "partial"].includes(outcome.problem_fixed)
    ) {
      return new Response(
        JSON.stringify({ error: "problem_fixed must be one of: yes, no, partial" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      outcome.actual_cost !== undefined &&
      (typeof outcome.actual_cost !== "number" ||
        !Number.isFinite(outcome.actual_cost) ||
        outcome.actual_cost < 0)
    ) {
      return new Response(
        JSON.stringify({ error: "actual_cost must be a non-negative number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Fetch the original diagnosis from Supabase ──────
    const { data: sessionData, error: sessionError } = await supabase
      .from("diagnostic_sessions")
      // Keep this select on ONE line: the previous multiline string silently
      // resolved both diagnoses embeds to null (measured against PostgREST),
      // which kept the accuracy path (§4–§5) from ever running.
      .select("id, user_id, vehicle_id, diagnoses(id, confidence, urgency, explanation), possible_causes:diagnoses(possible_causes(name, probability, sort_order)), vehicles(make, model, year)")
      .eq("id", outcome.session_id)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The diagnoses relationship is one-to-one (UNIQUE session_id), so both
    // embeds come back as single objects, not arrays — normalize before use.
    const diagnosis = Array.isArray(sessionData.diagnoses)
      ? sessionData.diagnoses[0]
      : sessionData.diagnoses;
    const causesEmbed = Array.isArray(sessionData.possible_causes)
      ? sessionData.possible_causes[0]
      : sessionData.possible_causes;
    const allCauses = causesEmbed?.possible_causes ?? [];
    const vehicle = sessionData.vehicles;

    // ── 3. Save outcome report ─────────────────────────────
    // outcome_reports was redesigned after this function was written; its
    // original columns no longer exist. Map this pipe's contract onto
    // the live design — repair_status / invoice_amount_cents / shop_ref /
    // notes — instead of inserting columns that are not there (Batch 7,
    // 2026-10-20). Structured actuals also live in diagnostic_accuracy (§5).
    const notesParts: string[] = [];
    if (outcome.actual_diagnosis) {
      notesParts.push(`Shop finding: ${outcome.actual_diagnosis}`);
    }
    if (outcome.shop_feedback) {
      notesParts.push(`Shop feedback: ${outcome.shop_feedback}`);
    }
    if (outcome.no_visit_reason) {
      notesParts.push(`No-visit reason: ${outcome.no_visit_reason}`);
    }
    if (outcome.diy_notes) {
      notesParts.push(`DIY notes: ${outcome.diy_notes}`);
    }
    if (outcome.repair_date) {
      notesParts.push(`Repair date: ${outcome.repair_date}`);
    }
    if (outcome.problem_fixed === "partial") {
      // The live repair_status vocabulary (fixed / still_same / worse) has
      // no partial value; leave repair_status null and keep the raw answer.
      notesParts.push(
        "Problem fixed: partial (no partial value in the repair_status vocabulary)"
      );
    }
    const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

    const repairStatus =
      outcome.problem_fixed === "yes"
        ? "fixed"
        : outcome.problem_fixed === "no"
          ? "still_same"
          : null;

    const invoiceAmountCents =
      outcome.actual_cost != null ? Math.round(outcome.actual_cost * 100) : null;

    const { data: outcomeRecord, error: outcomeError } = await supabase
      .from("outcome_reports")
      .insert({
        session_id: outcome.session_id,
        user_id: sessionData.user_id ?? null,
        repair_status: repairStatus,
        invoice_amount_cents: invoiceAmountCents,
        shop_ref: outcome.shop_name ?? null,
        collection_channel: "in_product",
        notes,
      })
      .select()
      .single();

    if (outcomeError) throw outcomeError;

    // ── 4. Compute semantic accuracy match ─────────────────
    let matchResult: SemanticMatchResult;
    const canScore = outcome.shop_visit && outcome.actual_diagnosis && diagnosis;

    if (canScore) {
      const sortedCauses = [...allCauses].sort((a: any, b: any) => a.sort_order - b.sort_order);
      const topCause = sortedCauses[0]?.name ?? "Unknown";
      const allCauseNames = sortedCauses.map((c: any) => c.name);

      // Single-source rubric: prompt, scoring call, and response
      // parsing all live in _shared/accuracy-match.ts.
      matchResult = await scoreDiagnosisMatch({
        topCause,
        allCauseNames,
        confidence: diagnosis.confidence,
        explanation: diagnosis.explanation,
        actualDiagnosis: outcome.actual_diagnosis,
        problemFixed: outcome.problem_fixed,
        vehicleYear: vehicle?.year,
        vehicleMake: vehicle?.make,
        vehicleModel: vehicle?.model,
      });
    } else {
      matchResult = unverifiedMatchResult(
        outcome.shop_visit
          ? "Outcome recorded without a specific shop diagnosis."
          : "No shop visit reported. Accuracy cannot be measured.",
      );
    }

    // ── 5. Save accuracy record ────────────────────────────
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
