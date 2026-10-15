/**
 * Regression tests for the Garage migration's condition-check timeline
 * trigger (`log_vehicle_condition_check_change`).
 *
 * The brief's contract is: every STATUS CHANGE on a condition check writes
 * exactly one timeline event carrying the evidence. A note-only edit is not
 * a status change — the note lives on the check itself.
 *
 * GATE-A1 (Phase A gate, 2026-10-14): a note-only edit on an already-checked
 * row used to write a SECOND timeline event with the identical title, so one
 * recording appeared twice on the observed timeline.
 *
 * The scenarios run against the real migration replayed on PGlite (real
 * PostgreSQL) with the platform stubs in src/test/garage-migration-stubs.sql
 * — the same stub set the Phase A gate harness used. They execute in a Node
 * child process (src/test/garage-migration-worker.mjs) because this repo's
 * Vitest environment is jsdom while PGlite needs a Node filesystem; each
 * `it` below asserts one scenario's recorded outcome.
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
    "src/test/garage-migration-worker.mjs",
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

describe("Garage condition-check timeline trigger", () => {
  it("writes exactly one timeline event when a checked check gets a note-only edit (GATE-A1)", () => {
    const result = scenario("gate-a1");
    expect(result.pass, result.detail).toBe(true);
  });

  it("writes no timeline event for a note-only update on a not_checked check (D3 sibling)", () => {
    const result = scenario("d3-sibling");
    expect(result.pass, result.detail).toBe(true);
  });

  it("writes exactly one timeline event per status change", () => {
    const result = scenario("status-changes");
    expect(result.pass, result.detail).toBe(true);
  });

  it("writes a timeline event when evidence media changes without a status change", () => {
    const result = scenario("media-change");
    expect(result.pass, result.detail).toBe(true);
  });
});
