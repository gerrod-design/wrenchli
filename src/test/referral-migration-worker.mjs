/**
 * Worker for referralPhase1Migration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), replays the Referral Phase 1
 * migration over the platform stubs in referral-migration-stubs.sql,
 * then runs the stop-the-chain scenarios and prints a JSON array of
 * results: [{ id, name, pass, detail }]. Runs as a plain Node child
 * process because the repo's Vitest setup targets jsdom, while
 * PGlite needs a Node fs.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const SHOP_A = "aaaaaaaa-0000-0000-0000-00000000000a";
const SHOP_B = "bbbbbbbb-0000-0000-0000-00000000000b";
const SHOP_C = "cccccccc-0000-0000-0000-00000000000c";
const CHAIN = JSON.stringify([SHOP_A, SHOP_B, SHOP_C]);

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
    readFileSync(
      new URL(
        "../../supabase/migrations/20261109120000_referral_phase1.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`
    insert into auth.users (id) values ('${OWNER}'), ('${OTHER}');
    insert into public.service_providers (id, name) values
      ('${SHOP_A}', 'Shop A'), ('${SHOP_B}', 'Shop B'), ('${SHOP_C}', 'Shop C');
  `);
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

async function setUid(uid) {
  await db.query(`select set_config('app.uid', $1, false)`, [uid ?? ""]);
}

async function newPackage(token) {
  const r = await db.query(
    `insert into public.referral_packages (token, user_id, diagnosis_title)
     values ($1, $2, 'Brake wear') returning id`,
    [token, OWNER],
  );
  return r.rows[0].id;
}

async function newHop(packageId) {
  const r = await db.query(
    `insert into public.shop_referrals
       (package_id, shop_id, owner_user_id, chain_id, shop_chain, preference_order, status)
     values ($1, $2, $3, gen_random_uuid(), $4::jsonb, 1, 'sent') returning id`,
    [packageId, SHOP_A, OWNER, CHAIN],
  );
  return r.rows[0].id;
}

async function hop(id) {
  const r = await db.query(`select * from public.shop_referrals where id = $1`, [id]);
  return r.rows[0];
}

async function chainHopCount(chainId) {
  const r = await db.query(
    `select count(*)::int as n from public.shop_referrals where chain_id = $1`,
    [chainId],
  );
  return r.rows[0].n;
}

async function rpc(name, args) {
  const r = await db.query(`select public.${name}($1) as v`, args);
  return r.rows[0].v;
}

// STOP-1: stopping a 'sent' hop cancels it in place; responded_at
// stays null; return is {ok:true, status:'cancelled'}.
let stoppedHopId;
let stoppedChainId;
{
  const id = "stop-sent";
  const name = "owner stops a sent hop: it becomes cancelled, responded_at stays null";
  try {
    const pkg = await newPackage("tok-stop-1");
    stoppedHopId = await newHop(pkg);
    stoppedChainId = (await hop(stoppedHopId)).chain_id;
    await setUid(OWNER);
    const res = await rpc("stop_referral_chain", [stoppedHopId]);
    const after = await hop(stoppedHopId);
    const pass =
      res.ok === true &&
      res.status === "cancelled" &&
      after.status === "cancelled" &&
      after.responded_at === null;
    record(id, name, pass, `rpc=${JSON.stringify(res)}, status=${after.status}, responded_at=${after.responded_at}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// STOP-2: the escalation processor must NOT escalate a cancelled
// chain, even when the cancelled hop's window is in the past; and
// escalate_shop_referral called directly on it returns null.
{
  const id = "cancelled-never-escalates";
  const name = "cancelled chain never escalates (processor + direct escalate call)";
  try {
    await db.query(
      `update public.shop_referrals set window_expires_at = now() - interval '2 days' where id = $1`,
      [stoppedHopId],
    );
    await setUid(null);
    await db.query(`select public.process_referral_escalations()`);
    const esc = await db.query(`select public.escalate_shop_referral($1) as v`, [stoppedHopId]);
    const after = await hop(stoppedHopId);
    const count = await chainHopCount(stoppedChainId);
    const pass = after.status === "cancelled" && count === 1 && esc.rows[0].v === null;
    record(id, name, pass, `status=${after.status}, chain hops=${count}, direct escalate=${esc.rows[0].v}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// STOP-3: respond_to_referral rejects the cancelled hop with
// no_active_referral / status 'cancelled'.
{
  const id = "respond-rejects-cancelled";
  const name = "respond_to_referral returns no_active_referral for a cancelled hop";
  try {
    await setUid(null);
    const r = await db.query(
      `select public.respond_to_referral('tok-stop-1', true) as v`,
    );
    const v = r.rows[0].v;
    const pass = v.ok === false && v.reason === "no_active_referral" && v.status === "cancelled";
    record(id, name, pass, `rpc=${JSON.stringify(v)}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// STOP-4: a non-owner cannot stop someone else's chain.
{
  const id = "non-owner-cannot-stop";
  const name = "stop_referral_chain rejects a non-owner";
  try {
    const pkg = await newPackage("tok-stop-4");
    const hopId = await newHop(pkg);
    await setUid(OTHER);
    const res = await rpc("stop_referral_chain", [hopId]);
    const after = await hop(hopId);
    const pass = res.ok === false && res.reason === "not_found_or_not_owner" && after.status === "sent";
    record(id, name, pass, `rpc=${JSON.stringify(res)}, status=${after.status}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// ESC-1: regression — a normal decline still escalates to hop 2.
{
  const id = "decline-still-escalates";
  const name = "a normal decline still escalates to the next shop";
  try {
    const pkg = await newPackage("tok-esc-1");
    const hopId = await newHop(pkg);
    const chainId = (await hop(hopId)).chain_id;
    await setUid(null);
    const r = await db.query(`select public.respond_to_referral('tok-esc-1', false) as v`);
    const v = r.rows[0].v;
    const hops = await db.query(
      `select shop_id, status, preference_order from public.shop_referrals
       where chain_id = $1 order by preference_order`,
      [chainId],
    );
    const pass =
      v.ok === true &&
      v.status === "declined" &&
      v.escalated === true &&
      hops.rows.length === 2 &&
      hops.rows[0].status === "declined" &&
      hops.rows[1].shop_id === SHOP_B &&
      hops.rows[1].status === "sent" &&
      hops.rows[1].preference_order === 2;
    record(id, name, pass, `rpc=${JSON.stringify(v)}, hops=${JSON.stringify(hops.rows)}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// STOP-5: regression — a normal window expiry still escalates.
{
  const id = "expiry-still-escalates";
  const name = "a normal window expiry still escalates to the next shop";
  try {
    const pkg = await newPackage("tok-esc-2");
    const hopId = await newHop(pkg);
    const chainId = (await hop(hopId)).chain_id;
    await db.query(
      `update public.shop_referrals set window_expires_at = now() - interval '1 hour' where id = $1`,
      [hopId],
    );
    await setUid(null);
    await db.query(`select public.process_referral_escalations()`);
    const hops = await db.query(
      `select shop_id, status, preference_order from public.shop_referrals
       where chain_id = $1 order by preference_order`,
      [chainId],
    );
    const pass =
      hops.rows.length === 2 &&
      hops.rows[0].status === "expired" &&
      hops.rows[1].shop_id === SHOP_B &&
      hops.rows[1].status === "sent";
    record(id, name, pass, `hops=${JSON.stringify(hops.rows)}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

console.log(JSON.stringify(results));
await db.close();
process.exit(0);
