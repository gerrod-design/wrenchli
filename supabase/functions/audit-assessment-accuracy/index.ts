// supabase/functions/audit-assessment-accuracy/index.ts
// ============================================================
// WRENCHLI — Edge Function: Audit Assessment Accuracy
// Nightly scheduled function (2am EST) that computes accuracy
// breakdowns by symptom_category, vehicle_make, and urgency_level
// from the last 30 days of verified outcomes.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ACCURACY_THRESHOLD = 0.60;

interface AccuracyRow {
  accuracy_score: number | null;
  match_label: string;
  predicted_confidence: string;
  predicted_urgency: string;
  confidence_was_correct: boolean;
  vehicle_make: string | null;
  symptom_category: string | null;
  predicted_top_cause: string;
}

interface CategoryMetrics {
  category: string;
  accuracy_rate: number;
  sample_size: number;
  exact_count: number;
  close_count: number;
  partial_count: number;
  miss_count: number;
}

function computeCategoryMetrics(
  rows: AccuracyRow[],
  keyFn: (r: AccuracyRow) => string | null,
  minSample = 3
): CategoryMetrics[] {
  const groups = new Map<string, AccuracyRow[]>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const results: CategoryMetrics[] = [];
  for (const [category, catRows] of groups.entries()) {
    const scored = catRows.filter((r) => r.accuracy_score !== null);
    if (scored.length < minSample) continue;

    const avgAccuracy =
      scored.reduce((sum, r) => sum + (r.accuracy_score ?? 0), 0) /
      scored.length;

    results.push({
      category,
      accuracy_rate: Math.round(avgAccuracy * 1000) / 1000,
      sample_size: scored.length,
      exact_count: catRows.filter((r) => r.match_label === "exact").length,
      close_count: catRows.filter((r) => r.match_label === "close").length,
      partial_count: catRows.filter((r) => r.match_label === "partial").length,
      miss_count: catRows.filter((r) => r.match_label === "miss").length,
    });
  }

  return results.sort((a, b) => b.sample_size - a.sample_size);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query last 30 days of verified accuracy records
    const { data: rows, error } = await supabase
      .from("diagnostic_accuracy")
      .select(
        "accuracy_score, match_label, predicted_confidence, predicted_urgency, confidence_was_correct, vehicle_make, symptom_category, predicted_top_cause"
      )
      .gte("computed_at", thirtyDaysAgo.toISOString())
      .neq("match_label", "unverified");

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No verified outcomes in last 30 days", rows_written: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = now.toISOString().split("T")[0];
    const upsertRows: Record<string, unknown>[] = [];
    const alertRows: Record<string, unknown>[] = [];

    // ── By Symptom Category ──────────────────────────────
    const bySymptom = computeCategoryMetrics(rows, (r) => r.symptom_category);
    for (const m of bySymptom) {
      upsertRows.push({
        metric_type: "category_breakdown",
        period: "monthly",
        period_start: today,
        dimension_value: `symptom:${m.category}`,
        accuracy_rate: m.accuracy_rate,
        outcomes_count: m.sample_size,
        exact_match_count: m.exact_count,
        close_match_count: m.close_count,
        partial_match_count: m.partial_count,
        miss_count: m.miss_count,
        computed_at: now.toISOString(),
      });
      if (m.accuracy_rate < ACCURACY_THRESHOLD) {
        alertRows.push({
          category: m.category,
          category_type: "symptom_category",
          accuracy_rate: m.accuracy_rate,
          sample_size: m.sample_size,
          alert_date: today,
        });
      }
    }

    // ── By Vehicle Make ──────────────────────────────────
    const byMake = computeCategoryMetrics(rows, (r) => r.vehicle_make);
    for (const m of byMake) {
      upsertRows.push({
        metric_type: "category_breakdown",
        period: "monthly",
        period_start: today,
        dimension_value: `make:${m.category}`,
        accuracy_rate: m.accuracy_rate,
        outcomes_count: m.sample_size,
        exact_match_count: m.exact_count,
        close_match_count: m.close_count,
        partial_match_count: m.partial_count,
        miss_count: m.miss_count,
        computed_at: now.toISOString(),
      });
      if (m.accuracy_rate < ACCURACY_THRESHOLD) {
        alertRows.push({
          category: m.category,
          category_type: "vehicle_make",
          accuracy_rate: m.accuracy_rate,
          sample_size: m.sample_size,
          alert_date: today,
        });
      }
    }

    // ── By Urgency Level ─────────────────────────────────
    const byUrgency = computeCategoryMetrics(rows, (r) => r.predicted_urgency);
    for (const m of byUrgency) {
      upsertRows.push({
        metric_type: "category_breakdown",
        period: "monthly",
        period_start: today,
        dimension_value: `urgency:${m.category}`,
        accuracy_rate: m.accuracy_rate,
        outcomes_count: m.sample_size,
        exact_match_count: m.exact_count,
        close_match_count: m.close_count,
        partial_match_count: m.partial_count,
        miss_count: m.miss_count,
        computed_at: now.toISOString(),
      });
      if (m.accuracy_rate < ACCURACY_THRESHOLD) {
        alertRows.push({
          category: m.category,
          category_type: "urgency_level",
          accuracy_rate: m.accuracy_rate,
          sample_size: m.sample_size,
          alert_date: today,
        });
      }
    }

    // ── Upsert metrics ───────────────────────────────────
    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("accuracy_metrics")
        .upsert(upsertRows, {
          onConflict: "metric_type,period,period_start,dimension_value",
        });
      if (upsertError) throw upsertError;
    }

    // ── Insert accuracy alerts ───────────────────────────
    if (alertRows.length > 0) {
      const { error: alertError } = await supabase
        .from("accuracy_alerts")
        .insert(alertRows);
      if (alertError) throw alertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics_written: upsertRows.length,
        alerts_generated: alertRows.length,
        total_outcomes_analyzed: rows.length,
        breakdown: {
          symptom_categories: bySymptom.length,
          vehicle_makes: byMake.length,
          urgency_levels: byUrgency.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("audit-assessment-accuracy error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
