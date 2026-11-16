// supabase/functions/_shared/shop-referral-accuracy.ts
// ============================================================
// Brief 4 (2026-11-15): grading core + counting rules for
// shop-graded referral outcomes.
//
// The counting rules are a contract, stated once here and used
// by every surface (grade-referral-outcome, compute-accuracy-
// metrics, audit-assessment-accuracy):
//
//  - Population: owner-confirmed counted referrals. A referral
//    counts when its status is 'completed', its
//    completion_confirmed_by is set, and it is not disputed.
//    Inspection referrals are out of scope and never graded.
//  - Owner-unconfirmed completions (the Phase 1 14-day counted
//    state) are graded too, but reported on their own flagged
//    line, never mixed into the headline rate.
//  - A case is determinable when the shop's outcome_found
//    carries a real finding and the grader returns a score.
//    Could-not-determine cases (no finding text, no prediction
//    to grade against, or the rubric's 'unverified' path) are
//    excluded from numerator and denominator and reported as
//    their own count.
//  - Hit = score >= 0.75. Partial = 0.40 to 0.74, reported
//    separately, never in the headline rate. Miss = below 0.40.
//    Headline rate = hits / (hits + partials + misses) over
//    determinable owner-confirmed cases.
//  - The top-cause hit rate restricts the grade to the single
//    predicted top cause (the stricter number).
//  - Disputes: counts are computed from CURRENT state at read
//    time. A dispute un-counts the completion (Phase 1 returns
//    the referral to 'outcome_reported' and clears the
//    confirmation), so the case drops out of every count on
//    re-read. Nothing here is ever frozen.
//  - Sources are never pooled: this module only ever reads
//    grades whose source is 'shop_referral'.
//
// Pure TypeScript: no Deno globals, no I/O. The edge functions
// fetch rows and hand them in; the Vitest suite exercises the
// rules directly against this module.
// ============================================================

import type { SemanticMatchResult } from "./accuracy-match.ts";

export const SHOP_REFERRAL_SOURCE = "shop_referral";

const CONFIDENCE_VALUES = ["low", "medium", "high"];
const URGENCY_VALUES = ["monitor", "schedule", "soon", "immediate"];

export const HIT_THRESHOLD = 0.75;
export const PARTIAL_THRESHOLD = 0.40;

// ── Row shapes (structural subsets of the live tables) ───────

export interface ReferralRow {
  id: string;
  package_id: string;
  status: string;
  referral_kind?: string | null;
  outcome_found?: string | null;
  completion_confirmed_by?: string | null;
  disputed_at?: string | null;
}

export interface PackageRow {
  id: string;
  session_id?: string | null;
  diagnosis_title?: string | null;
  diagnosis_urgency?: string | null;
  diagnosis_details?: Record<string, unknown> | null;
  vehicle_year?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
}

export interface SessionPrediction {
  /** Cause names, most likely first (top cause at index 0). */
  causes: string[];
  confidence?: string | null;
  urgency?: string | null;
  explanation?: string | null;
}

export interface AccuracyGradeRow {
  session_id?: string | null;
  source?: string | null;
  accuracy_score?: number | null;
  match_label?: string | null;
  match_explanation?: string | null;
  predicted_top_cause?: string | null;
}

export interface GradeInsert {
  session_id: string | null;
  source: "shop_referral";
  outcome_report_id: null;
  predicted_top_cause: string;
  predicted_causes_all: string[];
  predicted_confidence: string;
  predicted_urgency: string;
  actual_diagnosis: string | null;
  accuracy_score: number | null;
  match_label: string;
  match_explanation: string;
  confidence_was_correct: boolean;
  vehicle_make: string | null;
  vehicle_model: string | null;
  symptom_category: string;
}

// ── Counted state ────────────────────────────────────────────

/**
 * A referral is in the counted population when Phase 1 counts
 * its completion: status 'completed' with a confirmation source
 * recorded, and no dispute. Read from current state every time.
 */
export function isCountedReferral(r: ReferralRow): boolean {
  return (
    r.status === "completed" &&
    (r.completion_confirmed_by === "owner" ||
      r.completion_confirmed_by === "owner-unconfirmed") &&
    (r.disputed_at === null || r.disputed_at === undefined) &&
    (r.referral_kind ?? "repair") === "repair"
  );
}

