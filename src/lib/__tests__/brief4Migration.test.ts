/**
 * Tests for the Brief 4 trust-loop migration
 * (20261115120000_pre_assessment_brief4_trust_loop.sql).
 *
 * Contract under test:
 *  - referral_packages gains a nullable session_id (FK to
 *    diagnostic_sessions, indexed); packages with an unresolved
 *    origin session keep it NULL.
 *  - diagnostic_accuracy gains source with default
 *    'consumer_self_report' and a two-value CHECK, and its
 *    uniqueness moves from (session_id) to (session_id, source):
 *    a self-report grade and a shop grade coexist for one
 *    session, while a duplicate (session, source) is rejected.
 *  - The validate_diagnostic_accuracy trigger needs no change
 *    for the new source and still guards shop rows.
 *
 * The scenarios run against the real migration replayed on
 * PGlite (real PostgreSQL) over the platform stubs in
 * src/test/referral-migration-stubs.sql and
 * src/test/brief4-migration-stubs.sql, executed in a Node child
 * process (src/test/brief4-migration-worker.mjs) because this
 * repo's Vitest environment is jsdom while PGlite needs a Node
 * filesystem; each `it` below asserts one scenario's outcome.
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
    "src/test/brief4-migration-worker.mjs",
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

describe("Brief 4 migration — referral_packages.session_id", () => {
  it("is nullable: a package with an unresolved origin session stores NULL", () => {
    const s = scenario("pkg-session-null");
    expect(s.pass, s.detail).toBe(true);
  });

  it("is FK-checked against diagnostic_sessions", () => {
    const s = scenario("pkg-session-fk");
    expect(s.pass, s.detail).toBe(true);
  });

  it("is indexed", () => {
    const s = scenario("pkg-session-index");
    expect(s.pass, s.detail).toBe(true);
  });
});

describe("Brief 4 migration — diagnostic_accuracy.source", () => {
  it("defaults existing-style inserts to consumer_self_report", () => {
    const s = scenario("source-default");
    expect(s.pass, s.detail).toBe(true);
  });

  it("rejects source values outside the two-value vocabulary", () => {
    const s = scenario("source-check");
    expect(s.pass, s.detail).toBe(true);
  });

  it("lets one session hold a self-report grade and a shop grade", () => {
    const s = scenario("two-sources-coexist");
    expect(s.pass, s.detail).toBe(true);
  });

  it("rejects a duplicate (session_id, source) grade", () => {
    const s = scenario("same-source-duplicate-rejected");
    expect(s.pass, s.detail).toBe(true);
  });

  it("accepts snapshot grades with NULL session_id", () => {
    const s = scenario("null-session-shop-grades");
    expect(s.pass, s.detail).toBe(true);
  });

  it("leaves validate_diagnostic_accuracy guarding shop rows (score range, label vocabulary)", () => {
    const s = scenario("trigger-guards-shop-rows");
    expect(s.pass, s.detail).toBe(true);
  });
});
