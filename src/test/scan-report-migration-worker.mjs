// PGlite proof for the scan-report import migration
// (20261026140000_scan_reports.sql) against the Garage two-layer record
// migration, following the garage-migration-worker.mjs pattern.
//
// Boots PGlite with the shared auth/storage stubs, replays the Garage
// migration (for user_vehicles, vehicle_timeline_events,
// vehicle_documents, and the ownership helper), then the scan migration,
// and exercises the RLS contract as two different owners:
//   - owner can insert an unfiled report (vehicle_id null)
//   - owner can file their own report to their own vehicle
//   - cross-owner reads, inserts, files, and updates are rejected
//   - parse_status and payload-shape check constraints hold
//   - storage paths are unique
// Prints a JSON results array on stdout; the vitest wrapper asserts it.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";
const VA = "11111111-1111-4111-8111-111111111111"; // A's vehicle
const VB = "22222222-2222-4222-8222-222222222222"; // B's vehicle

const results = [];
const record = (scenario, ok, extra = {}) => results.push({ scenario, ok, ...extra });

async function attempt(db, scenario, fn, expectError = false) {
  try {
    const value = await fn();
    record(scenario, expectError ? false : true, expectError ? { detail: "expected an error, got none" } : { value });
    return value;
  } catch (error) {
    record(scenario, expectError ? true : false, { detail: String(error?.message ?? error).slice(0, 300) });
    return undefined;
  }
}