// ── Grade marker ─────────────────────────────────────────────
// A shop grade's linkage, its referral, and its top-cause score
// ride in a machine-readable prefix on match_explanation (the
// brief puts the linkage marker on the accuracy row's
// explanation; diagnostic_accuracy has no spare columns). The
// human-readable rubric explanation follows the marker.

export interface GradeMarker {
  linkage: "session" | "snapshot";
  referralId: string;
  topScore: number | null;
}

export function formatGradeMarker(m: GradeMarker): string {
  const top = m.topScore === null ? "none" : m.topScore.toFixed(3);
  return `[brief4-grading linkage=${m.linkage} referral=${m.referralId} top_score=${top}]`;
}

const MARKER_RE =
  /\[brief4-grading linkage=(session|snapshot) referral=([0-9a-fA-F-]{36}) top_score=([0-9.]+|none)\]/;

export function parseGradeMarker(
  explanation: string | null | undefined,
): GradeMarker | null {
  if (!explanation) return null;
  const match = explanation.match(MARKER_RE);
  if (!match) return null;
  return {
    linkage: match[1] as "session" | "snapshot",
    referralId: match[2],
    topScore: match[3] === "none" ? null : Number(match[3]),
  };
}

// ── Prediction resolution ────────────────────────────────────

function validConfidence(v: unknown): string | null {
  return typeof v === "string" && CONFIDENCE_VALUES.includes(v) ? v : null;
}

function validUrgency(v: unknown): string | null {
  return typeof v === "string" && URGENCY_VALUES.includes(v) ? v : null;
}

/** Cause names from a package's diagnosis_details snapshot. */
export function snapshotCauses(pkg: PackageRow): string[] {
  const details = pkg.diagnosis_details ?? {};
  const raw = (details as { possible_causes?: unknown }).possible_causes;
  if (!Array.isArray(raw)) return [];
  const names: string[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) names.push(entry);
    else if (
      entry !== null &&
      typeof entry === "object" &&
      typeof (entry as { name?: unknown }).name === "string" &&
      (entry as { name: string }).name.trim()
    ) {
      names.push((entry as { name: string }).name);
    }
  }
  return names;
}

export interface ResolvedPrediction {
  linkage: "session" | "snapshot";
  causes: string[];
  confidence: string;
  urgency: string;
  explanation: string;
}

export function resolvePrediction(
  pkg: PackageRow,
  sessionPrediction: SessionPrediction | null,
): ResolvedPrediction {
  const details = (pkg.diagnosis_details ?? {}) as {
    confidence?: unknown;
    explanation?: unknown;
  };
  const snapCauses = snapshotCauses(pkg);
  const snapConfidence = validConfidence(details.confidence);
  const snapUrgency = validUrgency(pkg.diagnosis_urgency);
  const snapExplanation =
    typeof details.explanation === "string" ? details.explanation : "";

  if (pkg.session_id && sessionPrediction && sessionPrediction.causes.length > 0) {
    return {
      linkage: "session",
      causes: sessionPrediction.causes,
      confidence:
        validConfidence(sessionPrediction.confidence) ?? snapConfidence ?? "low",
      urgency: validUrgency(sessionPrediction.urgency) ?? snapUrgency ?? "monitor",
      explanation: sessionPrediction.explanation ?? snapExplanation,
    };
  }

  return {
    linkage: "snapshot",
    causes: snapCauses,
    confidence: snapConfidence ?? "low",
    urgency: snapUrgency ?? "monitor",
    explanation: snapExplanation,
  };
}

// ── Grading core ─────────────────────────────────────────────

export interface GradeReferralInput {
  referral: ReferralRow;
  pkg: PackageRow;
  sessionPrediction: SessionPrediction | null;
}

export interface GradeReferralDeps {
  scoreMatch: (input: {
    topCause: string;
    allCauseNames: string[];
    confidence: string;
    explanation: string;
    actualDiagnosis: string;
    vehicleYear?: string;
    vehicleMake?: string;
    vehicleModel?: string;
  }) => Promise<SemanticMatchResult>;
}

export type GradeReferralResult =
  | { kind: "not_counted"; reason: string }
  | {
      kind: "graded";
      determinable: boolean;
      linkage: "session" | "snapshot";
      insert: GradeInsert;
    };

