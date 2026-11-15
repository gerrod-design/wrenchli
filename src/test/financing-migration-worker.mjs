/**
 * Worker for financingMigration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), stubs the Supabase platform
 * objects the financing migration touches (auth schema, app_role,
 * has_role), replays the financing migration
 * (20261114160000_financing_partners.sql) and the mock seed script
 * (scripts/seed-mock-financing-partners.sql), then runs the full
 * simulated journey at the data layer and prints a JSON array of
 * results: [{ id, name, pass, detail }]. Runs as a plain Node child
 * process because the repo's Vitest setup targets jsdom, while
 * PGlite needs a Node fs.
 *
 * The scenario run doubles as the simulation transcript: every
 * step of the journey (options, link-out payload, outcomes,
 * report counts) is recorded with its actual values.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: Boolean(pass), detail: String(detail) });
}

const ADMIN_UID = "11111111-1111-4111-8111-111111111111";
// pgcrypto is passed as an extension bundle: the migration's token
// default uses gen_random_bytes, matching the production precedent
// (referral_packages), and Supabase provides pgcrypto natively.
const db = new PGlite({ extensions: { pgcrypto } });

async function asUser(uid) {
  await db.query(`select set_config('app.uid', $1, false)`, [uid ?? ""]);
}
async function trySql(sql, params = []) {
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    return e.message;
  }
}

try {
  await db.exec(`create extension if not exists pgcrypto;`);
  // Supabase platform stubs (same shape as referral-migration-stubs.sql).
  await db.exec(`
    create schema auth;
    create role authenticated nologin;
    create role anon nologin;
    create role service_role nologin;
    create table auth.users (id uuid primary key);
    create or replace function auth.uid()
    returns uuid language sql stable
    as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
    create type public.app_role as enum ('admin', 'moderator', 'user');
    create table public.user_roles (
      user_id uuid not null,
      role public.app_role not null,
      unique (user_id, role)
    );
    create or replace function public.has_role(_user_id uuid, _role public.app_role)
    returns boolean language sql stable security definer set search_path = public
    as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
    insert into auth.users (id) values ('${ADMIN_UID}');
    insert into public.user_roles (user_id, role) values ('${ADMIN_UID}', 'admin');
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261114160000_financing_partners.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

// Seed the mocks using the actual ops seed script.
try {
  await db.exec(
    readFileSync(
      new URL("../../scripts/seed-mock-financing-partners.sql", import.meta.url),
      "utf8",
    ),
  );
} catch (error) {
  console.error(`seed failed: ${error.message}`);
  process.exit(1);
}

// 1. Schema: the referral table carries no customer PII columns at all.
{
  const { rows } = await db.query(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'financing_referrals'
    order by column_name
  `);
  const names = rows.map((r) => r.column_name);
  const pii = names.filter((n) =>
    /name|email|phone|address|ssn|dob/i.test(n),
  );
  record(
    "schema-no-pii-columns",
    "financing_referrals has no name/email/phone/address columns",
    pii.length === 0,
    `columns: ${names.join(", ")}`,
  );
}

// 2. SENTINEL (a): with all five mocks active, the public list is empty.
await asUser(null);
{
  const { rows } = await db.query(
    `select * from public.list_public_financing_partners(85000)`,
  );
  record(
    "public-list-excludes-mocks",
    "public partner list is empty when only active mocks exist",
    rows.length === 0,
    `public list returned ${rows.length} row(s) with 5 active mocks seeded`,
  );
}

// 3. Public list: a real qualifying partner appears; a real
//    over-ceiling partner does not.
await db.query(`
  insert into public.financing_partners
    (name, partner_type, apr_percent, term_months, link_url_template, rank_order, is_active, is_mock)
  values
    ('Test Credit Union (real-shaped)', 'credit_union', 12.00, 12, 'https://example.invalid/apply?ref={token}', 10, true, false),
    ('Test Over-Ceiling Bank (real-shaped)', 'large_bank', 29.99, 12, 'https://example.invalid/apply?ref={token}', 20, true, false)
`);
{
  const { rows } = await db.query(
    `select name, apr_percent from public.list_public_financing_partners(85000)`,
  );
  const names = rows.map((r) => r.name);
  record(
    "public-list-real-and-ceiling",
    "public list shows the real qualifying partner and excludes the real over-ceiling partner",
    names.length === 1 && names[0] === "Test Credit Union (real-shaped)",
    `public list: ${JSON.stringify(names)}`,
  );
}

// 4. Simulation options (admin): mocks listed, ceiling filter shown.
await asUser(ADMIN_UID);
let simRows;
{
  const { rows } = await db.query(
    `select name, qualifies, exclusion_reason from public.list_simulation_financing_options(85000)`,
  );
  simRows = rows;
  const over = rows.find((r) => r.name === "Mock Over-Ceiling Lender");
  const qualifying = rows.filter((r) => r.qualifies);
  record(
    "simulation-options-ceiling-shown",
    "simulation options list 4 qualifying mocks and show the over-ceiling mock's exclusion reason",
    rows.length === 5 &&
      qualifying.length === 4 &&
      over &&
      over.qualifies === false &&
      /32/.test(over.exclusion_reason) &&
      /24/.test(over.exclusion_reason),
    JSON.stringify(rows),
  );
}

// 5. Simulation options are admin-only.
await asUser(null);
{
  const err = await trySql(`select * from public.list_simulation_financing_options(85000)`);
  record(
    "simulation-options-admin-only",
    "non-admin callers cannot list simulation options",
    err !== null && /admin/.test(err),
    err ?? "call unexpectedly succeeded",
  );
}

// 6. Link-out (simulation): referral for Mock Credit Union at $850.
await asUser(ADMIN_UID);
let cuToken, cuUrl, cuBand;
{
  const { rows: partners } = await db.query(
    `select id from public.financing_partners where name = 'Mock Credit Union'`,
  );
  const { rows } = await db.query(
    `select * from public.create_financing_referral($1, 85000, 'Brake repair', true)`,
    [partners[0].id],
  );
  cuToken = rows[0].token;
  cuUrl = rows[0].partner_url;
  cuBand = rows[0].amount_band;
  const { rows: stored } = await db.query(
    `select amount_band, repair_category, status from public.financing_referrals where token = $1`,
    [cuToken],
  );
  record(
    "simulation-linkout",
    "link-out mints a token, substitutes it into the partner URL, and stores only the amount band",
    Boolean(cuToken) &&
      cuUrl.includes(cuToken) &&
      cuUrl.startsWith("https://mock-partner.invalid/") &&
      cuBand === "500_1000" &&
      stored[0].amount_band === "500_1000" &&
      stored[0].repair_category === "Brake repair" &&
      stored[0].status === "sent",
    `token=${cuToken} url=${cuUrl} band=${cuBand}`,
  );
}

// 7. A mock referral cannot be minted without the simulation flag.
{
  const { rows: partners } = await db.query(
    `select id from public.financing_partners where name = 'Mock Credit Union'`,
  );
  const err = await trySql(
    `select * from public.create_financing_referral($1, 85000, 'Brake repair', false)`,
    [partners[0].id],
  );
  record(
    "mock-referral-requires-simulation",
    "creating a mock referral without the simulation flag is rejected",
    err !== null && /simulation/.test(err),
    err ?? "call unexpectedly succeeded",
  );
}

// 8. A real over-ceiling partner cannot be referred to at all.
{
  const { rows: partners } = await db.query(
    `select id from public.financing_partners where name = 'Test Over-Ceiling Bank (real-shaped)'`,
  );
  const err = await trySql(
    `select * from public.create_financing_referral($1, 85000, 'Brake repair', false)`,
    [partners[0].id],
  );
  record(
    "real-overceiling-referral-rejected",
    "creating a referral for a real over-ceiling partner is rejected by the ceiling rule",
    err !== null && /ceiling/.test(err),
    err ?? "call unexpectedly succeeded",
  );
}

// 9. Outcomes: the scripted simulation mix.
//    Credit Union: applied -> approved -> funded -> repair_completed
//    Community Bank: applied -> declined
//    National Bank: applied -> approved
//    Fintech 0%: applied -> approved -> funded
const outcomeScript = [
  ["Mock Credit Union", ["applied", "approved", "funded", "repair_completed"]],
  ["Mock Community Bank", ["applied", "declined"]],
  ["Mock National Bank", ["applied", "approved"]],
  ["Mock Fintech 0% Tier", ["applied", "approved", "funded"]],
];
const outcomeLog = [];
try {
  for (const [partnerName, kinds] of outcomeScript) {
    let token = cuToken;
    if (partnerName !== "Mock Credit Union") {
      const { rows: partners } = await db.query(
        `select id from public.financing_partners where name = $1`,
        [partnerName],
      );
      const { rows } = await db.query(
        `select * from public.create_financing_referral($1, 85000, 'Brake repair', true)`,
        [partners[0].id],
      );
      token = rows[0].token;
    }
    for (const kind of kinds) {
      const { rows } = await db.query(
        `select * from public.report_financing_outcome($1, $2)`,
        [token, kind],
      );
      outcomeLog.push(`${partnerName}: ${kind} (source=${rows[0].source})`);
      if (rows[0].source !== "simulation") {
        throw new Error(`mock outcome source was ${rows[0].source}, not simulation`);
      }
    }
  }
  record(
    "simulation-outcomes",
    "scripted outcomes are recorded against tokens with source derived as 'simulation'",
    true,
    outcomeLog.join("; "),
  );
} catch (e) {
  record("simulation-outcomes", "scripted outcomes recorded", false, e.message);
}

// 10. SENTINEL (d): report counts land under each mock partner,
//     separated from real-partner counts.
{
  const { rows } = await db.query(`select * from public.financing_outcome_report()`);
  const byName = Object.fromEntries(rows.map((r) => [r.partner_name, r]));
  const cu = byName["Mock Credit Union"];
  const cb = byName["Mock Community Bank"];
  const realOutcomeTotal = rows
    .filter((r) => !r.is_mock)
    .reduce(
      (sum, r) =>
        sum +
        Number(r.applied) + Number(r.approved) + Number(r.declined) +
        Number(r.funded) + Number(r.repair_completed),
      0,
    );
  record(
    "report-counts-separated",
    "outcome report counts the simulation under each mock partner and keeps real-partner counts separate (zero)",
    cu &&
      cu.is_mock === true &&
      Number(cu.referrals_sent) === 1 &&
      Number(cu.applied) === 1 &&
      Number(cu.approved) === 1 &&
      Number(cu.funded) === 1 &&
      Number(cu.repair_completed) === 1 &&
      cb &&
      Number(cb.applied) === 1 &&
      Number(cb.declined) === 1 &&
      realOutcomeTotal === 0,
    JSON.stringify(rows),
  );
}

// 11. The public list is STILL empty of mocks after the whole run,
//     and the two real-shaped test rows behave as before.
await asUser(null);
{
  const { rows } = await db.query(
    `select name from public.list_public_financing_partners(85000)`,
  );
  record(
    "public-list-still-clean",
    "after the full simulation, the public list still contains no mock partner",
    rows.length === 1 && rows[0].name === "Test Credit Union (real-shaped)",
    `public list: ${JSON.stringify(rows.map((r) => r.name))}`,
  );
}

console.log(JSON.stringify(results, null, 2));
