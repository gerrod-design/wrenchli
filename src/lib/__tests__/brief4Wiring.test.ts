/**
 * Brief 4 (trust loop) — wiring assertions.
 *
 * Pins the id-carrying chain and the single-source rubric at
 * the source level, the same way earlier briefs pinned their
 * wiring (financing.test.ts, brief5SmallHonesties.test.ts):
 *  - ShareWithShopButton writes referral_packages.session_id
 *    from its new optional sessionId prop.
 *  - RecommendationStep passes its sessionId to BOTH
 *    ShareWithShopButton mounts (repair and inspection modes).
 *  - VehicleRecord resolves the session id from the
 *    assessment_handoffs record (source_assessment_id) and
 *    passes it to both mounts.
 *  - OwnerReferralStatus invokes grade-referral-outcome at the
 *    owner-confirmation counting moment and on load for
 *    already-counted referrals.
 *  - The MATCH rubric text exists in exactly ONE file under
 *    supabase/functions (the _shared module); both grading
 *    functions import it.
 *  - The readouts keep the sources separate: the self-report
 *    series filter on source = 'consumer_self_report' and the
 *    shop-referral section comes from the shared counting
 *    module.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe("Brief 4 migration file", () => {
  const sql = read(
    "supabase/migrations/20261115120000_pre_assessment_brief4_trust_loop.sql",
  );

  it("adds referral_packages.session_id as a nullable FK to diagnostic_sessions", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS session_id uuid NULL");
    expect(sql).toContain("REFERENCES public.diagnostic_sessions(id)");
  });

  it("adds diagnostic_accuracy.source with the self-report default and the two-value check", () => {
    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'consumer_self_report'",
    );
    expect(sql).toContain(
      "CHECK (source IN ('consumer_self_report', 'shop_referral'))",
    );
  });

  it("moves uniqueness to (session_id, source)", () => {
    expect(sql).toContain("UNIQUE (session_id, source)");
    expect(sql).toContain("diagnostic_accuracy_session_source_key");
  });
});

describe("id-carrying chain", () => {
  it("ShareWithShopButton takes an optional sessionId and writes it at package creation", () => {
    const src = read("src/components/ShareWithShopButton.tsx");
    expect(src).toContain("sessionId?: string | null");
    expect(src).toContain("session_id: props.sessionId ?? null");
  });

  it("RecommendationStep passes sessionId to both ShareWithShopButton mounts", () => {
    const src = read(
      "src/components/diagnostic-wizard/steps/RecommendationStep.tsx",
    );
    const mounts = src.split("<ShareWithShopButton").slice(1);
    expect(mounts.length).toBe(2);
    for (const mount of mounts) {
      expect(mount.slice(0, 400)).toContain("sessionId={sessionId}");
    }
  });

  it("VehicleRecord resolves the handoff's source_assessment_id and passes it to both mounts", () => {
    const src = read("src/pages/VehicleRecord.tsx");
    expect(src).toContain(
      '.select("id, snapshot, source_assessment_id, created_at")',
    );
    const passes = src.match(/sessionId=\{linkedAssessments\[0\]\.sessionId\}/g);
    expect(passes?.length).toBe(2);
  });

  it("OwnerReferralStatus invokes grade-referral-outcome at confirmation and on load", () => {
    const src = read("src/components/OwnerReferralStatus.tsx");
    expect(src).toContain('invoke("grade-referral-outcome"');
    expect(src).toContain('if (action === "confirm") triggerReferralGrade(referralId);');
    expect(src).toContain('r.status === "completed" && r.completion_confirmed_by');
  });
});

describe("single-source rubric", () => {
  it("the rubric text lives in exactly one file under supabase/functions", () => {
    const files = walk(resolve(root, "supabase/functions")).filter((f) =>
      f.endsWith(".ts"),
    );
    const carriers = files.filter((f) =>
      readFileSync(f, "utf8").includes("0.75-0.99 (close)"),
    );
    expect(carriers).toEqual([
      resolve(root, "supabase/functions/_shared/accuracy-match.ts"),
    ]);
  });

  it("report-diagnostic-outcome imports the shared rubric instead of defining it", () => {
    const src = read("supabase/functions/report-diagnostic-outcome/index.ts");
    expect(src).toContain('from "../_shared/accuracy-match.ts"');
    expect(src).not.toContain("MATCH_SYSTEM_PROMPT =");
    expect(src).not.toContain("AI service error");
  });

  it("grade-referral-outcome grades through the shared rubric and counting core", () => {
    const src = read("supabase/functions/grade-referral-outcome/index.ts");
    expect(src).toContain('from "../_shared/accuracy-match.ts"');
    expect(src).toContain('from "../_shared/shop-referral-accuracy.ts"');
    expect(src).toContain("sweep");
  });
});

describe("source-separated readout", () => {
  it("compute-accuracy-metrics scopes its persisted series to consumer self-report and computes the shop series separately", () => {
    const src = read("supabase/functions/compute-accuracy-metrics/index.ts");
    expect(src).toContain('.eq("source", "consumer_self_report")');
    expect(src).toContain("computeShopReferralReadout");
    expect(src).toContain("shop_referral: shopReferral");
  });

  it("audit-assessment-accuracy (behind admin-audit-accuracy) gains the shop-referral section beside the self-report figures", () => {
    const src = read("supabase/functions/audit-assessment-accuracy/index.ts");
    expect(src).toContain('.eq("source", "consumer_self_report")');
    expect(src).toContain("computeShopReferralReadout");
    expect(src).toContain("shop_referral: shopReferral");
  });
});