function couldNotDetermineInsert(args: {
  referral: ReferralRow;
  pkg: PackageRow;
  prediction: ResolvedPrediction;
  outcomeText: string;
  reason: string;
}): GradeInsert {
  const marker = formatGradeMarker({
    linkage: args.prediction.linkage,
    referralId: args.referral.id,
    topScore: null,
  });
  return {
    session_id: args.pkg.session_id ?? null,
    source: "shop_referral",
    outcome_report_id: null,
    predicted_top_cause:
      args.prediction.causes[0] ?? args.pkg.diagnosis_title ?? "Unknown",
    predicted_causes_all: args.prediction.causes,
    predicted_confidence: args.prediction.confidence,
    predicted_urgency: args.prediction.urgency,
    actual_diagnosis: args.outcomeText || null,
    accuracy_score: null,
    match_label: "unverified",
    match_explanation: `${marker} Could not determine: ${args.reason}`,
    confidence_was_correct: false,
    vehicle_make: args.pkg.vehicle_make ?? null,
    vehicle_model: args.pkg.vehicle_model ?? null,
    symptom_category: "other",
  };
}

/**
 * Grade one referral's shop-reported outcome against the
 * session's predicted causes. Pure decision logic: the caller
 * (grade-referral-outcome) loads the rows, checks idempotency,
 * and performs the returned insert.
 */
export async function gradeReferralOutcome(
  input: GradeReferralInput,
  deps: GradeReferralDeps,
): Promise<GradeReferralResult> {
  const { referral, pkg } = input;

  if ((referral.referral_kind ?? "repair") !== "repair") {
    return { kind: "not_counted", reason: "inspection_referral_out_of_scope" };
  }
  if (referral.disputed_at) {
    return { kind: "not_counted", reason: "disputed" };
  }
  if (
    referral.status !== "completed" ||
    (referral.completion_confirmed_by !== "owner" &&
      referral.completion_confirmed_by !== "owner-unconfirmed")
  ) {
    return { kind: "not_counted", reason: "not_in_counted_state" };
  }

  const prediction = resolvePrediction(pkg, input.sessionPrediction);
  const outcomeText = (referral.outcome_found ?? "").trim();

  if (!outcomeText) {
    return {
      kind: "graded",
      determinable: false,
      linkage: prediction.linkage,
      insert: couldNotDetermineInsert({
        referral,
        pkg,
        prediction,
        outcomeText,
        reason: "the shop's outcome report carries no finding text.",
      }),
    };
  }

  if (prediction.causes.length === 0) {
    return {
      kind: "graded",
      determinable: false,
      linkage: prediction.linkage,
      insert: couldNotDetermineInsert({
        referral,
        pkg,
        prediction,
        outcomeText,
        reason: "no predicted causes were recorded for this referral.",
      }),
    };
  }

  const scoreInput = {
    topCause: prediction.causes[0],
    allCauseNames: prediction.causes,
    confidence: prediction.confidence,
    explanation: prediction.explanation,
    actualDiagnosis: outcomeText,
    vehicleYear: pkg.vehicle_year ?? undefined,
    vehicleMake: pkg.vehicle_make ?? undefined,
    vehicleModel: pkg.vehicle_model ?? undefined,
  };

  const full = await deps.scoreMatch(scoreInput);
  if (full.match_label === "unverified") {
    // The rubric's unverified path (including its scoring-
    // unavailable fallback) is could-not-determine by contract.
    return {
      kind: "graded",
      determinable: false,
      linkage: prediction.linkage,
      insert: couldNotDetermineInsert({
        referral,
        pkg,
        prediction,
        outcomeText,
        reason: full.match_explanation,
      }),
    };
  }

  const topOnly = await deps.scoreMatch({
    ...scoreInput,
    allCauseNames: [prediction.causes[0]],
  });
  const topScore =
    topOnly.match_label === "unverified" ? null : topOnly.accuracy_score;

  const marker = formatGradeMarker({
    linkage: prediction.linkage,
    referralId: referral.id,
    topScore,
  });

  return {
    kind: "graded",
    determinable: true,
    linkage: prediction.linkage,
    insert: {
      session_id: pkg.session_id ?? null,
      source: "shop_referral",
      outcome_report_id: null,
      predicted_top_cause: prediction.causes[0],
      predicted_causes_all: prediction.causes,
      predicted_confidence: prediction.confidence,
      predicted_urgency: prediction.urgency,
      actual_diagnosis: outcomeText,
      accuracy_score: full.accuracy_score,
      match_label: full.match_label,
      match_explanation: `${marker} ${full.match_explanation}`,
      confidence_was_correct: full.confidence_was_correct,
      vehicle_make: pkg.vehicle_make ?? null,
      vehicle_model: pkg.vehicle_model ?? null,
      symptom_category: full.symptom_category,
    },
  };
}