const db = new PGlite();
try {
  await db.exec(read("./garage-migration-stubs.sql"));
  await db.exec(read("../../supabase/migrations/20261012173000_garage_two_layer_record.sql"));
  await db.exec(read("../../supabase/migrations/20261026140000_scan_reports.sql"));

  await db.exec(`
    grant select, insert, update, delete on public.scan_reports to authenticated;
    grant select, insert, update, delete on public.vehicle_timeline_events to authenticated;
    grant select, insert, update, delete on public.vehicle_documents to authenticated;
  `);

  // Seed owners and vehicles as the bootstrap role.
  await db.query(`insert into auth.users (id) values ($1), ($2)`, [A, B]);
  await db.query(
    `insert into public.user_vehicles (id, user_id, year, make, model) values ($1, $2, 2022, 'BMW', 'M850i'), ($3, $4, 2016, 'Mercedes-Benz', 'GLC300')`,
    [VA, A, VB, B],
  );

  const asUser = async (uid, fn) => {
    await db.exec("set role authenticated");
    await db.query(`select set_config('app.uid', $1, false)`, [uid]);
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  };

  // 1. Table exists with RLS enabled AND forced.
  const flags = await db.query(
    `select relrowsecurity, relforcerowsecurity from pg_class where relname = 'scan_reports'`,
  );
  record(
    "rls_enabled_and_forced",
    flags.rows[0]?.relrowsecurity === true && flags.rows[0]?.relforcerowsecurity === true,
    { value: flags.rows[0] },
  );

  const reportPath = `${A}/scan-reports/1-rs2.pdf`;
  const insertReport = (overrides = {}) => {
    const row = {
      owner_user_id: A,
      vehicle_id: null,
      source_tool: "Innova RepairSolutions2",
      report_id: "102",
      scanned_at: "2026-10-25T16:41:00Z",
      odometer: 144128,
      vin_fragment: "H32006",
      vehicle_label: "2022 BMW M850XI",
      storage_path: reportPath,
      original_filename: "rs2.pdf",
      parse_status: "parsed",
      parsed_payload: JSON.stringify({ codes: [{ code: "B7F500" }] }),
      ...overrides,
    };
    const cols = Object.keys(row);
    return db.query(
      `insert into public.scan_reports (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
      cols.map((c) => row[c]),
    );
  };

  // 2. Owner inserts an UNFILED report (no vehicle yet) — allowed.
  const inserted = await attempt(db, "owner_insert_unfiled_ok", () =>
    asUser(A, () => insertReport()),
  );
  const reportId = inserted?.rows?.[0]?.id;

  // 3. Owner reads their own report; the other owner sees nothing.
  await attempt(db, "owner_reads_own_report", async () => {
    const seen = await asUser(A, () =>
      db.query(`select count(*)::int as n from public.scan_reports`),
    );
    if (seen.rows[0].n !== 1) throw new Error(`expected 1, saw ${seen.rows[0].n}`);
    return seen.rows[0].n;
  });
  await attempt(db, "other_owner_sees_nothing", async () => {
    const seen = await asUser(B, () =>
      db.query(`select count(*)::int as n from public.scan_reports`),
    );
    if (seen.rows[0].n !== 0) throw new Error(`expected 0, saw ${seen.rows[0].n}`);
    return seen.rows[0].n;
  });

  // 4. Cross-owner INSERT (claiming B as owner while acting as A) rejected.
  await attempt(
    db,
    "cross_owner_insert_rejected",
    () => asUser(A, () => insertReport({ owner_user_id: B, storage_path: `${A}/scan-reports/2.pdf` })),
    true,
  );

  // 5. Filing to ANOTHER owner's vehicle rejected (Postgres raises on a
  // WITH CHECK violation for UPDATE); filing to own vehicle allowed.
  await attempt(
    db,
    "file_to_foreign_vehicle_rejected",
    () =>
      asUser(A, () =>
        db.query(`update public.scan_reports set vehicle_id = $1 where id = $2`, [VB, reportId]),
      ),
    true,
  );
  // Either way the row must still be unfiled afterwards.
  const stateAfterForeign = await db.query(
    `select vehicle_id from public.scan_reports where id = $1`,
    [reportId],
  );
  record(
    "foreign_file_left_row_unfiled",
    stateAfterForeign.rows[0]?.vehicle_id === null,
    { value: stateAfterForeign.rows[0] },
  );

  await attempt(db, "file_to_own_vehicle_ok", async () => {
    await asUser(A, () =>
      db.query(`update public.scan_reports set vehicle_id = $1 where id = $2`, [VA, reportId]),
    );
    const after = await db.query(
      `select vehicle_id from public.scan_reports where id = $1`,
      [reportId],
    );
    if (after.rows[0]?.vehicle_id !== VA) throw new Error("vehicle_id was not set");
    return after.rows[0].vehicle_id;
  });

  // 6. Cross-owner update cannot touch the row.
  await attempt(db, "cross_owner_update_noop", async () => {
    await asUser(B, () =>
      db.query(`update public.scan_reports set report_id = 'hacked' where id = $1`, [reportId]),
    );
    const after = await db.query(
      `select report_id from public.scan_reports where id = $1`,
      [reportId],
    );
    if (after.rows[0]?.report_id !== "102") throw new Error("row was modified by another owner");
    return after.rows[0].report_id;
  });

  // 7. Insert-time filing with a foreign vehicle is rejected by policy.
  await attempt(
    db,
    "insert_filed_to_foreign_vehicle_rejected",
    () =>
      asUser(A, () =>
        insertReport({ vehicle_id: VB, storage_path: `${A}/scan-reports/3.pdf` }),
      ),
    true,
  );

  // 8. Check constraints: parse_status vocabulary and payload shape.
  await attempt(
    db,
    "parse_status_check_constraint",
    () => asUser(A, () => insertReport({ parse_status: "bogus", storage_path: `${A}/scan-reports/4.pdf` })),
    true,
  );
  await attempt(
    db,
    "payload_must_be_object",
    () => asUser(A, () => insertReport({ parsed_payload: JSON.stringify([1, 2]), storage_path: `${A}/scan-reports/5.pdf` })),
    true,
  );

  // 9. Storage path uniqueness (one row per stored PDF).
  await attempt(
    db,
    "unique_storage_path",
    () => asUser(A, () => insertReport()),
    true,
  );

  // 10. Direct insert pre-filed to own vehicle is allowed (policy shape).
  await attempt(db, "insert_prefiled_to_own_vehicle_ok", () =>
    asUser(A, () => insertReport({ vehicle_id: VA, storage_path: `${A}/scan-reports/6.pdf` })),
  );
} catch (error) {
  record("worker_boot", false, { detail: String(error?.message ?? error).slice(0, 500) });
} finally {
  await db.close().catch(() => undefined);
}

console.log(JSON.stringify(results));
