/**
 * Tests for the Mobility Brief 3 migration (Option A: shop-arranged
 * tow / flatbed pickup and delivery, 2026-11-13).
 *
 * Contract under test:
 *  - referral_packages gains transport_requested (boolean, default
 *    false) and transport_note; shop_referrals gains
 *    transport_status (checked set), transport_charge_stated, and
 *    outcome_transport_cost.
 *  - The request lives on the package, so it survives a hop: when
 *    hop 1 declines, hop 2's token view shows the request and the
 *    note unchanged, and hop 2's status thread starts at
 *    'requested' (BEFORE INSERT trigger; the escalation engine is
 *    not modified).
 *  - set_referral_transport refuses a shop whose
 *    offers_pickup_delivery attribute is not set (no transport
 *    status can ever be set for it), refuses when the package
 *    never requested transport, and refuses before acceptance.
 *  - The outcome report keeps repair cost and transport cost in
 *    separate columns (outcome_cost excludes transport).
 *  - The owner can add the request after acceptance
 *    (request_referral_transport, owner only), and stopping the
 *    chain cancels the request with it.
 *  - Plain Phase 1 flows are unchanged.
 *
 * The scenarios run against the real migrations (Phase 1, then
 * Brief 3) replayed on PGlite (real PostgreSQL) with the platform
 * stubs in src/test/referral-migration-stubs.sql. They execute in a
 * Node child process (src/test/transport-migration-worker.mjs)
 * because this repo's Vitest environment is jsdom while PGlite
 * needs a Node filesystem; each `it` below asserts one scenario's
 * recorded outcome.
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
    "src/test/transport-migration-worker.mjs",
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

describe("Mobility Brief 3 — transport migration", () => {
  it("adds the transport columns with the brief's types, defaults, and status check", () => {
    const result = scenario("columns");
    expect(result.pass, result.detail).toBe(true);
  });

  it("keeps the transport request unchanged across a hop", () => {
    const result = scenario("flag-survives-hop");
    expect(result.pass, result.detail).toBe(true);
  });

  it("never lets a shop without the pickup/delivery attribute set a transport status", () => {
    const result = scenario("no-offer-negative");
    expect(result.pass, result.detail).toBe(true);
  });

  it("refuses transport updates when the package never requested transport", () => {
    const result = scenario("not-requested-negative");
    expect(result.pass, result.detail).toBe(true);
  });

  it("shows the request before the shop decides and walks the status after acceptance", () => {
    const result = scenario("happy-path");
    expect(result.pass, result.detail).toBe(true);
  });

  it("keeps repair cost and transport cost in separate outcome columns", () => {
    const result = scenario("outcome-separation");
    expect(result.pass, result.detail).toBe(true);
  });

  it("lets the owner add the request after acceptance, and only the owner", () => {
    const result = scenario("owner-adds-after-acceptance");
    expect(result.pass, result.detail).toBe(true);
  });

  it("cancels the transport request when the owner stops the chain", () => {
    const result = scenario("stop-cancels-transport");
    expect(result.pass, result.detail).toBe(true);
  });

  it("leaves the plain Phase 1 flow unchanged", () => {
    const result = scenario("phase1-regression");
    expect(result.pass, result.detail).toBe(true);
  });
});
