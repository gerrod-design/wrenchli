// supabase/functions/compute-accuracy-metrics/index.ts
// ============================================================
// WRENCHLI — Edge Function: Compute Accuracy Metrics
// Run on daily schedule or manually for backfills.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
// Brief 4 (2026-11-15): the shop-referral series is computed by
// the shared counting-rules module and returned alongside the
// persisted self-report series. It is deliberately NOT written
// to accuracy_metrics: the counting rules require counts from
// current referral state at read time (a dispute un-counts a
// completion), and a frozen rollup row would go stale.
import {
  computeShopReferralReadout,
  type AccuracyGradeRow,
  type ReferralRow,
} from "../_shared/shop-referral-accuracy.ts";


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
  hits: number;
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
      hits: 0,
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

  // Hit = accuracy_score >= 0.75, the platform counting rule
  // (see _shared/shop-referral-accuracy.ts).
  const hits = scoredRows.filter((r) => (r.accuracy_score ?? 0) >= 0.75).length;

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
    hits,
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

// ── Persistence mapping (2026-11-17 fix) ─────────────────────
// accuracy_metrics in production carries the charter column set
// (period, cause_key, predictions, confirmed, hits, hit_rate,
// dataset_limitations, cleared_by_watchdog, computed_at,
// metric_type, period_start, trend) and is append-only (the
// vera_accuracy_metrics_no_mutation trigger rejects UPDATE and
// DELETE). Rollups are therefore INSERTed in that shape, never
// upserted; readers take the latest row by computed_at. The
// previous payload (accuracy_rate, dimension_value,
// outcomes_count, match counts, top/worst diagnoses) named
// columns the production table does not have, so every run
// with accuracy rows present failed with HTTP 500.
// Mapping: predictions and confirmed are the scored outcome
// count (every diagnostic_accuracy row graded here exists
// because an outcome was reported); hits counts scores
// >= 0.75; hit_rate = hits / confirmed (null when nothing was
// scored). The dimension (make / symptom category) rides in
// cause_key; the overall row leaves cause_key null.
const ROLLUP_LIMITATIONS =
  "Consumer self-report series (diagnostic_accuracy, source = consumer_self_report); rubric grades of owner-reported outcomes, not verified repairs. Hit = accuracy_score >= 0.75.";

function toRollupRow(
  metricType: "overall" | "by_make" | "by_symptom_category",
  period: string,
  periodStartISO: string,
  causeKey: string | null,
  metrics: PeriodMetrics,
): Record<string, unknown> {
  return {
    metric_type: metricType,
    period,
    period_start: periodStartISO,
    cause_key: causeKey,
    predictions: metrics.outcomes_count,
    confirmed: metrics.outcomes_count,
    hits: metrics.hits,
    hit_rate: metrics.outcomes_count > 0
      ? Math.round((metrics.hits / metrics.outcomes_count) * 1000) / 1000
      : null,
    trend: metrics.trend,
    dataset_limitations: ROLLUP_LIMITATIONS,
    cleared_by_watchdog: false,
    computed_at: new Date().toISOString(),
  };
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

    const body = await req.json().catch(() => ({}));
    const periods: Array<"daily" | "weekly" | "monthly"> =
      body.periods ?? ["daily", "weekly", "monthly"];
    const referenceDate = body.reference_date ? new Date(body.reference_date) : new Date();

    const insertRows: Record<string, unknown>[] = [];

    for (const period of periods) {
      const periodStart = getPeriodStart(period, referenceDate);
      const periodStartISO = periodStart.toISOString();

      const { data: rows, error } = await supabase
        .from("diagnostic_accuracy")
        .select(
          "accuracy_score, match_label, predicted_confidence, confidence_was_correct, vehicle_make, symptom_category, predicted_top_cause, computed_at"
        )
        // Brief 4: the persisted overall / by-make / by-category
        // series are the CONSUMER SELF-REPORT series. Shop grades
        // are computed separately below and never pooled into
        // these rollups.
        .eq("source", "consumer_self_report")
        .gte("computed_at", periodStartISO)
        .lte("computed_at", referenceDate.toISOString())
        .neq("match_label", "unverified");

      if (error) throw error;
      if (!rows || rows.length === 0) continue;

      // ── OVERALL metric ───────────────────────────────────
      const overallMetrics = computeMetrics(rows);
      insertRows.push(
        toRollupRow("overall", period, periodStart.toISOString().split("T")[0], null, overallMetrics),
      );

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
        insertRows.push(
          toRollupRow("by_make", period, periodStart.toISOString().split("T")[0], make, makeMetrics),
        );
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
        insertRows.push(
          toRollupRow("by_symptom_category", period, periodStart.toISOString().split("T")[0], category, catMetrics),
        );
      }
    }

    // ── Insert all computed rows (append-only table) ───────
    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from("accuracy_metrics")
        .insert(insertRows);

      if (insertError) throw insertError;
    }

    // ── SHOP-REFERRAL series (Brief 4, separate by source) ──
    // Computed live from current state per the counting rules in
    // _shared/shop-referral-accuracy.ts and returned alongside
    // the persisted self-report rollups — never merged with them.
    const [{ data: shopGrades }, { data: shopReferrals }] = await Promise.all([
      supabase
        .from("diagnostic_accuracy")
        .select(
          "session_id, source, accuracy_score, match_label, match_explanation, predicted_top_cause"
        )
        .eq("source", "shop_referral"),
      supabase
        .from("shop_referrals")
        .select(
          "id, package_id, status, referral_kind, outcome_found, completion_confirmed_by, disputed_at"
        )
        .eq("referral_kind", "repair"),
    ]);
    const shopReferral = computeShopReferralReadout(
      (shopGrades ?? []) as AccuracyGradeRow[],
      (shopReferrals ?? []) as ReferralRow[],
    );

    // ── Return summary ─────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        rows_computed: insertRows.length,
        periods_processed: periods,
        reference_date: referenceDate.toISOString(),
        shop_referral: shopReferral,
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
