/**
 * Worker for brief4Migration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), replays the platform stubs
 * (referral-migration-stubs.sql + brief4-migration-stubs.sql),
 * then the real Brief 4 migration
 * (20261115120000_pre_assessment_brief4_trust_loop.sql), and
 * runs the schema-contract scenarios:
 *  - referral_packages.session_id: nullable, FK-checked, indexed
 *  - diagnostic_accuracy.source: defaults existing rows to
 *    'consumer_self_report', CHECK vocabulary enforced
 *  - uniqueness moved to (session_id, source): a self-report
 *    grade and a shop grade coexist for one session; a second
 *    grade with the same (session, source) is rejected
 *  - snapshot grades (session_id NULL) insert fine
 *  - the validate_diagnostic_accuracy trigger guards shop rows
 *    exactly as before (score range, label vocabulary)
 *
 * Prints a JSON array of results: [{ id, name, pass, detail }].
 * Runs as a plain Node child process because the repo's Vitest
 * setup targets jsdom, while PGlite needs a Node fs.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: Boolean(pass), detail: String(detail) });
}

const db = new PGlite();
try {
  await db.exec(
    readFileSync(new URL("./referral-migration-stubs.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    readFileSync(new URL("./brief4-migration-stubs.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261115120000_pre_assessment_brief4_trust_loop.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

async function trySql(sql, params = []) {
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    return e.message;
  }
}

async function newSession() {
  const r = await db.query(
    `insert into public.diagnostic_sessions default values returning id`,
  );
  return r.rows[0].id;
}

async function insertGrade({ sessionId, source, score = 1.0, label = "exact" }) {
  return trySql(
    `insert into public.diagnostic_accuracy
       (session_id, source, predicted_top_cause, predicted_causes_all,
        predicted_confidence, predicted_urgency, actual_diagnosis,
        accuracy_score, match_label)
     values ($1, $2, 'Worn brake pads', array['Worn brake pads'], 'high',
             'schedule', 'Brake pads replaced', $3, $4)`,
    [sessionId, source, score, label],
  );
}

// PKG-1: a package created without a session id stores NULL.
{
  const id = "pkg-session-null";
  const name = "referral_packages.session_id is nullable (unresolved origin session)";
  try {
    const r = await db.query(
      `insert into public.referral_packages (token, diagnosis_title)
       values ('tok-b4-1', 'Brake wear') returning session_id`,
    );
    record(id, name, r.rows[0].session_id === null, `session_id=${r.rows[0].session_id}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// PKG-2: a real session id is accepted; a bogus one hits the FK.
{
  const id = "pkg-session-fk";
  const name = "referral_packages.session_id accepts a real session and rejects a bogus one (FK)";
  try {
    const sessionId = await newSession();
    const okErr = await trySql(
      `insert into public.referral_packages (token, diagnosis_title, session_id)
       values ('tok-b4-2', 'Brake wear', $1)`,
      [sessionId],
    );
    const badErr = await trySql(
      `insert into public.referral_packages (token, diagnosis_title, session_id)
       values ('tok-b4-3', 'Brake wear', '99999999-9999-4999-8999-999999999999')`,
    );
    record(
      id,
      name,
      okErr === null && badErr !== null && /foreign key/i.test(badErr),
      `real=${okErr ?? "ok"}, bogus=${badErr ?? "no error"}`,
    );
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// PKG-3: the session_id index exists.
{
  const id = "pkg-session-index";
  const name = "referral_packages_session_id_idx exists";
  try {
    const r = await db.query(
      `select count(*)::int as n from pg_indexes
       where schemaname = 'public' and indexname = 'referral_packages_session_id_idx'`,
    );
    record(id, name, r.rows[0].n === 1, `index count=${r.rows[0].n}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// SRC-1: rows written without a source default to consumer_self_report.
{
  const id = "source-default";
  const name = "diagnostic_accuracy.source defaults to 'consumer_self_report'";
  try {
    const sessionId = await newSession();
    const err = await trySql(
      `insert into public.diagnostic_accuracy
         (session_id, predicted_top_cause, predicted_causes_all,
          predicted_confidence, predicted_urgency, accuracy_score, match_label)
       values ($1, 'Worn brake pads', array['Worn brake pads'], 'high',
               'schedule', 1.0, 'exact')`,
      [sessionId],
    );
    const r = await db.query(
      `select source from public.diagnostic_accuracy where session_id = $1`,
      [sessionId],
    );
    record(id, name, err === null && r.rows[0].source === "consumer_self_report",
      `insert=${err ?? "ok"}, source=${r.rows[0]?.source}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// SRC-2: the source CHECK vocabulary is enforced.
{
  const id = "source-check";
  const name = "diagnostic_accuracy.source rejects values outside ('consumer_self_report','shop_referral')";
  try {
    const sessionId = await newSession();
    const err = await insertGrade({ sessionId, source: "bogus_source" });
    record(id, name, err !== null && /check/i.test(err), `error=${err ?? "none"}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// SRC-3: one session holds one grade per source (the trust loop's
// core shape): self-report and shop grades coexist.
{
  const id = "two-sources-coexist";
  const name = "a session can hold a consumer_self_report grade AND a shop_referral grade";
  try {
    const sessionId = await newSession();
    const e1 = await insertGrade({ sessionId, source: "consumer_self_report" });
    const e2 = await insertGrade({ sessionId, source: "shop_referral" });
    const r = await db.query(
      `select count(*)::int as n from public.diagnostic_accuracy where session_id = $1`,
      [sessionId],
    );
    record(id, name, e1 === null && e2 === null && r.rows[0].n === 2,
      `self=${e1 ?? "ok"}, shop=${e2 ?? "ok"}, rows=${r.rows[0].n}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// SRC-4: a second grade with the same (session, source) is
// rejected by the moved uniqueness constraint (grader idempotency
// at the database layer).
{
  const id = "same-source-duplicate-rejected";
  const name = "a duplicate (session_id, source) grade is rejected by the unique constraint";
  try {
    const sessionId = await newSession();
    const e1 = await insertGrade({ sessionId, source: "shop_referral" });
    const e2 = await insertGrade({ sessionId, source: "shop_referral" });
    record(id, name, e1 === null && e2 !== null && /unique|duplicate/i.test(e2),
      `first=${e1 ?? "ok"}, second=${e2 ?? "no error"}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// SRC-5: snapshot grades carry session_id NULL and insert fine.
// (Postgres treats NULLs as distinct under UNIQUE, so the
// database cannot dedupe these; the grader dedupes by the
// referral marker in match_explanation. This scenario pins the
// schema behavior the grader compensates for.)
{
  const id = "null-session-shop-grades";
  const name = "shop grades with NULL session_id (snapshot linkage) insert without constraint errors";
  try {
    const e1 = await insertGrade({ sessionId: null, source: "shop_referral" });
    const e2 = await insertGrade({ sessionId: null, source: "shop_referral" });
    const r = await db.query(
      `select count(*)::int as n from public.diagnostic_accuracy
       where session_id is null and source = 'shop_referral'`,
    );
    record(id, name, e1 === null && e2 === null && r.rows[0].n === 2,
      `first=${e1 ?? "ok"}, second=${e2 ?? "ok"}, rows=${r.rows[0].n}`);
  } catch (e) {
    record(id, name, false, e.message);
  }
}

// TRG-1: the validate_diagnostic_accuracy trigger guards shop
// rows unchanged: out-of-range score and bad label both raise.
{
  const id = "trigger-guards-shop-rows";
  const name = "validate_diagnostic_accuracy still rejects bad score/label on shop_referral rows";
  try {
    const s1 = await newSession();
    const badScore = await insertGrade({ sessionId: s1, source: "shop_referral", score: 1.5 });
    const s2 = await newSession();
    const badLabel = await insertGrade({ sessionId: s2, source: "shop_referral", label: "bogus" });
    const s3 = await newSession();
    const good = await insertGrade({ sessionId: s3, source: "shop_referral", score: 0.8, label: "close" });
    record(
      id,
      name,
      badScore !== null && /between 0 and 1/i.test(badScore) &&
        badLabel !== null && /match_label/i.test(badLabel) &&
        good === null,
      `score=${badScore ?? "no error"}; label=${badLabel ?? "no error"}; good=${good ?? "ok"}`,
    );
  } catch (e) {
    record(id, name, false, e.message);
  }
}

console.log(JSON.stringify(results));
await db.close();
