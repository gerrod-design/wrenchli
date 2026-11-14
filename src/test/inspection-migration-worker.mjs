/**
 * Worker for inspectionBrief2Migration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), replays the platform stubs, the
 * Referral Phase 1 migration, the Mobility Brief 3 migration, and
 * the Mobility Brief 2 migration
 * (20261114120000_mobility_brief2_inspection.sql), then runs the
 * inspection scenarios and prints a JSON array of results:
 * [{ id, name, pass, detail }]. Runs as a plain Node child process
 * because the repo's Vitest setup targets jsdom, while PGlite
 * needs a Node fs.
 *
 * The stubs' service_providers carries only id + name; the shipped
 * Brief 1 attribute (offers_pickup_delivery) and the real table's
 * address / zip_code columns are added directly below to simulate
 * the shipped state Brief 2 builds on.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const OWNER = "11111111-1111-1111-1111-111111111111";
const ADMIN = "33333333-3333-3333-3333-333333333333";
const INSP_A = "aaaaaaaa-0000-0000-0000-00000000000a"; // mobile inspector
const INSP_B = "bbbbbbbb-0000-0000-0000-00000000000b"; // mobile inspector
const SHOP_A = "cccccccc-0000-0000-0000-00000000000c"; // repair shop

const FIRST = "SENTFIRST";
const PHONE = "555-0199-SENTINEL";
const LOCATION = "123 Sentinel Street, Driveway";
const EMAIL = "sentinel-owner@example.com";

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: Boolean(pass), detail: String(detail) });
}

const db = new PGlite();
try {
  await db.exec(
    readFileSync(new URL("./referral-migration-stubs.sql", import.meta.url), "utf8"),
  );
  // Simulate shipped state Brief 2 builds on: Brief 1's attribute
  // plus the real service_providers address columns.
  await db.exec(`
    alter table public.service_providers
      add column address text,
      add column zip_code text,
      add column offers_pickup_delivery boolean not null default false;
  `);
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/20261109120000_referral_phase1.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/20261113140000_mobility_brief3_transport.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/20261114120000_mobility_brief2_inspection.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/20261114130000_mobility_brief2_checklist_v3.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(`
    insert into auth.users (id) values ('${OWNER}'), ('${ADMIN}');
    insert into public.user_roles (user_id, role) values ('${ADMIN}', 'admin');
    insert into public.service_providers (id, name, address, zip_code) values
      ('${SHOP_A}', 'Repair Shop A', '1 Shop Way', '48201');
  `);
  // Mobile inspectors: no street address (nullable-by-check), a
  // service-area label, radius, and (for A) an agreed fee.
  await db.query(
    `insert into public.service_providers
       (id, name, provider_kind, service_area_label, service_radius_miles, inspection_fee, zip_code)
     values ($1, 'Inspector A', 'mobile_inspector', 'Mobile — serves Detroit metro', 25, 95, '48201'),
            ($2, 'Inspector B', 'mobile_inspector', 'Mobile — serves Detroit metro', 15, null, '48201')`,
    [INSP_A, INSP_B],
  );
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

async function setUid(uid) {
  await db.query(`select set_config('app.uid', $1, false)`, [uid ?? ""]);
}

async function newPackage(token, { customerEmail = null } = {}) {
  const r = await db.query(
    `insert into public.referral_packages
       (token, user_id, diagnosis_title, customer_email, zip_code)
     values ($1, $2, 'Grinding noise when braking', $3, '48201') returning id`,
    [token, OWNER, customerEmail],
  );
  return r.rows[0].id;
}

async function newHop(packageId, shopId, chain, { kind = "repair", chainId = null } = {}) {
  const r = await db.query(
    `insert into public.shop_referrals
       (package_id, shop_id, owner_user_id, chain_id, shop_chain, preference_order, status, referral_kind)
     values ($1, $2, $3, $4, $5::jsonb, 1, 'sent', $6) returning id, chain_id`,
    [packageId, shopId, OWNER, chainId ?? crypto.randomUUID(), JSON.stringify(chain), kind],
  );
  return r.rows[0];
}

async function newDetails(chainId, packageId) {
  await db.query(
    `insert into public.inspection_details
       (chain_id, package_id, owner_user_id, vehicle_location_text,
        location_descriptor, location_zip, preferred_windows,
        consumer_first_name, consumer_phone)
     values ($1, $2, $3, $4, 'Driveway', '48201', 'Weekday mornings', $5, $6)`,
    [chainId, packageId, OWNER, LOCATION, FIRST, PHONE],
  );
}

async function tokenView(token) {
  const r = await db.query(`select public.get_referral_package_by_token($1) as v`, [token]);
  return r.rows[0].v;
}

async function respond(token, accept) {
  const r = await db.query(`select public.respond_to_referral($1, $2) as v`, [token, accept]);
  return r.rows[0].v;
}

function leaksMinimum(view) {
  const raw = JSON.stringify(view ?? {});
  return raw.includes(FIRST) || raw.includes(PHONE) || raw.includes(LOCATION);
}

// --- Scenario: schema shape -------------------------------------------
try {
  const cols = await db.query(`
    select
      (select provider_kind from public.service_providers where id = '${SHOP_A}') as shop_kind,
      (select address is null from public.service_providers where id = '${INSP_A}') as insp_no_address,
      (select inspection_fee from public.service_providers where id = '${INSP_A}') as fee_a,
      (select inspection_fee from public.service_providers where id = '${INSP_B}') as fee_b
  `);
  let shopNoAddressRejected = false;
  try {
    await db.query(
      `insert into public.service_providers (id, name, provider_kind, zip_code)
       values ('dddddddd-0000-0000-0000-00000000000d', 'No Address Shop', 'shop', '48201')`,
    );
  } catch {
    shopNoAddressRejected = true;
  }
  const c = cols.rows[0];
  record(
    "columns",
    "provider/referral kind columns, fee, and the address check land as specified",
    c.shop_kind === "shop" &&
      c.insp_no_address === true &&
      Number(c.fee_a) === 95 &&
      c.fee_b === null &&
      shopNoAddressRejected,
    JSON.stringify({ ...c, shopNoAddressRejected }),
  );
} catch (e) {
  record("columns", "columns", false, e.message);
}

// --- Inspection chain fixture (shared by the sentinel scenarios) ------
const inspPkg = await newPackage("insp-token", { customerEmail: EMAIL });
const inspChain = [INSP_A, INSP_B];
const inspHop1 = await newHop(inspPkg, INSP_A, inspChain, { kind: "inspection" });
await newDetails(inspHop1.chain_id, inspPkg);

// --- Scenario: pre-accept sentinel ------------------------------------
try {
  const view = await tokenView("insp-token");
  const insp = view?.inspection ?? {};
  record(
    "pre-accept-sentinel",
    "pre-accept inspection view contains none of the three minimum items",
    view?.visit_minimum == null &&
      !leaksMinimum(view) &&
      !JSON.stringify(view ?? {}).includes(EMAIL) &&
      insp.location_descriptor === "Driveway" &&
      insp.location_zip === "48201" &&
      insp.preferred_windows === "Weekday mornings" &&
      view?.active_referral?.referral_kind === "inspection",
    JSON.stringify(view),
  );
} catch (e) {
  record("pre-accept-sentinel", "pre-accept sentinel", false, e.message);
}

// --- Scenario: repair referrals never serve the minimum --------------
try {
  const repairPkg = await newPackage("repair-token");
  await newHop(repairPkg, SHOP_A, [SHOP_A], { kind: "repair" });
  await respond("repair-token", true);
  const view = await tokenView("repair-token");
  record(
    "repair-no-minimum",
    "an accepted repair referral serves no inspection object and no visit minimum",
    view?.inspection == null && view?.visit_minimum == null && !leaksMinimum(view),
    JSON.stringify(view),
  );
} catch (e) {
  record("repair-no-minimum", "repair no minimum", false, e.message);
}

// --- Scenario: post-accept reveal is exactly the three items ---------
let firstRevealAt = null;
try {
  await respond("insp-token", true);
  const view = await tokenView("insp-token");
  const min = view?.visit_minimum ?? {};
  const keys = Object.keys(min).sort();
  const det = await db.query(
    `select revealed_at from public.inspection_details where chain_id = $1`,
    [inspHop1.chain_id],
  );
  firstRevealAt = det.rows[0]?.revealed_at ?? null;
  record(
    "post-accept-reveal",
    "post-accept view contains exactly first name, phone, and vehicle location; revealed_at stamped",
    min.consumer_first_name === FIRST &&
      min.consumer_phone === PHONE &&
      min.vehicle_location_text === LOCATION &&
      keys.length === 4 &&
      keys.includes("revealed_at") &&
      firstRevealAt != null &&
      !JSON.stringify(view ?? {}).includes(EMAIL),
    JSON.stringify({ keys, firstRevealAt }),
  );
} catch (e) {
  record("post-accept-reveal", "post-accept reveal", false, e.message);
}

// --- Scenario: revealed_at is stamped once ----------------------------
try {
  const view = await tokenView("insp-token");
  record(
    "revealed-at-sticky",
    "a second post-accept serve keeps the first revealed_at",
    view?.visit_minimum?.revealed_at != null &&
      new Date(view.visit_minimum.revealed_at).getTime() ===
        new Date(firstRevealAt).getTime(),
    JSON.stringify(view?.visit_minimum ?? {}),
  );
} catch (e) {
  record("revealed-at-sticky", "revealed_at sticky", false, e.message);
}

// --- Scenario: hop 2 is clean again and inherits the kind ------------
try {
  const pkg2 = await newPackage("insp2-token");
  const chainId = crypto.randomUUID();
  const hop1 = await newHop(pkg2, INSP_A, inspChain, { kind: "inspection", chainId });
  await newDetails(chainId, pkg2);
  await respond("insp2-token", false);
  const hop2 = await db.query(
    `select * from public.shop_referrals where escalated_from = $1`,
    [hop1.id],
  );
  const view = await tokenView("insp2-token");
  record(
    "hop2-sentinel",
    "decline escalates to hop 2 as an inspection, and hop 2's pre-accept view is clean",
    hop2.rows.length === 1 &&
      hop2.rows[0].referral_kind === "inspection" &&
      view?.visit_minimum == null &&
      !leaksMinimum(view) &&
      view?.active_referral?.shop_id === INSP_B,
    JSON.stringify({ hop2: hop2.rows[0] ?? null, view }),
  );
} catch (e) {
  record("hop2-sentinel", "hop 2 sentinel", false, e.message);
}

// --- Scenario: structured report filing + counting separation --------
try {
  const findings = JSON.stringify([
    { system: "brakes", severity: "safety_concern", note: "Front pads at 2mm" },
    { system: "engine", severity: "ok", note: "" },
  ]);
  const submit = await db.query(
    `select public.submit_inspection_report(
       'insp-token', 'wrenchli-inspection-checklist-v1', $1::jsonb,
       'Brakes need work now', false, 'Send to a repair shop for front brakes',
       '{}', true, false, null, null) as v`,
    [findings],
  );
  const again = await db.query(
    `select public.submit_inspection_report(
       'insp-token', 'wrenchli-inspection-checklist-v1', $1::jsonb,
       'Duplicate', false, null, '{}', false, false, null, null) as v`,
    [findings],
  );
  const rep = await db.query(
    `select * from public.inspection_reports where referral_id = $1`,
    [inspHop1.id],
  );
  const hop = await db.query(
    `select status, outcome_reported_by from public.shop_referrals where id = $1`,
    [inspHop1.id],
  );
  await setUid(OWNER);
  const confirm = await db.query(
    `select public.confirm_referral_completion($1) as v`,
    [inspHop1.id],
  );
  await setUid(ADMIN);
  const report = await db.query(`select public.referral_response_report() as v`);
  const byKind = report.rows[0].v?.by_kind ?? {};
  record(
    "report-and-counting",
    "report files once with the checklist version stamped; owner confirmation completes it as an inspection; repair completions stay at zero",
    submit.rows[0].v?.ok === true &&
      again.rows[0].v?.ok === false &&
      ["report_already_filed", "no_accepted_referral"].includes(
        again.rows[0].v?.reason,
      ) &&
      rep.rows.length === 1 &&
      rep.rows[0].checklist_version === "wrenchli-inspection-checklist-v1" &&
      hop.rows[0].status === "outcome_reported" &&
      confirm.rows[0].v?.ok === true &&
      byKind.inspection?.completions === 1 &&
      (byKind.repair?.completions ?? 0) === 0 &&
      byKind.inspection?.sends >= 2,
    JSON.stringify({ submit: submit.rows[0].v, again: again.rows[0].v, byKind }),
  );
} catch (e) {
  record("report-and-counting", "report and counting", false, e.message);
} finally {
  await setUid(null);
}

// --- Scenario: a report cannot be filed against a repair referral ----
try {
  const r = await db.query(
    `select public.submit_inspection_report(
       'repair-token', 'wrenchli-inspection-checklist-v1',
       '[{"system":"brakes","severity":"ok","note":""}]'::jsonb,
       'Nope', true, null, '{}', false, false, null, null) as v`,
  );
  record(
    "report-repair-negative",
    "submit_inspection_report refuses a repair referral",
    r.rows[0].v?.ok === false && r.rows[0].v?.reason === "not_an_inspection_referral",
    JSON.stringify(r.rows[0].v),
  );
} catch (e) {
  record("report-repair-negative", "report repair negative", false, e.message);
}

// =============================================================
// Checklist v3 scenarios: the known-issues block and the sealed
// comparison block. Sentinel discipline: the pre-assessment's
// causes are planted in the package's diagnosis_details with a
// distinctive likelihood (0.617283). Before the stage-1
// findings are filed, NEITHER the cause names NOR the
// likelihood may appear anywhere in the token view — including
// through diagnosis_details, which the base view serves. After
// filing, the causes appear by name and id only; the likelihood
// joins the record only inside the filed report's verdicts.
// =============================================================
const CAUSE_A = "Worn brake pads";
const CAUSE_B = "Warped rotors";
const LIKELIHOOD_SENTINEL = "0.617283";
const DETAILS_WITH_CAUSES = {
  possible_causes: [
    { name: CAUSE_A, probability: 0.617283, estimated_cost_low: 100, estimated_cost_high: 200 },
    { name: CAUSE_B, probability: 0.3, estimated_cost_low: 50, estimated_cost_high: 500 },
  ],
  diagnosis_id: "diag-v3-fixture",
};
const FINDINGS_V3 = JSON.stringify([
  {
    system: "brakes",
    severity: "safety_concern",
    note: "Front pads at 2mm",
    items: [
      { item: "brakes-4", status: "concern", severity: "safety_concern", measurement: "2 mm" },
      { item: "brakes-9", status: "not_inspected", notInspectedReason: "needs_wheel_off" },
    ],
  },
  {
    system: "engine",
    severity: "ok",
    note: "",
    items: [{ item: "engine-1", status: "checked_ok" }],
  },
]);
const KNOWN_ISSUES_V3 = [
  {
    id: "recall-1",
    kind: "recall",
    title: "Open recall: brake booster vacuum pump",
    pattern: "Recall about the brake booster vacuum pump.",
    source: "NHTSA campaign 26V000000",
  },
  {
    id: "pattern-1",
    kind: "pattern",
    title: "Pattern: rear caliper seepage",
    pattern: "Rear calipers seep on this model as they age.",
    source: "Manufacturer service bulletin",
  },
];
const KNOWN_ISSUES_MARKED = [
  {
    ...KNOWN_ISSUES_V3[0],
    mark: "could_not_check",
    evidenceNote: "Internal part; nothing observable from the driveway",
  },
  {
    ...KNOWN_ISSUES_V3[1],
    mark: "evidence_found",
    evidenceNote: "Wet seepage at the left rear caliper",
  },
];
const VERDICTS_V3 = [
  {
    causeId: "cause-1",
    name: CAUSE_A,
    verdict: "confirmed",
    evidenceNote: "Front pads measured at 2mm",
    basis: "brakes",
  },
  {
    causeId: "cause-2",
    name: CAUSE_B,
    verdict: "not_found",
    evidenceNote: "No pulsation on the road test; no scoring visible",
    basis: "road_test",
  },
];

async function newPackageWithDetails(token, details) {
  const r = await db.query(
    `insert into public.referral_packages
       (token, user_id, diagnosis_title, customer_email, zip_code, diagnosis_details)
     values ($1, $2, 'Grinding noise when braking', $3, '48201', $4::jsonb) returning id`,
    [token, OWNER, EMAIL, JSON.stringify(details)],
  );
  return r.rows[0].id;
}

async function newDetailsWithKnownIssues(chainId, packageId, knownIssues) {
  await db.query(
    `insert into public.inspection_details
       (chain_id, package_id, owner_user_id, vehicle_location_text,
        location_descriptor, location_zip, preferred_windows,
        consumer_first_name, consumer_phone, known_issues)
     values ($1, $2, $3, $4, 'Driveway', '48201', 'Weekday mornings', $5, $6, $7::jsonb)`,
    [chainId, packageId, OWNER, LOCATION, FIRST, PHONE, JSON.stringify(knownIssues)],
  );
}

async function fileFindings(token, { findings = FINDINGS_V3, knownIssues = null } = {}) {
  const r = await db.query(
    `select public.file_inspection_findings(
       $1, 'wrenchli-inspection-checklist-v3', $2::jsonb, $3::jsonb) as v`,
    [token, findings, knownIssues ? JSON.stringify(knownIssues) : null],
  );
  return r.rows[0].v;
}

async function submitReportV3(token, { findings = FINDINGS_V3, knownIssues = null, verdicts = null } = {}) {
  const r = await db.query(
    `select public.submit_inspection_report(
       $1, 'wrenchli-inspection-checklist-v3', $2::jsonb,
       'Brakes need work now', false, 'Send to a repair shop for front brakes',
       '{}', false, false, null, null, $3::jsonb, $4::jsonb) as v`,
    [token, findings, knownIssues ? JSON.stringify(knownIssues) : null, verdicts ? JSON.stringify(verdicts) : null],
  );
  return r.rows[0].v;
}

function viewLeaksCauses(view) {
  const raw = JSON.stringify(view ?? {});
  return raw.includes(CAUSE_A) || raw.includes(CAUSE_B) || raw.includes(LIKELIHOOD_SENTINEL);
}

// --- Scenario: v3 schema shape ----------------------------------------
try {
  const cols = await db.query(`
    select
      (select count(*)::int from information_schema.columns
        where table_name = 'inspection_reports'
          and column_name in ('findings_filed_at', 'comparison_verdicts')) as report_cols,
      (select count(*)::int from information_schema.columns
        where table_name = 'inspection_details'
          and column_name = 'known_issues') as details_cols,
      (select count(*)::int from information_schema.tables
        where table_name = 'inspection_findings_staging') as staging_tables
  `);
  const c = cols.rows[0];
  record(
    "v3-schema",
    "v3 adds known_issues, the staging table, and the report's findings_filed_at + comparison_verdicts",
    c.report_cols === 2 && c.details_cols === 1 && c.staging_tables === 1,
    JSON.stringify(c),
  );
} catch (e) {
  record("v3-schema", "v3 schema", false, e.message);
}

// --- Main v3 fixture ---------------------------------------------------
const v3Pkg = await newPackageWithDetails("v3-token", DETAILS_WITH_CAUSES);
const v3Hop = await newHop(v3Pkg, INSP_A, inspChain, { kind: "inspection" });
await newDetailsWithKnownIssues(v3Hop.chain_id, v3Pkg, KNOWN_ISSUES_V3);

// --- Scenario: comparison sealed pre-filing ---------------------------
try {
  const preAccept = await tokenView("v3-token");
  await respond("v3-token", true);
  const postAccept = await tokenView("v3-token");
  record(
    "v3-comparison-sealed",
    "pre-accept and post-accept views serve no pre_assessment, no cause names, and no likelihood anywhere (diagnosis_details included); the known-issues block is served and findings_filed is false",
    preAccept?.pre_assessment == null &&
      postAccept?.pre_assessment == null &&
      !viewLeaksCauses(preAccept) &&
      !viewLeaksCauses(postAccept) &&
      postAccept?.inspection?.findings_filed === false &&
      (postAccept?.inspection?.known_issues ?? []).length === 2 &&
      postAccept?.visit_minimum?.consumer_first_name === FIRST,
    JSON.stringify({ preAccept, postAccept }),
  );
} catch (e) {
  record("v3-comparison-sealed", "v3 comparison sealed", false, e.message);
}

// --- Second fixture: verdicts cannot bypass the seal ------------------
const v3bPkg = await newPackageWithDetails("v3b-token", DETAILS_WITH_CAUSES);
const v3bHop = await newHop(v3bPkg, INSP_A, inspChain, { kind: "inspection" });
await newDetailsWithKnownIssues(v3bHop.chain_id, v3bPkg, KNOWN_ISSUES_V3);
await respond("v3b-token", true);

try {
  const r = await submitReportV3("v3b-token", { verdicts: VERDICTS_V3 });
  record(
    "v3-verdicts-require-staging",
    "submitting verdicts without a stage-1 filing is refused (the seal cannot be bypassed)",
    r?.ok === false && r?.reason === "comparison_requires_findings_first",
    JSON.stringify(r),
  );
} catch (e) {
  record("v3-verdicts-require-staging", "v3 verdicts require staging", false, e.message);
}

// --- Scenario: known-issues marks are enforced at stage 1 -------------
try {
  const bad = KNOWN_ISSUES_V3.map((c) => ({ ...c }));
  const r = await fileFindings("v3b-token", { knownIssues: bad });
  record(
    "v3-known-issues-gate",
    "stage-1 filing with unmarked known-issues checks is refused",
    r?.ok === false && r?.reason === "known_issues_incomplete",
    JSON.stringify(r),
  );
} catch (e) {
  record("v3-known-issues-gate", "v3 known issues gate", false, e.message);
}

// --- Scenario: stage-1 filing unseals the block, name + id only -------
try {
  const filed = await fileFindings("v3-token", { knownIssues: KNOWN_ISSUES_MARKED });
  const view = await tokenView("v3-token");
  const causes = view?.pre_assessment?.causes ?? [];
  const det = await db.query(
    `select known_issues from public.inspection_details where chain_id = $1`,
    [v3Hop.chain_id],
  );
  const storedMarks = (det.rows[0]?.known_issues ?? []).map((k) => k.mark);
  record(
    "v3-stage-unseals",
    "after stage-1 filing the block opens with causes by name and id only (no likelihood anywhere in the view), findings_filed is true, and the known-issue marks are stored on the chain",
    filed?.ok === true &&
      view?.inspection?.findings_filed === true &&
      view?.pre_assessment?.run_id === "diag-v3-fixture" &&
      causes.length === 2 &&
      causes[0].id === "cause-1" &&
      causes[0].name === CAUSE_A &&
      causes[1].id === "cause-2" &&
      !JSON.stringify(view?.pre_assessment ?? {}).includes(LIKELIHOOD_SENTINEL) &&
      !JSON.stringify(view ?? {}).includes(LIKELIHOOD_SENTINEL) &&
      storedMarks.join(",") === "could_not_check,evidence_found",
    JSON.stringify({ filed, view }),
  );
} catch (e) {
  record("v3-stage-unseals", "v3 stage unseals", false, e.message);
}

// --- Scenario: verdict completeness + likelihood attaches at filing ---
try {
  const noVerdicts = await submitReportV3("v3-token", { knownIssues: KNOWN_ISSUES_MARKED });
  const missingNote = await submitReportV3("v3-token", {
    verdicts: [VERDICTS_V3[0], { ...VERDICTS_V3[1], evidenceNote: "" }],
  });
  const good = await submitReportV3("v3-token", {
    knownIssues: KNOWN_ISSUES_MARKED,
    verdicts: VERDICTS_V3,
  });
  const rep = await db.query(
    `select comparison_verdicts, findings_filed_at, filed_at
       from public.inspection_reports where referral_id = $1`,
    [v3Hop.id],
  );
  const stored = rep.rows[0]?.comparison_verdicts ?? [];
  const view = await tokenView("v3-token");
  record(
    "v3-verdicts-and-likelihood",
    "final filing refuses missing or incomplete verdicts, then files; the stored verdicts carry the likelihoods as issued and findings_filed_at precedes the final filing",
    noVerdicts?.ok === false &&
      noVerdicts?.reason === "comparison_required" &&
      missingNote?.ok === false &&
      missingNote?.reason === "comparison_incomplete" &&
      good?.ok === true &&
      stored.length === 2 &&
      Number(stored[0].likelihood) === 0.617283 &&
      Number(stored[1].likelihood) === 0.3 &&
      stored[0].verdict === "confirmed" &&
      rep.rows[0].findings_filed_at != null &&
      new Date(rep.rows[0].findings_filed_at).getTime() <=
        new Date(rep.rows[0].filed_at).getTime() &&
      (view?.inspection_report?.comparison_verdicts ?? []).length === 2,
    JSON.stringify({ noVerdicts, missingNote, good, stored }),
  );
} catch (e) {
  record("v3-verdicts-and-likelihood", "v3 verdicts and likelihood", false, e.message);
}

// --- Scenario: no pre-assessment causes — single-step still works -----
try {
  const pkg = await newPackageWithDetails("v3c-token", {});
  const hop = await newHop(pkg, INSP_A, inspChain, { kind: "inspection" });
  await newDetails(hop.chain_id, pkg);
  await respond("v3c-token", true);
  const withVerdicts = await submitReportV3("v3c-token", { verdicts: VERDICTS_V3 });
  const plain = await submitReportV3("v3c-token", {});
  const rep = await db.query(
    `select comparison_verdicts, findings_filed_at
       from public.inspection_reports where referral_id = $1`,
    [hop.id],
  );
  record(
    "v3-no-causes-single-step",
    "a job with no pre-assessment causes refuses stray verdicts and files in a single step, comparison_verdicts null",
    withVerdicts?.ok === false &&
      withVerdicts?.reason === "comparison_not_applicable" &&
      plain?.ok === true &&
      rep.rows.length === 1 &&
      rep.rows[0].comparison_verdicts === null &&
      rep.rows[0].findings_filed_at != null,
    JSON.stringify({ withVerdicts, plain, rep: rep.rows[0] ?? null }),
  );
} catch (e) {
  record("v3-no-causes-single-step", "v3 no causes single step", false, e.message);
}

console.log(JSON.stringify(results));
await db.close();