// ── Readout (counting rules applied to current state) ────────

export interface ReadoutSection {
  /** Determinable cases: hits + partials + misses. */
  n: number;
  hits: number;
  partials: number;
  misses: number;
  /** hits / n, null when n is 0. */
  hit_rate: number | null;
  top_cause_n: number;
  top_cause_hits: number;
  top_cause_hit_rate: number | null;
  could_not_determine: number;
  /** Counted referrals with no grade yet (the sweep's backlog). */
  ungraded: number;
  linkage_mix: { session: number; snapshot: number };
}

export interface ShopReferralReadout {
  headline: ReadoutSection;
  owner_unconfirmed: ReadoutSection;
}

function emptySection(): ReadoutSection & {
  topCauseScores: number[];
  linkageSession: number;
  linkageSnapshot: number;
} {
  return {
    n: 0,
    hits: 0,
    partials: 0,
    misses: 0,
    hit_rate: null,
    top_cause_n: 0,
    top_cause_hits: 0,
    top_cause_hit_rate: null,
    could_not_determine: 0,
    ungraded: 0,
    linkage_mix: { session: 0, snapshot: 0 },
    topCauseScores: [],
    linkageSession: 0,
    linkageSnapshot: 0,
  };
}

function finalizeSection(
  s: ReturnType<typeof emptySection>,
): ReadoutSection {
  const { topCauseScores, linkageSession, linkageSnapshot, ...rest } = s;
  void topCauseScores;
  return {
    ...rest,
    hit_rate: s.n > 0 ? Math.round((s.hits / s.n) * 1000) / 1000 : null,
    top_cause_n: topCauseScores.length,
    top_cause_hits: topCauseScores.filter((v) => v >= HIT_THRESHOLD).length,
    top_cause_hit_rate:
      topCauseScores.length > 0
        ? Math.round(
            (topCauseScores.filter((v) => v >= HIT_THRESHOLD).length /
              topCauseScores.length) *
              1000,
          ) / 1000
        : null,
    linkage_mix: { session: linkageSession, snapshot: linkageSnapshot },
  };
}

/**
 * Compute the shop-referral readout from current state. Grades
 * are matched to referrals through the marker on each grade's
 * explanation; a referral whose completion is no longer counted
 * (disputed, un-counted) contributes nothing, so a dispute
 * removes its case from every count on re-read.
 */
export function computeShopReferralReadout(
  grades: AccuracyGradeRow[],
  referrals: ReferralRow[],
): ShopReferralReadout {
  const gradeByReferral = new Map<string, AccuracyGradeRow>();
  for (const g of grades) {
    if ((g.source ?? "consumer_self_report") !== SHOP_REFERRAL_SOURCE) continue;
    const marker = parseGradeMarker(g.match_explanation);
    if (marker) gradeByReferral.set(marker.referralId, g);
  }

  const headline = emptySection();
  const ownerUnconfirmed = emptySection();

  for (const referral of referrals) {
    if (!isCountedReferral(referral)) continue;
    const section =
      referral.completion_confirmed_by === "owner-unconfirmed"
        ? ownerUnconfirmed
        : headline;

    const grade = gradeByReferral.get(referral.id);
    if (!grade) {
      section.ungraded += 1;
      continue;
    }

    const determinable =
      grade.accuracy_score !== null &&
      grade.accuracy_score !== undefined &&
      grade.match_label !== "unverified";
    if (!determinable) {
      section.could_not_determine += 1;
      continue;
    }

    const score = grade.accuracy_score as number;
    section.n += 1;
    if (score >= HIT_THRESHOLD) section.hits += 1;
    else if (score >= PARTIAL_THRESHOLD) section.partials += 1;
    else section.misses += 1;

    const marker = parseGradeMarker(grade.match_explanation);
    if (marker) {
      if (marker.linkage === "session") section.linkageSession += 1;
      else section.linkageSnapshot += 1;
      if (marker.topScore !== null) section.topCauseScores.push(marker.topScore);
    }
  }

  return {
    headline: finalizeSection(headline),
    owner_unconfirmed: finalizeSection(ownerUnconfirmed),
  };
}
