/**
 * Tests for the Mobility Brief 2 migration (Mobile Vehicle
 * Inspection, 2026-11-14).
 *
 * Contract under test:
 *  - service_providers gains provider_kind ('shop' |
 *    'mobile_inspector'), service_radius_miles, service_area_label,
 *    and the display-only inspection_fee; address becomes
 *    nullable-by-check (a shop must still carry one; an inspector
 *    may omit it). shop_referrals gains referral_kind.
 *  - SENTINEL: the pre-accept token view of an inspection contains
 *    NONE of the three minimum items (consumer first name, phone,
 *    precise vehicle location) and never the email; after
 *    acceptance it contains exactly those three; revealed_at is
 *    stamped on the first post-accept serve and sticky.
 *  - Repair referrals serve no inspection object and no minimum,
 *    even after acceptance.
 *  - Decline escalates to hop 2 as an inspection (kind inherited),
 *    and hop 2's pre-accept view is clean again.
 *  - submit_inspection_report files the structured report once,
 *    stamps checklist_version, moves the hop to outcome_reported,
 *    and refuses repair referrals; owner confirmation completes
 *    the inspection, and referral_response_report's by_kind shows
 *    the inspection completion with repair completions at zero.
 *
 * The scenarios run against the real migrations (Phase 1, Brief 3,
 * Brief 2, and the checklist v3 migration) replayed on PGlite with
 * the platform stubs in src/test/referral-migration-stubs.sql, in
 * a Node child process (src/test/inspection-migration-worker.mjs).
 *
 * Checklist v3 contract under test (scenarios v3-*):
 *  - inspection_details gains known_issues; the staging table and
 *    the report's findings_filed_at / comparison_verdicts exist.
 *  - SENTINEL (comparison seal): before the stage-1 findings are
 *    filed, the token view contains no pre_assessment, no
 *    suspected-cause names, and no likelihoods — including
 *    through diagnosis_details, which the base view serves.
 *    After filing, causes are served by name and id only; the
 *    likelihood joins the record only inside the filed report.
 *  - Verdicts cannot be filed without a stage-1 filing; the
 *    final filing refuses missing/incomplete verdicts; a job
 *    with no causes files single-step and refuses stray verdicts.
 */
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

interface ScenarioResult {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
}

const results = new Map<string, ScenarioResult>();

beforeAll(async () => {
  const workerPath = resolve(
    process.cwd(),
    "src/test/inspection-migration-worker.mjs",
  );
  const { stdout } = await execFileAsync("node", [workerPath], {
    timeout: 180_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as ScenarioResult[];
  for (const result of parsed) results.set(result.id, result);
}, 200_000);

function scenario(id: string): ScenarioResult {
  const result = results.get(id);
  if (!result) throw new Error(`worker did not report scenario "${id}"`);
  return result;
}

describe("Mobility Brief 2 — inspection migration", () => {
  it("adds the kind columns, the agreed fee, and the address check as specified", () => {
    const result = scenario("columns");
    expect(result.pass, result.detail).toBe(true);
  });

  it("keeps the pre-accept inspection view free of the three minimum items", () => {
    const result = scenario("pre-accept-sentinel");
    expect(result.pass, result.detail).toBe(true);
  });

  it("never serves the minimum for a repair referral, even after acceptance", () => {
    const result = scenario("repair-no-minimum");
    expect(result.pass, result.detail).toBe(true);
  });

  it("reveals exactly the three items after acceptance and stamps revealed_at", () => {
    const result = scenario("post-accept-reveal");
    expect(result.pass, result.detail).toBe(true);
  });

  it("stamps revealed_at once, on the first post-accept serve", () => {
    const result = scenario("revealed-at-sticky");
    expect(result.pass, result.detail).toBe(true);
  });

  it("escalates hop 2 as an inspection with a clean pre-accept view", () => {
    const result = scenario("hop2-sentinel");
    expect(result.pass, result.detail).toBe(true);
  });

  it("files the report once and counts the completion as an inspection only", () => {
    const result = scenario("report-and-counting");
    expect(result.pass, result.detail).toBe(true);
  });

  it("refuses an inspection report against a repair referral", () => {
    const result = scenario("report-repair-negative");
    expect(result.pass, result.detail).toBe(true);
  });

  // Checklist v3 (20261114130000): known-issues block + the
  // sealed pre-assessment comparison block.
  it("adds the v3 columns, the staging table, and the known_issues column", () => {
    const result = scenario("v3-schema");
    expect(result.pass, result.detail).toBe(true);
  });

  it("keeps the comparison block sealed until findings are filed — no causes, no likelihoods, anywhere in the view", () => {
    const result = scenario("v3-comparison-sealed");
    expect(result.pass, result.detail).toBe(true);
  });

  it("refuses verdicts filed without a stage-1 filing (the seal cannot be bypassed)", () => {
    const result = scenario("v3-verdicts-require-staging");
    expect(result.pass, result.detail).toBe(true);
  });

  it("refuses a stage-1 filing whose known-issues checks are unmarked", () => {
    const result = scenario("v3-known-issues-gate");
    expect(result.pass, result.detail).toBe(true);
  });

  it("unseals after stage-1 filing: causes by name and id only, marks stored on the chain", () => {
    const result = scenario("v3-stage-unseals");
    expect(result.pass, result.detail).toBe(true);
  });

  it("requires complete verdicts at final filing and attaches likelihoods as issued", () => {
    const result = scenario("v3-verdicts-and-likelihood");
    expect(result.pass, result.detail).toBe(true);
  });

  it("files single-step when the job has no pre-assessment causes, and refuses stray verdicts", () => {
    const result = scenario("v3-no-causes-single-step");
    expect(result.pass, result.detail).toBe(true);
  });
});
