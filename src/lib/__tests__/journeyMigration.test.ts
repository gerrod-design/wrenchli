// This test suite validates the SQL contract defined by
// supabase/migrations/20261015133000_journey_plan.sql:
//   - the journey_plans, journey_plan_selections, vehicle_service_contracts
//     and shop_capabilities tables exist and have RLS enabled
//   - layer/source_type provenance columns default correctly for
//     owner-authored rows vs. shop-authored rows
//   - owners can only see their own journey plans / service contracts
//   - shop_capabilities is publicly readable but not publicly writable
//   - check constraints reject invalid budget_tier / capability values
//
// We cannot exercise real Postgres RLS policies, auth.uid(), or role
// switching (set role authenticated/anon) inside jsdom/vitest directly — the
// environment has no SQL engine. Instead we shell out to a plain Node child
// process (src/test/journey-migration-worker.mjs) that boots an in-memory
// Postgres-compatible database via @electric-sql/pglite, applies the platform
// stubs and the migration under test, runs each scenario, and prints a JSON
// array of results on stdout. This test file just invokes that worker and
// asserts on the results it reports.

import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const execFileAsync = promisify(execFile);

type ScenarioResult = {
  id: string;
  name: string;
  pass: boolean;
  detail: string;
};

describe('journey plan migration (via PGlite worker)', () => {
  let results: Map<string, ScenarioResult>;

  beforeAll(async () => {
    // Vitest serves test modules over http URLs, so import.meta.url cannot
    // be resolved to a filesystem path here; tests run from the repo root.
    const workerPath = resolve(
      process.cwd(),
      "src/test/journey-migration-worker.mjs",
    );

    const { stdout } = await execFileAsync('node', [workerPath], {
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024,
    });

    const parsed: ScenarioResult[] = JSON.parse(stdout.trim());
    results = new Map(parsed.map((r) => [r.id, r]));
  }, 180_000);

  it('tables_exist', () => {
    const r = results.get('tables_exist');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('rls_enabled', () => {
    const r = results.get('rls_enabled');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('provenance_defaults', () => {
    const r = results.get('provenance_defaults');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('owner_isolation', () => {
    const r = results.get('owner_isolation');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('contracts_isolation', () => {
    const r = results.get('contracts_isolation');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('capabilities_public_read', () => {
    const r = results.get('capabilities_public_read');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('capabilities_no_public_write', () => {
    const r = results.get('capabilities_no_public_write');
    expect(r?.pass, r?.detail).toBe(true);
  });

  it('check_constraints', () => {
    const r = results.get('check_constraints');
    expect(r?.pass, r?.detail).toBe(true);
  });
});
