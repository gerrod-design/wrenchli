/**
 * Brief 4 (trust loop) — counting rules, grading core, and the
 * single-source rubric.
 *
 * The counting rules are a contract (see
 * supabase/functions/_shared/shop-referral-accuracy.ts):
 * owner-confirmed counted referrals only; hit >= 0.75; partial
 * 0.40-0.74 reported separately; could-not-determine excluded
 * from numerator and denominator; owner-unconfirmed cases on
 * their own flagged line; disputes leave every count on
 * re-read; sources never pooled.
 *
 * The grader core is exercised with a stubbed rubric scorer —
 * the rubric itself (prompt, bands, response parsing) is the
 * real one from _shared/accuracy-match.ts, the same module
 * report-diagnostic-outcome imports.
 */
import { describe, expect, it } from "vitest";
import {
  MATCH_SYSTEM_PROMPT,
  buildMatchPrompt,
  parseSemanticMatch,
  type SemanticMatchResult,
} from "../../../supabase/functions/_shared/accuracy-match";
import {
  computeShopReferralReadout,
  formatGradeMarker,
  gradeReferralOutcome,
  parseGradeMarker,
  type AccuracyGradeRow,
  type PackageRow,
  type ReferralRow,
  type SessionPrediction,
} from "../../../supabase/functions/_shared/shop-referral-accuracy";

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const PKG_ID = "22222222-2222-4222-8222-222222222222";
const REF_ID = "33333333-3333-4333-8333-333333333333";
const REF_ID_2 = "44444444-4444-4444-8444-444444444444";

const sessionPrediction: SessionPrediction = {
  causes: ["Worn brake pads", "Brake rotors"],
  confidence: "high",
  urgency: "schedule",
  explanation: "Pedal feel and wear indicators point to the pads.",
};

function countedReferral(overrides: Partial<ReferralRow> = {}): ReferralRow {
  return {
    id: REF_ID,
    package_id: PKG_ID,
    status: "completed",
    referral_kind: "repair",
    outcome_found: "Worn brake pads and rotors replaced",
    completion_confirmed_by: "owner",
    disputed_at: null,
    ...overrides,
  };
}

function sessionPkg(overrides: Partial<PackageRow> = {}): PackageRow {
  return {
    id: PKG_ID,
    session_id: SESSION_ID,
    diagnosis_title: "Worn brake pads",
    diagnosis_urgency: "schedule",
    diagnosis_details: {
      confidence: "high",
      possible_causes: [{ name: "Worn brake pads" }, { name: "Brake rotors" }],
    },
    vehicle_year: "2020",
    vehicle_make: "Toyota",
    vehicle_model: "Camry",
    ...overrides,
  };
}

/** Stub rubric scorer: full-set score and top-only score. */
function stubScorer(fullScore: number, topScore: number) {
  return async (input: {
    allCauseNames: string[];
  }): Promise<SemanticMatchResult> => {
    const isTopOnly = input.allCauseNames.length === 1;
    const score = isTopOnly ? topScore : fullScore;
    return {
      accuracy_score: score,
      match_label: score >= 0.75 ? "close" : score >= 0.4 ? "partial" : "miss",
      match_explanation: `Stub grade ${score}.`,
      confidence_was_correct: score >= 0.75,
      symptom_category: "brakes",
    };
  };
}

function gradeRow(
  score: number | null,
  overrides: Partial<AccuracyGradeRow> = {},
): AccuracyGradeRow {
  return {
    session_id: SESSION_ID,
    source: "shop_referral",
    accuracy_score: score,
    match_label: score === null ? "unverified" : score >= 0.75 ? "close" : "partial",
    match_explanation: formatGradeMarker({
      linkage: "session",
      referralId: REF_ID,
      topScore: score,
    }),
    predicted_top_cause: "Worn brake pads",
    ...overrides,
  };
}

