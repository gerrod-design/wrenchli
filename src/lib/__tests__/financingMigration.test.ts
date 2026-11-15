/**
 * Tests for the Repair Financing migration
 * (20261114160000_financing_partners.sql) and the mock seed script
 * (scripts/seed-mock-financing-partners.sql).
 *
 * Sentinel contract under test (2026-11-14 build brief):
 *  (a) a mock partner NEVER appears in the public financing list,
 *      even when active — before, during, and after a simulation;
 *  (b) a partner over the 24% APR ceiling is excluded from
 *      qualifying presentation, in simulation (with the reason
 *      shown) and in public (real over-ceiling partner absent);
 *  (d) mock outcomes flow into the report counts under their own
 *      partner, separated from real-partner counts.
 * (Sentinel (c), the PII-free partner payload, is covered at the
 * data layer here by the no-PII-columns scenario and at the client
 * layer in financing.test.ts.)
 *
 * Scenarios run against the real migration replayed on PGlite in a
 * Node child process (src/test/financing-migration-worker.mjs).
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
  const workerPath = resolve(process.cwd(), "src/test/financing-migration-worker.mjs");
  const { stdout } = await execFileAsync("node", [workerPath], {
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as ScenarioResult[];
  for (const result of parsed) results.set(result.id, result);
}, 200_000);

function scenario(id: string): ScenarioResult {
  const result = results.get(id);
  if (!result) throw new Error(`worker did not report scenario "${id}"`);
  return result;
}

describe("Repair Financing migration — registry, ceiling, simulation", () => {
  it("stores no customer PII columns on the referral record", () => {
    const s = scenario("schema-no-pii-columns");
    expect(s.pass, s.detail).toBe(true);
  });

  it("sentinel (a): public list excludes active mock partners", () => {
    const s = scenario("public-list-excludes-mocks");
    expect(s.pass, s.detail).toBe(true);
  });

  it("sentinel (b): public list excludes a real over-ceiling partner", () => {
    const s = scenario("public-list-real-and-ceiling");
    expect(s.pass, s.detail).toBe(true);
  });

  it("sentinel (b): simulation shows the over-ceiling exclusion and its reason", () => {
    const s = scenario("simulation-options-ceiling-shown");
    expect(s.pass, s.detail).toBe(true);
  });

  it("keeps simulation options admin-only", () => {
    const s = scenario("simulation-options-admin-only");
    expect(s.pass, s.detail).toBe(true);
  });

  it("mints a simulation link-out with token, banded amount, and no exact figure stored", () => {
    const s = scenario("simulation-linkout");
    expect(s.pass, s.detail).toBe(true);
  });

  it("rejects a mock referral minted without the simulation flag", () => {
    const s = scenario("mock-referral-requires-simulation");
    expect(s.pass, s.detail).toBe(true);
  });

  it("rejects a referral for a real over-ceiling partner", () => {
    const s = scenario("real-overceiling-referral-rejected");
    expect(s.pass, s.detail).toBe(true);
  });

  it("records scripted mock outcomes with source 'simulation'", () => {
    const s = scenario("simulation-outcomes");
    expect(s.pass, s.detail).toBe(true);
  });

  it("sentinel (d): report counts mock outcomes under their partner, separate from real partners", () => {
    const s = scenario("report-counts-separated");
    expect(s.pass, s.detail).toBe(true);
  });

  it("sentinel (a): public list is still mock-free after the full simulation", () => {
    const s = scenario("public-list-still-clean");
    expect(s.pass, s.detail).toBe(true);
  });
});
