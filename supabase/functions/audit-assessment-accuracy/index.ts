// supabase/functions/audit-assessment-accuracy/index.ts
// Nightly accuracy audit: computes breakdowns by symptom_category,
// vehicle_make, and urgency_level. Deduplicates alerts and enforces
// sample_size >= 5 before triggering.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCorsOptions, getCorsHeaders } from "../_shared/cors.ts";

const ACCURACY_THRESHOLD = 0.60;
const MIN_SAMPLE = 5;

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
    if (scored.length < MIN_SAMPLE) continue;

    const avgAccuracy =
      scored.reduce((sum, r) => sum + (r.accuracy_score ?? 0), 0) / scored.length;

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

Deno.serve(async (req) => {
  const optResp = handleCorsOptions(req);
  if (optResp) return optResp;

  const origin = req.headers.get("Origin");
  const headers = { ...getCorsHeaders(origin), "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query last 30 days of verified accuracy records
    const { data: rows, error } = await supabase
      .from("diagnostic_accuracy")
      .select(
        "accuracy_score, match_label, predicted_confidence, predicted_urgency, confidence_was_correct, vehicle_make, symptom_category, predicted_top_cause",
      )
      .gte("computed_at", thirtyDaysAgo.toISOString())
      .neq("match_label", "unverified");

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No verified outcomes in last 30 days", rows_written: 0 }),
        { headers },
      );
    }

    const today = now.toISOString().split("T")[0];
    const upsertRows: Record<string, unknown>[] = [];
    const pendingAlerts: { category: string; category_type: string; accuracy_rate: number; sample_size: number }[] = [];

    // Helper to push metrics + collect potential alerts
    function processBreakdown(
      metrics: CategoryMetrics[],
      dimPrefix: string,
      categoryType: string,
    ) {
      for (const m of metrics) {
        upsertRows.push({
          metric_type: "category_breakdown",
          period: "monthly",
          period_start: today,
          dimension_value: `${dimPrefix}:${m.category}`,
          accuracy_rate: m.accuracy_rate,
          outcomes_count: m.sample_size,
          exact_match_count: m.exact_count,
          close_match_count: m.close_count,
          partial_match_count: m.partial_count,
          miss_count: m.miss_count,
          computed_at: now.toISOString(),
        });
        if (m.accuracy_rate < ACCURACY_THRESHOLD && m.sample_size >= MIN_SAMPLE) {
          pendingAlerts.push({
            category: m.category,
            category_type: categoryType,
            accuracy_rate: m.accuracy_rate,
            sample_size: m.sample_size,
          });
        }
      }
    }

    processBreakdown(computeCategoryMetrics(rows, (r) => r.symptom_category), "symptom", "symptom_category");
    processBreakdown(computeCategoryMetrics(rows, (r) => r.vehicle_make), "make", "vehicle_make");
    processBreakdown(computeCategoryMetrics(rows, (r) => r.predicted_urgency), "urgency", "urgency_level");

    // Upsert metrics
    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("accuracy_metrics")
        .upsert(upsertRows, { onConflict: "metric_type,period,period_start,dimension_value" });
      if (upsertError) throw upsertError;
    }

    // Deduplicate alerts — only insert if no unresolved alert exists for same category+type
    let alertsCreated = 0;
    if (pendingAlerts.length > 0) {
      const { data: existing } = await supabase
        .from("accuracy_alerts")
        .select("category, category_type")
        .eq("is_resolved", false);

      const existingSet = new Set(
        (existing ?? []).map((e: any) => `${e.category_type}::${e.category}`),
      );

      const newAlerts = pendingAlerts
        .filter((a) => !existingSet.has(`${a.category_type}::${a.category}`))
        .map((a) => ({
          category: a.category,
          category_type: a.category_type,
          accuracy_rate: a.accuracy_rate,
          sample_size: a.sample_size,
          threshold: ACCURACY_THRESHOLD * 100,
          alert_date: today,
        }));

      if (newAlerts.length > 0) {
        const { error: alertError } = await supabase
          .from("accuracy_alerts")
          .insert(newAlerts);
        if (alertError) throw alertError;
        alertsCreated = newAlerts.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics_written: upsertRows.length,
        alerts_generated: alertsCreated,
        total_outcomes_analyzed: rows.length,
        breakdown: {
          symptom_categories: computeCategoryMetrics(rows, (r) => r.symptom_category).length,
          vehicle_makes: computeCategoryMetrics(rows, (r) => r.vehicle_make).length,
          urgency_levels: computeCategoryMetrics(rows, (r) => r.predicted_urgency).length,
        },
      }),
      { headers },
    );
  } catch (error) {
    console.error("audit-assessment-accuracy error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers },
    );
  }
});
