/**
 * Tests for the Mobility Brief 1 migration
 * (20261113120000_mobility_transport_attributes.sql).
 *
 * Contract under test:
 *  - The four mobility columns land on public.service_providers
 *    with the brief's types: three booleans NOT NULL DEFAULT false
 *    (offers_loaner / offers_shuttle / offers_pickup_delivery) and
 *    mobility_notes as nullable text.
 *  - Existing and new rows default to unset (false / NULL) so the
 *    panel renders nothing for shops ops has not attested.
 *  - mobility_notes is length-capped at 200 characters.
 *
 * The scenarios run against the real migration replayed on PGlite
 * (real PostgreSQL) over a minimal pre-migration table. They
 * execute in a Node child process
 * (src/test/mobility-migration-worker.mjs) because this repo's
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
  const workerPath = resolve(process.cwd(), "src/test/mobility-migration-worker.mjs");
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

describe("Mobility Brief 1 migration — service_providers mobility attributes", () => {
  it("adds the four columns with the brief's types and defaults", () => {
    const s = scenario("columns");
    expect(s.pass, s.detail).toBe(true);
  });

  it("backfills existing rows to unset", () => {
    const s = scenario("backfill");
    expect(s.pass, s.detail).toBe(true);
  });

  it("defaults new rows to unset", () => {
    const s = scenario("insert-defaults");
    expect(s.pass, s.detail).toBe(true);
  });

  it("lets ops set attributes and a shop note", () => {
    const s = scenario("set-values");
    expect(s.pass, s.detail).toBe(true);
  });

  it("enforces the 200-character cap on mobility_notes", () => {
    const s = scenario("notes-cap");
    expect(s.pass, s.detail).toBe(true);
  });
});
