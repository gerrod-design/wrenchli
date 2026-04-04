// supabase/functions/compute-accuracy-metrics/index.ts
// ============================================================
// WRENCHLI — Edge Function: Compute Accuracy Metrics
// Run on daily schedule or manually for backfills.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ────────────────────────────────────────────────────

interface AccuracyRow {
  accuracy_score: number | null;
  match_label: string;
  predicted_confidence: string;
  confidence_was_correct: boolean;
  vehicle_make: string | null;
  symptom_category: string | null;
  predicted_top_cause: string;
  computed_at: string;
}

interface DiagnosisPerformance {
  diagnosis: string;
  accuracy: number;
  count: number;
}

interface PeriodMetrics {
  accuracy_rate: number;
  confidence_calibration: number | null;
  outcomes_count: number;
  exact_match_count: number;
  close_match_count: number;
  partial_match_count: number;
  miss_count: number;
  trend: "improving" | "stable" | "declining";
  top_diagnoses: DiagnosisPerformance[];
  worst_diagnoses: DiagnosisPerformance[];
}

// ── Helper: Compute metrics from a set of accuracy rows ──────

function computeMetrics(rows: AccuracyRow[]): PeriodMetrics {
  const scoredRows = rows.filter((r) => r.accuracy_score !== null);
  const outcomes_count = scoredRows.length;

  if (outcomes_count === 0) {
    return {
      accuracy_rate: 0,
      confidence_calibration: null,
      outcomes_count: 0,
      exact_match_count: 0,
      close_match_count: 0,
      partial_match_count: 0,
      miss_count: 0,
      trend: "stable",
      top_diagnoses: [],
      worst_diagnoses: [],
    };
  }

  const accuracy_rate =
    scoredRows.reduce((sum, r) => sum + (r.accuracy_score ?? 0), 0) / outcomes_count;

  const exact_match_count  = rows.filter((r) => r.match_label === "exact").length;
  const close_match_count  = rows.filter((r) => r.match_label === "close").length;
  const partial_match_count = rows.filter((r) => r.match_label === "partial").length;
  const miss_count          = rows.filter((r) => r.match_label === "miss").length;

  const highConfidenceRows = scoredRows.filter((r) => r.predicted_confidence === "high");
  const confidence_calibration =
    highConfidenceRows.length > 0
      ? highConfidenceRows.filter((r) => (r.accuracy_score ?? 0) >= 0.75).length /
        highConfidenceRows.length
      : null;

  const diagnosisMap = new Map<string, { total: number; count: number }>();
  for (const row of scoredRows) {
    const name = row.predicted_top_cause;
    const existing = diagnosisMap.get(name) ?? { total: 0, count: 0 };
    diagnosisMap.set(name, {
      total: existing.total + (row.accuracy_score ?? 0),
      count: existing.count + 1,
    });
  }

  const diagnosisPerformance: DiagnosisPerformance[] = Array.from(diagnosisMap.entries())
    .filter(([, v]) => v.count >= 3)
    .map(([name, v]) => ({
      diagnosis: name,
      accuracy: Math.round((v.total / v.count) * 1000) / 1000,
      count: v.count,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const top_diagnoses    = diagnosisPerformance.slice(0, 5);
  const worst_diagnoses  = [...diagnosisPerformance].reverse().slice(0, 5);

  const mid = Math.floor(scoredRows.length / 2);
  const firstHalfAvg =
    scoredRows.slice(0, mid).reduce((s, r) => s + (r.accuracy_score ?? 0), 0) / (mid || 1);
  const secondHalfAvg =
    scoredRows.slice(mid).reduce((s, r) => s + (r.accuracy_score ?? 0), 0) /
    ((scoredRows.length - mid) || 1);

  const delta = secondHalfAvg - firstHalfAvg;
  const trend: "improving" | "stable" | "declining" =
    delta > 0.03 ? "improving" : delta < -0.03 ? "declining" : "stable";

  return {
    accuracy_rate: Math.round(accuracy_rate * 1000) / 1000,
    confidence_calibration: confidence_calibration !== null
      ? Math.round(confidence_calibration * 1000) / 1000
      : null,
    outcomes_count,
    exact_match_count,
    close_match_count,
    partial_match_count,
    miss_count,
    trend,
    top_diagnoses,
    worst_diagnoses,
  };
}

// ── Helper: Date range for period ────────────────────────────

function getPeriodStart(period: "daily" | "weekly" | "monthly", referenceDate: Date): Date {
  const d = new Date(referenceDate);
  if (period === "daily") {
    d.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

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

    const body = await req.json().catch(() => ({}));
    const periods: Array<"daily" | "weekly" | "monthly"> =
      body.periods ?? ["daily", "weekly", "monthly"];
    const referenceDate = body.reference_date ? new Date(body.reference_date) : new Date();

    const upsertRows: Record<string, unknown>[] = [];

    for (const period of periods) {
      const periodStart = getPeriodStart(period, referenceDate);
      const periodStartISO = periodStart.toISOString();

      const { data: rows, error } = await supabase
        .from("diagnostic_accuracy")
        .select(
          "accuracy_score, match_label, predicted_confidence, confidence_was_correct, vehicle_make, symptom_category, predicted_top_cause, computed_at"
        )
        .gte("computed_at", periodStartISO)
        .lte("computed_at", referenceDate.toISOString())
        .neq("match_label", "unverified");

      if (error) throw error;
      if (!rows || rows.length === 0) continue;

      // ── OVERALL metric ───────────────────────────────────
      const overallMetrics = computeMetrics(rows);
      upsertRows.push({
        metric_type: "overall",
        period,
        period_start: periodStart.toISOString().split("T")[0],
        dimension_value: null,
        ...overallMetrics,
        computed_at: new Date().toISOString(),
      });

      // ── BY MAKE metric ───────────────────────────────────
      const makeGroups = new Map<string, AccuracyRow[]>();
      for (const row of rows) {
        if (!row.vehicle_make) continue;
        const existing = makeGroups.get(row.vehicle_make) ?? [];
        makeGroups.set(row.vehicle_make, [...existing, row]);
      }

      for (const [make, makeRows] of makeGroups.entries()) {
        if (makeRows.length < 5) continue;
        const makeMetrics = computeMetrics(makeRows);
        upsertRows.push({
          metric_type: "by_make",
          period,
          period_start: periodStart.toISOString().split("T")[0],
          dimension_value: make,
          ...makeMetrics,
          computed_at: new Date().toISOString(),
        });
      }

      // ── BY SYMPTOM CATEGORY metric ───────────────────────
      const categoryGroups = new Map<string, AccuracyRow[]>();
      for (const row of rows) {
        if (!row.symptom_category) continue;
        const existing = categoryGroups.get(row.symptom_category) ?? [];
        categoryGroups.set(row.symptom_category, [...existing, row]);
      }

      for (const [category, catRows] of categoryGroups.entries()) {
        if (catRows.length < 5) continue;
        const catMetrics = computeMetrics(catRows);
        upsertRows.push({
          metric_type: "by_symptom_category",
          period,
          period_start: periodStart.toISOString().split("T")[0],
          dimension_value: category,
          ...catMetrics,
          computed_at: new Date().toISOString(),
        });
      }
    }

    // ── Upsert all computed rows ───────────────────────────
    if (upsertRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("accuracy_metrics")
        .upsert(upsertRows, {
          onConflict: "metric_type,period,period_start,dimension_value",
        });

      if (upsertError) throw upsertError;
    }

    // ── Return summary ─────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        rows_computed: upsertRows.length,
        periods_processed: periods,
        reference_date: referenceDate.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("compute-accuracy-metrics error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
