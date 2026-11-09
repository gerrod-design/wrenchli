/**
 * Regression tests for the Referral Phase 1 migration's stop-the-chain
 * follow-up (Decision 3: "The owner is notified at each hop and can
 * stop the chain at any time").
 *
 * Contract under test:
 *  - stop_referral_chain (owner only) cancels the chain's active
 *    'sent'/'viewed' hop in place; responded_at stays null.
 *  - A cancelled hop NEVER escalates: process_referral_escalations
 *    does not expire/escalate it even past its window, and
 *    escalate_shop_referral refuses it directly.
 *  - respond_to_referral answers a cancelled hop with
 *    no_active_referral / status 'cancelled'.
 *  - Regressions: a normal decline and a normal window expiry still
 *    escalate to the next shop in the owner's chain.
 *
 * The scenarios run against the real migration replayed on PGlite
 * (real PostgreSQL) with the platform stubs in
 * src/test/referral-migration-stubs.sql. They execute in a Node child
 * process (src/test/referral-migration-worker.mjs) because this repo's
 * Vitest environment is jsdom while PGlite needs a Node filesystem;
 * each `it` below asserts one scenario's recorded outcome.
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
  // Vitest serves test modules over http URLs, so import.meta.url cannot be
  // resolved to a filesystem path here; tests run from the repo root.
  const workerPath = resolve(
    process.cwd(),
    "src/test/referral-migration-worker.mjs",
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

describe("Referral Phase 1 — stop the chain", () => {
  it("cancels a sent hop in place when the owner stops the chain", () => {
    const result = scenario("stop-sent");
    expect(result.pass, result.detail).toBe(true);
  });

  it("never escalates a cancelled chain, even past its window", () => {
    const result = scenario("cancelled-never-escalates");
    expect(result.pass, result.detail).toBe(true);
  });

  it("answers respond_to_referral with no_active_referral for a cancelled hop", () => {
    const result = scenario("respond-rejects-cancelled");
    expect(result.pass, result.detail).toBe(true);
  });

  it("rejects a stop attempt by a non-owner", () => {
    const result = scenario("non-owner-cannot-stop");
    expect(result.pass, result.detail).toBe(true);
  });

  it("still escalates on a normal decline", () => {
    const result = scenario("decline-still-escalates");
    expect(result.pass, result.detail).toBe(true);
  });

  it("still escalates on a normal window expiry", () => {
    const result = scenario("expiry-still-escalates");
    expect(result.pass, result.detail).toBe(true);
  });
});