describe("single-source rubric (_shared/accuracy-match)", () => {
  it("carries the MATCH bands verbatim", () => {
    expect(MATCH_SYSTEM_PROMPT).toContain("0.75-0.99 (close)");
    expect(MATCH_SYSTEM_PROMPT).toContain("0.40-0.74 (partial)");
    expect(MATCH_SYSTEM_PROMPT).toContain("unverified");
  });

  it("builds the match prompt with prediction, actual finding, and vehicle", () => {
    const prompt = buildMatchPrompt({
      topCause: "Worn brake pads",
      allCauseNames: ["Worn brake pads", "Brake rotors"],
      confidence: "high",
      explanation: "Pedal feel.",
      actualDiagnosis: "Pads replaced",
      vehicleYear: 2020,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
    });
    expect(prompt).toContain("Top predicted cause: Worn brake pads");
    expect(prompt).toContain("All predicted causes: Worn brake pads, Brake rotors");
    expect(prompt).toContain("What the shop found: Pads replaced");
    expect(prompt).toContain("Vehicle: 2020 Toyota Camry");
  });

  it("parses clean, fenced, and prose-wrapped model JSON", () => {
    const payload = JSON.stringify({
      accuracy_score: 0.8,
      match_label: "close",
      match_explanation: "Close.",
      confidence_was_correct: true,
      symptom_category: "brakes",
    });
    expect(parseSemanticMatch(payload).accuracy_score).toBe(0.8);
    expect(parseSemanticMatch("```json\n" + payload + "\n```").accuracy_score).toBe(0.8);
    expect(
      parseSemanticMatch("Here is the result: " + payload + " Done.").accuracy_score,
    ).toBe(0.8);
  });

  it("falls back to the unverified placeholder on unparseable output", () => {
    const r = parseSemanticMatch("no json here");
    expect(r.match_label).toBe("unverified");
    expect(r.accuracy_score).toBe(0.5);
  });
});

describe("grade marker", () => {
  it("round-trips linkage, referral, and top score", () => {
    const text = formatGradeMarker({
      linkage: "snapshot",
      referralId: REF_ID,
      topScore: 0.8,
    });
    expect(parseGradeMarker(text + " Human explanation.")).toEqual({
      linkage: "snapshot",
      referralId: REF_ID,
      topScore: 0.8,
    });
    expect(
      parseGradeMarker(
        formatGradeMarker({ linkage: "session", referralId: REF_ID, topScore: null }),
      )?.topScore,
    ).toBeNull();
    expect(parseGradeMarker("no marker here")).toBeNull();
  });
});

