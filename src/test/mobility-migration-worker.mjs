/**
 * Worker for mobilityTransportMigration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), creates a minimal pre-Brief-1
 * public.service_providers table with one existing row, replays
 * the Mobility Brief 1 migration
 * (20261113120000_mobility_transport_attributes.sql), and prints a
 * JSON array of results: [{ id, name, pass, detail }]. Runs as a
 * plain Node child process because the repo's Vitest setup targets
 * jsdom, while PGlite needs a Node fs.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: Boolean(pass), detail: String(detail) });
}

const db = new PGlite();
try {
  // Pre-migration shape (subset of the real table) + one live row.
  await db.exec(`
    create table public.service_providers (
      id uuid primary key,
      name text not null,
      address text not null default '',
      zip_code text not null default ''
    );
    insert into public.service_providers (id, name)
      values ('aaaaaaaa-0000-0000-0000-00000000000a', 'Existing Shop');
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261113120000_mobility_transport_attributes.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

// 1. Columns exist with the brief's types, nullability, defaults.
{
  const { rows } = await db.query(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'service_providers'
      and column_name in ('offers_loaner','offers_shuttle','offers_pickup_delivery','mobility_notes')
    order by column_name
  `);
  const byName = Object.fromEntries(rows.map((r) => [r.column_name, r]));
  const boolOk = ["offers_loaner", "offers_pickup_delivery", "offers_shuttle"].every(
    (c) =>
      byName[c] &&
      byName[c].data_type === "boolean" &&
      byName[c].is_nullable === "NO" &&
      byName[c].column_default === "false",
  );
  const notesOk =
    byName.mobility_notes &&
    byName.mobility_notes.data_type === "text" &&
    byName.mobility_notes.is_nullable === "YES";
  record(
    "columns",
    "migration adds the four mobility columns with the brief's types and defaults",
    rows.length === 4 && boolOk && notesOk,
    JSON.stringify(rows),
  );
}

// 2. The pre-existing row is backfilled to unset (false / NULL).
{
  const { rows } = await db.query(`
    select offers_loaner, offers_shuttle, offers_pickup_delivery, mobility_notes
    from public.service_providers
    where id = 'aaaaaaaa-0000-0000-0000-00000000000a'
  `);
  const r = rows[0] ?? {};
  record(
    "backfill",
    "existing rows default to unset: all offers false, notes NULL",
    r.offers_loaner === false &&
      r.offers_shuttle === false &&
      r.offers_pickup_delivery === false &&
      r.mobility_notes === null,
    JSON.stringify(r),
  );
}

// 3. New rows inserted without the columns get the same unset defaults.
{
  const { rows } = await db.query(`
    insert into public.service_providers (id, name)
      values ('bbbbbbbb-0000-0000-0000-00000000000b', 'New Shop')
    returning offers_loaner, offers_shuttle, offers_pickup_delivery, mobility_notes
  `);
  const r = rows[0] ?? {};
  record(
    "insert-defaults",
    "new rows default to unset when the columns are not written",
    r.offers_loaner === false &&
      r.offers_shuttle === false &&
      r.offers_pickup_delivery === false &&
      r.mobility_notes === null,
    JSON.stringify(r),
  );
}

// 4. Attributes and a note can be set (the ops-entry path).
{
  await db.query(`
    update public.service_providers
    set offers_loaner = true, offers_pickup_delivery = true,
        mobility_notes = 'Loaner with any repair over $500'
    where id = 'aaaaaaaa-0000-0000-0000-00000000000a'
  `);
  const { rows } = await db.query(`
    select offers_loaner, offers_shuttle, offers_pickup_delivery, mobility_notes
    from public.service_providers
    where id = 'aaaaaaaa-0000-0000-0000-00000000000a'
  `);
  const r = rows[0] ?? {};
  record(
    "set-values",
    "ops can set attributes and a shop note",
    r.offers_loaner === true &&
      r.offers_shuttle === false &&
      r.offers_pickup_delivery === true &&
      r.mobility_notes === "Loaner with any repair over $500",
    JSON.stringify(r),
  );
}

// 5. The notes length cap (200 chars) is enforced.
{
  let rejected = false;
  try {
    await db.query(
      `update public.service_providers set mobility_notes = $1
       where id = 'aaaaaaaa-0000-0000-0000-00000000000a'`,
      ["x".repeat(201)],
    );
  } catch {
    rejected = true;
  }
  let accepted = true;
  try {
    await db.query(
      `update public.service_providers set mobility_notes = $1
       where id = 'aaaaaaaa-0000-0000-0000-00000000000a'`,
      ["x".repeat(200)],
    );
  } catch {
    accepted = false;
  }
  record(
    "notes-cap",
    "mobility_notes is length-capped at 200 characters",
    rejected && accepted,
    `201 chars rejected: ${rejected}; 200 chars accepted: ${accepted}`,
  );
}

console.log(JSON.stringify(results));
