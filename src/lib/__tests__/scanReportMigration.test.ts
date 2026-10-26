import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

type MigrationResult = {
  scenario: string;
  ok: boolean;
  value?: unknown;
  detail?: string;
};

/**
 * Runs the scan-report migration proof in a plain Node worker (PGlite
 * deadlocks under vitest's jsdom environment — same pattern as the
 * journey/garage migration proofs) and asserts every scenario passed.
 */
describe("scan report migration (PGlite)", () => {
  it(
    "applies cleanly and enforces owner isolation + confirm-to-file RLS",
    async () => {
      // Vitest serves test modules over http URLs, so import.meta.url
      // cannot be resolved to a filesystem path; tests run from repo root.
      const worker = resolve(
        process.cwd(),
        "src/test/scan-report-migration-worker.mjs",
      );
      const { stdout } = await execFileAsync("node", [worker], {
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
      });
      const results = JSON.parse(stdout.trim()) as MigrationResult[];
      const byScenario = new Map(results.map((r) => [r.scenario, r]));

      for (const scenario of [
        "rls_enabled_and_forced",
        "owner_insert_unfiled_ok",
        "owner_reads_own_report",
        "other_owner_sees_nothing",
        "cross_owner_insert_rejected",
        "file_to_foreign_vehicle_rejected",
        "foreign_file_left_row_unfiled",
        "file_to_own_vehicle_ok",
        "cross_owner_update_noop",
        "insert_filed_to_foreign_vehicle_rejected",
        "parse_status_check_constraint",
        "payload_must_be_object",
        "unique_storage_path",
        "insert_prefiled_to_own_vehicle_ok",
      ]) {
        const result = byScenario.get(scenario);
        expect(result, `missing scenario ${scenario}`).toBeDefined();
        expect(
          result!.ok,
          `${scenario} failed: ${result!.detail ?? ""}`,
        ).toBe(true);
      }
    },
    120_000,
  );
});
