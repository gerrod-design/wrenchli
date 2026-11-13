/**
 * Worker for transportBrief3Migration.test.ts.
 *
 * Boots PGlite (real PostgreSQL), replays the platform stubs, the
 * Referral Phase 1 migration, and the Mobility Brief 3 migration
 * (20261113140000_mobility_brief3_transport.sql), then runs the
 * Option A transport scenarios and prints a JSON array of results:
 * [{ id, name, pass, detail }]. Runs as a plain Node child process
 * because the repo's Vitest setup targets jsdom, while PGlite needs
 * a Node fs.
 *
 * The stubs' service_providers carries only id + name; Brief 1's
 * offers_pickup_delivery attribute (shipped migration
 * 20261113120000) is added directly below to simulate the shipped
 * state Brief 3 builds on.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const SHOP_A = "aaaaaaaa-0000-0000-0000-00000000000a"; // offers pickup/delivery
const SHOP_B = "bbbbbbbb-0000-0000-0000-00000000000b"; // offers pickup/delivery
const SHOP_C = "cccccccc-0000-0000-0000-00000000000c"; // does NOT offer it
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
  // Simulate shipped Brief 1: the shop attribute Brief 3 builds on.
  await db.exec(`
    alter table public.service_providers
      add column offers_pickup_delivery boolean not null default false;
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261109120000_referral_phase1.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261113140000_mobility_brief3_transport.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`
    insert into auth.users (id) values ('${OWNER}'), ('${OTHER}');
    insert into public.service_providers (id, name, offers_pickup_delivery) values
      ('${SHOP_A}', 'Shop A', true),
      ('${SHOP_B}', 'Shop B', true),
      ('${SHOP_C}', 'Shop C', false);
  `);
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

async function setUid(uid) {
  await db.query(`select set_config('app.uid', $1, false)`, [uid ?? ""]);
}

async function newPackage(token, { transport = false, note = null } = {}) {
  const r = await db.query(
    `insert into public.referral_packages
       (token, user_id, diagnosis_title, transport_requested, transport_note)
     values ($1, $2, 'Brake wear', $3, $4) returning id`,
    [token, OWNER, transport, note],
  );
  return r.rows[0].id;
}

async function newHop(packageId, shopId, chain = CHAIN) {
  const r = await db.query(
    `insert into public.shop_referrals
       (package_id, shop_id, owner_user_id, chain_id, shop_chain, preference_order, status)
     values ($1, $2, $3, gen_random_uuid(), $4::jsonb, 1, 'sent') returning id`,
    [packageId, shopId, OWNER, chain],
  );
  return r.rows[0].id;
}

async function hop(id) {
  const r = await db.query(`select * from public.shop_referrals where id = $1`, [id]);
  return r.rows[0];
}

async function pkg(id) {
  const r = await db.query(`select * from public.referral_packages where id = $1`, [id]);
  return r.rows[0];
}

async function tokenView(token) {
  const r = await db.query(`select public.get_referral_package_by_token($1) as v`, [token]);
  return r.rows[0].v;
}

async function respond(token, accept) {
  const r = await db.query(`select public.respond_to_referral($1, $2) as v`, [token, accept]);
  return r.rows[0].v;
}

async function setTransport(token, status, charge) {
  const r = await db.query(`select public.set_referral_transport($1, $2, $3) as v`, [
    token,
    status,
    charge,
  ]);
  return r.rows[0].v;
}

// 1. Columns, defaults, and the transport_status CHECK.
{
  const id = "columns";
  const name = "migration adds the transport columns with the brief's types, defaults, and status check";
  try {
    const { rows } = await db.query(`
      select table_name, column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public'
        and ((table_name = 'referral_packages' and column_name in ('transport_requested','transport_note'))
          or (table_name = 'shop_referrals' and column_name in ('transport_status','transport_charge_stated','outcome_transport_cost')))
      order by table_name, column_name
    `);
    const byKey = Object.fromEntries(rows.map((r) => [`${r.table_name}.${r.column_name}`, r]));
    const shapeOk =
      rows.length === 5 &&
      byKey["referral_packages.transport_requested"]?.data_type === "boolean" &&
      byKey["referral_packages.transport_requested"]?.is_nullable === "NO" &&
      byKey["referral_packages.transport_requested"]?.column_default === "false" &&
      byKey["referral_packages.transport_note"]?.data_type === "text" &&
      byKey["referral_packages.transport_note"]?.is_nullable === "YES" &&
      byKey["shop_referrals.transport_status"]?.data_type === "text" &&
      byKey["shop_referrals.transport_charge_stated"]?.data_type === "numeric" &&
      byKey["shop_referrals.outcome_transport_cost"]?.data_type === "numeric";

    const pkgId = await newPackage("tok-cols");
    const hopId = await newHop(pkgId, SHOP_A);
    const p = await pkg(pkgId);
    const h = await hop(hopId);
    const defaultsOk =
      p.transport_requested === false &&
      p.transport_note === null &&
      h.transport_status === null &&
      h.transport_charge_stated === null &&
      h.outcome_transport_cost === null;

    let rejected = false;
    try {
      await db.query(`update public.shop_referrals set transport_status = 'bogus' where id = $1`, [hopId]);
    } catch {
      rejected = true;
    }
    let allValidAccepted = true;
    for (const s of ["requested", "arranged", "picked_up", "delivered", "unable"]) {
      try {
        await db.query(`update public.shop_referrals set transport_status = $1 where id = $2`, [s, hopId]);
      } catch {
        allValidAccepted = false;
      }
    }
    record(
      id,
      name,
      shapeOk && defaultsOk && rejected && allValidAccepted,
      `shapeOk=${shapeOk}, defaultsOk=${defaultsOk}, bogusRejected=${rejected}, validAccepted=${allValidAccepted}, rows=${JSON.stringify(rows)}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 2. The request survives a hop: decline hop 1, hop 2's token view
//    shows the request and note unchanged, and hop 2's status
//    thread starts at 'requested' (the insert trigger, engine
//    untouched).
{
  const id = "flag-survives-hop";
  const name = "transport request survives a hop: hop 2 token view shows it unchanged";
  try {
    const pkgId = await newPackage("tok-hop", { transport: true, note: "Car is in the driveway, keys under the mat" });
    const hop1 = await newHop(pkgId, SHOP_A);
    const before = await hop(hop1);
    await setUid(null);
    const dec = await respond("tok-hop", false);
    const view = await tokenView("tok-hop");
    const hops = await db.query(
      `select shop_id, status, transport_status from public.shop_referrals
       where package_id = $1 order by preference_order`,
      [pkgId],
    );
    const pass =
      before.transport_status === "requested" &&
      dec.ok === true &&
      dec.escalated === true &&
      hops.rows.length === 2 &&
      hops.rows[1].shop_id === SHOP_B &&
      hops.rows[1].transport_status === "requested" &&
      view.transport_requested === true &&
      view.transport_note === "Car is in the driveway, keys under the mat" &&
      view.active_referral?.transport_status === "requested" &&
      view.shop?.id === SHOP_B &&
      view.shop?.offers_pickup_delivery === true;
    record(
      id,
      name,
      pass,
      `hop1 trigger=${before.transport_status}, decline=${JSON.stringify(dec)}, hops=${JSON.stringify(hops.rows)}, view.transport=${view.transport_requested}/${view.transport_note}, active=${JSON.stringify(view.active_referral)}, shop=${JSON.stringify(view.shop)}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 3. No-offer negative path: a shop without the attribute can
//    accept the repair referral but can never set a transport
//    status; the thread stays where the trigger put it.
{
  const id = "no-offer-negative";
  const name = "shop without offers_pickup_delivery cannot set a transport status";
  try {
    const pkgId = await newPackage("tok-nooffer", { transport: true });
    const hopId = await newHop(pkgId, SHOP_C, JSON.stringify([SHOP_C]));
    await setUid(null);
    const acc = await respond("tok-nooffer", true);
    const set = await setTransport("tok-nooffer", "arranged", 75);
    const after = await hop(hopId);
    const pass =
      acc.ok === true &&
      set.ok === false &&
      set.reason === "pickup_delivery_not_offered" &&
      after.transport_status === "requested" &&
      after.transport_charge_stated === null;
    record(id, name, pass, `accept=${JSON.stringify(acc)}, set=${JSON.stringify(set)}, after=${after.transport_status}/${after.transport_charge_stated}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 4. Not-requested negative path: no transport request on the
//    package means the transport RPC refuses outright.
{
  const id = "not-requested-negative";
  const name = "set_referral_transport refuses when the package never requested transport";
  try {
    const pkgId = await newPackage("tok-notreq");
    const hopId = await newHop(pkgId, SHOP_A, JSON.stringify([SHOP_A]));
    await setUid(null);
    await respond("tok-notreq", true);
    const set = await setTransport("tok-notreq", "arranged", null);
    const after = await hop(hopId);
    const pass =
      set.ok === false && set.reason === "transport_not_requested" && after.transport_status === null;
    record(id, name, pass, `set=${JSON.stringify(set)}, after=${after.transport_status}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 5. Happy path: the request is visible BEFORE the shop decides;
//    the status cannot move before acceptance; after acceptance
//    the shop walks requested -> arranged (with its stated
//    charge) -> picked_up -> delivered.
let happyPkgId;
let happyHopId;
{
  const id = "happy-path";
  const name = "shop sees the request before deciding, then manages status and its stated charge after acceptance";
  try {
    happyPkgId = await newPackage("tok-happy", { transport: true, note: "Won't start" });
    happyHopId = await newHop(happyPkgId, SHOP_A, JSON.stringify([SHOP_A]));
    const preView = await tokenView("tok-happy");
    await setUid(null);
    const early = await setTransport("tok-happy", "arranged", null);
    const acc = await respond("tok-happy", true);
    const arranged = await setTransport("tok-happy", "arranged", 75);
    const picked = await setTransport("tok-happy", "picked_up", null);
    const delivered = await setTransport("tok-happy", "delivered", null);
    const after = await hop(happyHopId);
    const pass =
      preView.transport_requested === true &&
      preView.active_referral?.status === "sent" &&
      preView.active_referral?.transport_status === "requested" &&
      early.ok === false &&
      early.reason === "referral_not_accepted" &&
      acc.ok === true &&
      arranged.ok === true &&
      arranged.transport_status === "arranged" &&
      Number(arranged.transport_charge_stated) === 75 &&
      picked.ok === true &&
      picked.transport_status === "picked_up" &&
      Number(picked.transport_charge_stated) === 75 &&
      delivered.ok === true &&
      after.transport_status === "delivered" &&
      Number(after.transport_charge_stated) === 75;
    record(
      id,
      name,
      pass,
      `preView active=${JSON.stringify(preView.active_referral)}, early=${JSON.stringify(early)}, arranged=${JSON.stringify(arranged)}, picked=${JSON.stringify(picked)}, after=${after.transport_status}/${after.transport_charge_stated}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 6. Outcome separation (hard requirement): outcome_cost is the
//    repair cost only; the transport cost lands in its own column;
//    a no-transport outcome leaves it NULL; the transport thread
//    closes once the outcome is filed.
{
  const id = "outcome-separation";
  const name = "outcome keeps repair cost and transport cost in separate columns";
  try {
    await setUid(null);
    const out = await db.query(
      `select public.submit_referral_outcome('tok-happy', 'Worn pads', 'Replaced pads and rotors', 500, 75) as v`,
    );
    const v = out.rows[0].v;
    const after = await hop(happyHopId);
    const closed = await setTransport("tok-happy", "delivered", null);

    const plainPkg = await newPackage("tok-plain-outcome");
    const plainHop = await newHop(plainPkg, SHOP_A, JSON.stringify([SHOP_A]));
    await respond("tok-plain-outcome", true);
    await db.query(
      `select public.submit_referral_outcome('tok-plain-outcome', 'Noise', 'Replaced belt', 300) as v`,
    );
    const plainAfter = await hop(plainHop);

    const pass =
      v.ok === true &&
      Number(after.outcome_cost) === 500 &&
      Number(after.outcome_transport_cost) === 75 &&
      closed.ok === false &&
      closed.reason === "transport_closed" &&
      Number(plainAfter.outcome_cost) === 300 &&
      plainAfter.outcome_transport_cost === null;
    record(
      id,
      name,
      pass,
      `outcome=${JSON.stringify(v)}, repair=${after.outcome_cost}, transport=${after.outcome_transport_cost}, closed=${JSON.stringify(closed)}, plain=${plainAfter.outcome_cost}/${plainAfter.outcome_transport_cost}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 7. The owner can add the request after acceptance (Garage
//    path); a non-owner cannot.
{
  const id = "owner-adds-after-acceptance";
  const name = "owner adds the transport request after acceptance via request_referral_transport; non-owner rejected";
  try {
    const pkgId = await newPackage("tok-late");
    const hopId = await newHop(pkgId, SHOP_A, JSON.stringify([SHOP_A]));
    await setUid(null);
    await respond("tok-late", true);
    await setUid(OWNER);
    const add = await db.query(`select public.request_referral_transport($1, $2) as v`, [
      hopId,
      "Car is in the driveway",
    ]);
    const p = await pkg(pkgId);
    const h = await hop(hopId);
    const again = await db.query(`select public.request_referral_transport($1, $2) as v`, [
      hopId,
      "changed note",
    ]);

    const pkg2 = await newPackage("tok-late-2");
    const hop2 = await newHop(pkg2, SHOP_A, JSON.stringify([SHOP_A]));
    await setUid(OTHER);
    const denied = await db.query(`select public.request_referral_transport($1, $2) as v`, [
      hop2,
      "not mine",
    ]);
    const p2 = await pkg(pkg2);

    const pass =
      add.rows[0].v.ok === true &&
      p.transport_requested === true &&
      p.transport_note === "Car is in the driveway" &&
      h.transport_status === "requested" &&
      again.rows[0].v.ok === true &&
      again.rows[0].v.already === true &&
      denied.rows[0].v.ok === false &&
      denied.rows[0].v.reason === "not_found_or_not_owner" &&
      p2.transport_requested === false;
    record(
      id,
      name,
      pass,
      `add=${JSON.stringify(add.rows[0].v)}, pkg=${p.transport_requested}/${p.transport_note}, hop=${h.transport_status}, again=${JSON.stringify(again.rows[0].v)}, denied=${JSON.stringify(denied.rows[0].v)}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 8. Stopping the chain cancels the transport request with it.
{
  const id = "stop-cancels-transport";
  const name = "stop_referral_chain clears the package transport request";
  try {
    const pkgId = await newPackage("tok-stop-t", { transport: true, note: "Keep my words" });
    const hopId = await newHop(pkgId, SHOP_A, JSON.stringify([SHOP_A]));
    await setUid(OWNER);
    const res = await db.query(`select public.stop_referral_chain($1) as v`, [hopId]);
    const p = await pkg(pkgId);
    const h = await hop(hopId);
    const pass =
      res.rows[0].v.ok === true &&
      h.status === "cancelled" &&
      p.transport_requested === false &&
      p.transport_note === "Keep my words";
    record(id, name, pass, `stop=${JSON.stringify(res.rows[0].v)}, pkg=${p.transport_requested}/${p.transport_note}, hop=${h.status}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// 9. Phase 1 regression: a plain referral with no transport still
//    accepts, files an outcome, and confirms exactly as before.
{
  const id = "phase1-regression";
  const name = "plain Phase 1 flow (accept, outcome, owner confirm) is unchanged";
  try {
    const pkgId = await newPackage("tok-regression");
    const hopId = await newHop(pkgId, SHOP_A, JSON.stringify([SHOP_A]));
    await setUid(null);
    const acc = await respond("tok-regression", true);
    const out = await db.query(
      `select public.submit_referral_outcome('tok-regression', 'Leak', 'Replaced hose', 210) as v`,
    );
    await setUid(OWNER);
    const conf = await db.query(`select public.confirm_referral_completion($1) as v`, [hopId]);
    const after = await hop(hopId);
    const pass =
      acc.ok === true &&
      out.rows[0].v.ok === true &&
      conf.rows[0].v.ok === true &&
      after.status === "completed" &&
      after.transport_status === null &&
      after.outcome_transport_cost === null;
    record(id, name, pass, `acc=${JSON.stringify(acc)}, out=${JSON.stringify(out.rows[0].v)}, conf=${JSON.stringify(conf.rows[0].v)}, after=${after.status}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

console.log(JSON.stringify(results));
await db.close();
process.exit(0);