describe("grading core — end-to-end fixture", () => {
  it("a referral outcome grades end to end and lands in the shop-graded line only", async () => {
    const result = await gradeReferralOutcome(
      { referral: countedReferral(), pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: stubScorer(1.0, 1.0) },
    );
    expect(result.kind).toBe("graded");
    if (result.kind !== "graded") return;
    expect(result.determinable).toBe(true);
    expect(result.linkage).toBe("session");
    expect(result.insert.source).toBe("shop_referral");
    expect(result.insert.session_id).toBe(SESSION_ID);
    // The confirmed diagnosis is the shop's outcome_found, verbatim.
    expect(result.insert.actual_diagnosis).toBe("Worn brake pads and rotors replaced");
    expect(result.insert.accuracy_score).toBe(1.0);
    expect(parseGradeMarker(result.insert.match_explanation)?.linkage).toBe("session");

    // The same session also holds a self-report grade (a miss).
    // The shop readout must count the shop grade only.
    const selfReportGrade: AccuracyGradeRow = {
      session_id: SESSION_ID,
      source: "consumer_self_report",
      accuracy_score: 0.1,
      match_label: "miss",
      match_explanation: "Owner reported a different finding.",
      predicted_top_cause: "Worn brake pads",
    };
    const readout = computeShopReferralReadout(
      [selfReportGrade, result.insert],
      [countedReferral()],
    );
    expect(readout.headline.n).toBe(1);
    expect(readout.headline.hits).toBe(1);
    expect(readout.headline.misses).toBe(0);
    expect(readout.headline.hit_rate).toBe(1);
    expect(readout.headline.top_cause_hit_rate).toBe(1);
    expect(readout.headline.linkage_mix).toEqual({ session: 1, snapshot: 0 });
    expect(readout.owner_unconfirmed.n).toBe(0);
  });

  it("grades from the package snapshot when session_id is null (linkage: snapshot)", async () => {
    const pkg = sessionPkg({
      session_id: null,
      diagnosis_details: {
        confidence: "medium",
        possible_causes: [{ name: "Failing alternator" }, { name: "Weak battery" }],
      },
    });
    const result = await gradeReferralOutcome(
      {
        referral: countedReferral({ outcome_found: "Alternator failed, replaced" }),
        pkg,
        sessionPrediction: null,
      },
      { scoreMatch: stubScorer(0.8, 0.8) },
    );
    expect(result.kind).toBe("graded");
    if (result.kind !== "graded") return;
    expect(result.linkage).toBe("snapshot");
    expect(result.insert.session_id).toBeNull();
    expect(result.insert.predicted_top_cause).toBe("Failing alternator");
    expect(result.insert.predicted_causes_all).toEqual([
      "Failing alternator",
      "Weak battery",
    ]);
    const readout = computeShopReferralReadout([result.insert], [countedReferral()]);
    expect(readout.headline.linkage_mix).toEqual({ session: 0, snapshot: 1 });
  });

  it("falls back to the snapshot when the session has no recorded causes", async () => {
    const result = await gradeReferralOutcome(
      {
        referral: countedReferral(),
        pkg: sessionPkg(),
        sessionPrediction: { causes: [], confidence: null, urgency: null },
      },
      { scoreMatch: stubScorer(0.9, 0.9) },
    );
    expect(result.kind).toBe("graded");
    if (result.kind !== "graded") return;
    expect(result.linkage).toBe("snapshot");
    expect(result.insert.predicted_top_cause).toBe("Worn brake pads");
  });
});

