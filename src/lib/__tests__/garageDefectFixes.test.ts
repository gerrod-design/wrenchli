/**
 * Regression tests for two Garage defects fixed by migration
 * 20261015120000:
 *
 * (DEFECT-1) The baseline completion RPC now normalizes vehicle models
 * before matching them against weak-point definitions, so a vehicle whose
 * model carries the NHTSA "-Class" suffix (e.g. "GLC-Class") is correctly
 * required to answer the GLC X253 weak-point check before its baseline can
 * complete. Previously the unnormalized model string failed to match the
 * weak-point library entry, silently skipping the required check.
 *
 * (DEFECT-2) Parent-driven cascade deletes (deleting a vehicle, deleting an
 * account) now succeed through the append-only/immutability guard triggers
 * that protect Garage timeline events and completed baselines. Direct
 * mutation of a live vehicle's timeline events and direct deletion of a
 * completed baseline must still fail closed, as before.
 *
 * These scenarios are run against the real migrations replayed on PGlite in
 * a Node child process (src/test/garage-defect-fix-worker.mjs), because the
 * repo's Vitest environment is jsdom and cannot run PGlite/Postgres
 * migrations directly in-process.
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

let results: Map<string, ScenarioResult>;

beforeAll(async () => {
  const workerPath = resolve(process.cwd(), "src/test/garage-defect-fix-worker.mjs");

  const { stdout } = await execFileAsync("node", [workerPath], {
    timeout: 180_000,
    maxBuffer: 4 * 1024 * 1024,
  });

  const parsed: ScenarioResult[] = JSON.parse(stdout);
  results = new Map(parsed.map((result) => [result.id, result]));
}, 200_000);

function scenario(id: string): ScenarioResult {
  const result = results.get(id);
  if (!result) {
    throw new Error(`Worker did not report a result for scenario "${id}"`);
  }
  return result;
}

describe("Garage defect fixes (weak-point model matching + cascade deletes)", () => {
  it("refuses baseline completion for a GLC-Class vehicle until the X253 weak-point check is answered", () => {
    const result = scenario("rpc-glc-class-refused");
    expect(result.pass, result.detail).toBe(true);
  });

  it("completes the GLC-Class baseline once the weak-point check is answered, writing exactly one completion event", () => {
    const result = scenario("rpc-glc-class-completes");
    expect(result.pass, result.detail).toBe(true);
  });

  it("still refuses completion for the other five library models (and the short Silverado form) until their weak-point checks are answered", () => {
    const result = scenario("rpc-other-models-refused");
    expect(result.pass, result.detail).toBe(true);
  });

  it("deletes a vehicle with a completed baseline and timeline events, removing all of its Garage rows", () => {
    const result = scenario("vehicle-delete-cascades");
    expect(result.pass, result.detail).toBe(true);
  });

  it("still blocks direct delete and update of a timeline event on a live vehicle (append-only)", () => {
    const result = scenario("event-direct-mutation-blocked");
    expect(result.pass, result.detail).toBe(true);
  });

  it("still blocks direct deletion of a completed baseline while its vehicle exists", () => {
    const result = scenario("baseline-direct-delete-blocked");
    expect(result.pass, result.detail).toBe(true);
  });

  it("deletes an account and cascades all of its Garage rows", () => {
    const result = scenario("account-delete-cascades");
    expect(result.pass, result.detail).toBe(true);
  });
});