describe("counting rules — negative and boundary cases", () => {
  it("(a) an outcome with no finding text is could-not-determine: own count, absent from the rate", async () => {
    const referral = countedReferral({ outcome_found: "   " });
    const result = await gradeReferralOutcome(
      { referral, pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: stubScorer(1.0, 1.0) },
    );
    expect(result.kind).toBe("graded");
    if (result.kind !== "graded") return;
    expect(result.determinable).toBe(false);
    expect(result.insert.accuracy_score).toBeNull();
    expect(result.insert.match_label).toBe("unverified");

    const readout = computeShopReferralReadout([result.insert], [referral]);
    expect(readout.headline.could_not_determine).toBe(1);
    expect(readout.headline.n).toBe(0);
    expect(readout.headline.hit_rate).toBeNull();
  });

  it("the rubric's unverified path is could-not-determine, never a scored case", async () => {
    const unverifiedScorer = async (): Promise<SemanticMatchResult> => ({
      accuracy_score: 0.5,
      match_label: "unverified",
      match_explanation: "Outcome recorded. Accuracy scoring unavailable.",
      confidence_was_correct: false,
      symptom_category: "other",
    });
    const result = await gradeReferralOutcome(
      { referral: countedReferral(), pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: unverifiedScorer },
    );
    expect(result.kind).toBe("graded");
    if (result.kind !== "graded") return;
    expect(result.determinable).toBe(false);
    expect(result.insert.accuracy_score).toBeNull();
    const readout = computeShopReferralReadout([result.insert], [countedReferral()]);
    expect(readout.headline.could_not_determine).toBe(1);
    expect(readout.headline.n).toBe(0);
  });

  it("(c) a dispute inside the window removes the case from every count on re-read", async () => {
    const grades = [gradeRow(1.0)];
    const before = computeShopReferralReadout(grades, [countedReferral()]);
    expect(before.headline.n).toBe(1);

    // Phase 1 dispute: status returns to outcome_reported, the
    // confirmation fields clear, disputed_at is set.
    const disputed = countedReferral({
      status: "outcome_reported",
      completion_confirmed_by: null,
      disputed_at: new Date().toISOString(),
    });
    const after = computeShopReferralReadout(grades, [disputed]);
    expect(after.headline.n).toBe(0);
    expect(after.headline.hits).toBe(0);
    expect(after.headline.could_not_determine).toBe(0);
    expect(after.headline.ungraded).toBe(0);
  });

  it("owner-unconfirmed completions are graded but reported on their own flagged line", async () => {
    const referral = countedReferral({
      completion_confirmed_by: "owner-unconfirmed",
    });
    const result = await gradeReferralOutcome(
      { referral, pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: stubScorer(0.9, 0.9) },
    );
    expect(result.kind).toBe("graded");
    const readout = computeShopReferralReadout(
      [result.kind === "graded" ? result.insert : gradeRow(0.9)],
      [referral],
    );
    expect(readout.headline.n).toBe(0);
    expect(readout.owner_unconfirmed.n).toBe(1);
    expect(readout.owner_unconfirmed.hits).toBe(1);
    expect(readout.owner_unconfirmed.hit_rate).toBe(1);
  });

  it("bands: 0.75 is a hit, 0.74 and 0.40 are partials, 0.39 is a miss; partials never enter the rate numerator", () => {
    const referrals = [REF_ID, REF_ID_2].map((id, i) =>
      countedReferral({ id, package_id: PKG_ID }),
    );
    const mk = (referralId: string, score: number) =>
      gradeRow(score, {
        match_explanation: formatGradeMarker({
          linkage: "session",
          referralId,
          topScore: score,
        }),
      });
    const readout = computeShopReferralReadout(
      [mk(REF_ID, 0.75), mk(REF_ID_2, 0.74)],
      referrals,
    );
    expect(readout.headline.n).toBe(2);
    expect(readout.headline.hits).toBe(1);
    expect(readout.headline.partials).toBe(1);
    expect(readout.headline.hit_rate).toBe(0.5);

    const readout2 = computeShopReferralReadout(
      [mk(REF_ID, 0.4), mk(REF_ID_2, 0.39)],
      referrals,
    );
    expect(readout2.headline.partials).toBe(1);
    expect(readout2.headline.misses).toBe(1);
    expect(readout2.headline.hit_rate).toBe(0);
  });

  it("the top-cause rate is stricter than the full-set rate", () => {
    const readout = computeShopReferralReadout(
      [
        gradeRow(0.8, {
          match_explanation: formatGradeMarker({
            linkage: "session",
            referralId: REF_ID,
            topScore: 0.5,
          }),
        }),
      ],
      [countedReferral()],
    );
    expect(readout.headline.hit_rate).toBe(1);
    expect(readout.headline.top_cause_n).toBe(1);
    expect(readout.headline.top_cause_hits).toBe(0);
    expect(readout.headline.top_cause_hit_rate).toBe(0);
  });

  it("a counted referral with no grade yet shows as ungraded, never in the rate", () => {
    const readout = computeShopReferralReadout([], [countedReferral()]);
    expect(readout.headline.ungraded).toBe(1);
    expect(readout.headline.n).toBe(0);
  });

  it("inspection referrals are never graded and never counted", async () => {
    const inspection = countedReferral({ referral_kind: "inspection" });
    const result = await gradeReferralOutcome(
      { referral: inspection, pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: stubScorer(1.0, 1.0) },
    );
    expect(result.kind).toBe("not_counted");
    const readout = computeShopReferralReadout([gradeRow(1.0)], [inspection]);
    expect(readout.headline.n).toBe(0);
    expect(readout.headline.ungraded).toBe(0);
  });

  it("referrals outside the counted state are not graded", async () => {
    const pending = countedReferral({
      status: "outcome_reported",
      completion_confirmed_by: null,
    });
    const result = await gradeReferralOutcome(
      { referral: pending, pkg: sessionPkg(), sessionPrediction },
      { scoreMatch: stubScorer(1.0, 1.0) },
    );
    expect(result.kind).toBe("not_counted");
  });
});
