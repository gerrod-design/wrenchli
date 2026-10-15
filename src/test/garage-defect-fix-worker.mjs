import { PGlite } from "@electric-sql/pglite";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OWNER2 = "22222222-2222-2222-2222-222222222222";

const V_GLC = "aaaaaaaa-0000-0000-0000-000000000001";
const V2 = "aaaaaaaa-0000-0000-0000-000000000002";
const V3 = "aaaaaaaa-0000-0000-0000-000000000003";

const CORE_CHECK_KEYS = [
  "odometer_photo",
  "walkaround_front",
  "walkaround_driver_side",
  "walkaround_rear",
  "walkaround_passenger_side",
  "sound_audio_system",
  "sound_engine_idle",
  "smell_cabin",
  "sight_dash_and_panel_fit",
  "feel_idle_and_pedal",
];

const db = new PGlite();

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
}

async function replaySql(url) {
  const fs = await import("node:fs/promises");
  const sql = await fs.readFile(url, "utf8");
  await db.exec(sql);
}

async function makeVehicle(id, owner, year, make, model, vin) {
  await db.query(
    `insert into public.user_vehicles (id, user_id, year, make, model, vin)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, owner, year, make, model, vin]
  );
}

async function makeBaseline(vehicleId, owner) {
  const res = await db.query(
    `insert into public.vehicle_baselines (vehicle_id, owner_user_id, vin)
     values ($1, $2, (select vin from public.user_vehicles where id = $1))
     returning id`,
    [vehicleId, owner]
  );
  return res.rows[0].id;
}

async function answerCore(baselineId, vehicleId, owner) {
  await db.query(
    `insert into public.vehicle_baseline_responses
       (baseline_id, vehicle_id, owner_user_id, check_key, check_label, response, source_name)
     select $1, $2, $3, k, k, 'ok', 'Test Owner'
     from (values
       ('odometer_photo'), ('walkaround_front'), ('walkaround_driver_side'),
       ('walkaround_rear'), ('walkaround_passenger_side'), ('sound_audio_system'),
       ('sound_engine_idle'), ('smell_cabin'), ('sight_dash_and_panel_fit'),
       ('feel_idle_and_pedal')
     ) as t(k)`,
    [baselineId, vehicleId, owner]
  );
}

async function tryComplete(baselineId) {
  try {
    await db.query(
      `select * from public.complete_vehicle_baseline($1, $2)`,
      [baselineId, "Test Owner"]
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

async function countRows(sql, params) {
  const res = await db.query(sql, params);
  return parseInt(res.rows[0].n, 10);
}

async function main() {
  try {
    await replaySql(new URL("./garage-migration-stubs.sql", import.meta.url));
    await replaySql(
      new URL(
        "../../supabase/migrations/20261012173000_garage_two_layer_record.sql",
        import.meta.url
      )
    );
    await replaySql(
      new URL(
        "../../supabase/migrations/20261015120000_garage_weakpoint_match_cascade_delete.sql",
        import.meta.url
      )
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  await db.query(`insert into auth.users (id) values ($1), ($2)`, [
    OWNER,
    OWNER2,
  ]);
  await db.query(`select set_config('app.uid', $1, false)`, [OWNER]);

  await makeVehicle(
    V_GLC,
    OWNER,
    2016,
    "Mercedes-Benz",
    "GLC-Class",
    "WDC0G4KB3GF052161"
  );

  let b1 = null;

  // Scenario 1
  try {
    b1 = await makeBaseline(V_GLC, OWNER);
    await answerCore(b1, V_GLC, OWNER);
    const res = await tryComplete(b1);
    const pass = !res.ok && res.message.includes("model-specific");
    record("rpc-glc-class-refused", "GLC baseline refused without weak point answer", pass, res.message || "unexpectedly succeeded");
  } catch (e) {
    record("rpc-glc-class-refused", "GLC baseline refused without weak point answer", false, e.message);
  }

  // Scenario 2
  try {
    const seed = await db.query(
      `select id from public.weak_point_checks where slug = $1`,
      ["mercedes-benz-glc-x253-rear-wheel-wells"]
    );
    const seedId = seed.rows[0].id;
    await db.query(
      `insert into public.vehicle_baseline_responses
         (baseline_id, vehicle_id, owner_user_id, weak_point_check_id, check_key, check_label, response, source_name)
       values ($1, $2, $3, $4, $5, $6, 'issue', 'Test Owner')`,
      [
        b1,
        V_GLC,
        OWNER,
        seedId,
        "weakpoint:mercedes-benz-glc-x253-rear-wheel-wells",
        "Rear wheel wells",
      ]
    );
    const res = await tryComplete(b1);
    const statusRes = await db.query(
      `select status from public.vehicle_baselines where id = $1`,
      [b1]
    );
    const eventCount = await countRows(
      `select count(*)::int as n from public.vehicle_timeline_events
       where vehicle_id = $1 and title = 'Purchase-day baseline saved'`,
      [V_GLC]
    );
    const pass =
      res.ok &&
      statusRes.rows[0].status === "completed" &&
      eventCount === 1;
    record(
      "rpc-glc-class-completes",
      "GLC baseline completes once weak point answered",
      pass,
      JSON.stringify({ ok: res.ok, message: res.message, status: statusRes.rows[0]?.status, eventCount })
    );
  } catch (e) {
    record("rpc-glc-class-completes", "GLC baseline completes once weak point answered", false, e.message);
  }

  // Scenario 3
  try {
    const cases = [
      { slug: "toyota-rav4-xa50-roof-rail-headliner", year: 2020, make: "Toyota", model: "RAV4" },
      { slug: "honda-cr-v-rw-15t-oil-fuel-smell", year: 2018, make: "Honda", model: "CR-V" },
      { slug: "ford-f-150-p552-ac-drain-front-carpet", year: 2019, make: "Ford", model: "F-150" },
      { slug: "chevrolet-silverado-1500-t1xx-rear-window", year: 2019, make: "Chevrolet", model: "Silverado 1500" },
      { slug: "chevrolet-silverado-1500-t1xx-rear-window", year: 2019, make: "Chevrolet", model: "Silverado" },
      { slug: "mazda-cx-30-dm-spare-tire-well", year: 2022, make: "Mazda", model: "CX-30" },
    ];
    const detail = [];
    let allRefused = true;
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      const vid = `aaaaaaaa-0000-0000-0000-00000000001${i}`;
      await makeVehicle(vid, OWNER, c.year, c.make, c.model, `VINCASE${i}0000000001`);
      const bid = await makeBaseline(vid, OWNER);
      await answerCore(bid, vid, OWNER);
      const res = await tryComplete(bid);
      const refused = !res.ok && res.message.includes("model-specific");
      if (!refused) allRefused = false;
      detail.push({ model: `${c.make} ${c.model} (${c.year})`, refused });
    }
    record("rpc-other-models-refused", "Other make/model weak points refused without answer", allRefused, JSON.stringify(detail));
  } catch (e) {
    record("rpc-other-models-refused", "Other make/model weak points refused without answer", false, e.message);
  }

  // Scenario 4
  try {
    const cc = await db.query(
      `insert into public.vehicle_condition_checks
         (vehicle_id, owner_user_id, baseline_id, check_key, label)
       values ($1, $2, null, 'smell_cabin', 'Cabin smell')
       returning id`,
      [V_GLC, OWNER]
    );
    const checkId = cc.rows[0].id;
    await db.query(
      `update public.vehicle_condition_checks
       set status = 'checked_issue',
           last_checked_at = now(),
           last_source_type = 'owner',
           last_source_name = 'Test Owner',
           note = 'Musty'
       where id = $1`,
      [checkId]
    );
    const eventCountBefore = await countRows(
      `select count(*)::int as n from public.vehicle_timeline_events where vehicle_id = $1`,
      [V_GLC]
    );
    const eventsOk = eventCountBefore >= 2;

    await db.query(`delete from public.user_vehicles where id = $1`, [V_GLC]);

    const eventCount = await countRows(
      `select count(*)::int as n from public.vehicle_timeline_events where vehicle_id = $1`,
      [V_GLC]
    );
    const baselineCount = await countRows(
      `select count(*)::int as n from public.vehicle_baselines where vehicle_id = $1`,
      [V_GLC]
    );
    const responseCount = await countRows(
      `select count(*)::int as n from public.vehicle_baseline_responses where vehicle_id = $1`,
      [V_GLC]
    );
    const checkCount = await countRows(
      `select count(*)::int as n from public.vehicle_condition_checks where vehicle_id = $1`,
      [V_GLC]
    );
    const vehicleCount = await countRows(
      `select count(*)::int as n from public.user_vehicles where id = $1`,
      [V_GLC]
    );
    const pass =
      eventsOk &&
      eventCount === 0 &&
      baselineCount === 0 &&
      responseCount === 0 &&
      checkCount === 0 &&
      vehicleCount === 0;
    record(
      "vehicle-delete-cascades",
      "Deleting a vehicle cascades all related records",
      pass,
      JSON.stringify({ eventCountBefore, eventCount, baselineCount, responseCount, checkCount, vehicleCount })
    );
  } catch (e) {
    record("vehicle-delete-cascades", "Deleting a vehicle cascades all related records", false, e.message);
  }

  // Scenario 5
  try {
    await makeVehicle(V2, OWNER, 2017, "Mercedes-Benz", "GLC", "WDC0G4KB3GF052162");
    const ev = await db.query(
      `insert into public.vehicle_timeline_events
         (vehicle_id, owner_user_id, vin, layer, category, title, source_type, source_name, occurred_at)
       values ($1, $2, (select vin from public.user_vehicles where id = $1), 'reported', 'service', 'Oil change', 'owner', 'Test Owner', now())
       returning id`,
      [V2, OWNER]
    );
    const eventId = ev.rows[0].id;

    let deleteBlocked = false;
    let deleteMessage = "";
    try {
      await db.query(`delete from public.vehicle_timeline_events where id = $1`, [eventId]);
    } catch (e) {
      deleteBlocked = e.message.includes("append-only");
      deleteMessage = e.message;
    }

    let updateBlocked = false;
    let updateMessage = "";
    try {
      await db.query(
        `update public.vehicle_timeline_events set title = 'Changed' where id = $1`,
        [eventId]
      );
    } catch (e) {
      updateBlocked = e.message.includes("append-only");
      updateMessage = e.message;
    }

    const stillExists = await countRows(
      `select count(*)::int as n from public.vehicle_timeline_events where id = $1`,
      [eventId]
    );

    const pass = deleteBlocked && updateBlocked && stillExists === 1;
    record(
      "event-direct-mutation-blocked",
      "Direct mutation of timeline events is blocked",
      pass,
      JSON.stringify({ deleteBlocked, deleteMessage, updateBlocked, updateMessage, stillExists })
    );
  } catch (e) {
    record("event-direct-mutation-blocked", "Direct mutation of timeline events is blocked", false, e.message);
  }

  // Scenario 6
  try {
    const bid = await makeBaseline(V2, OWNER);
    await answerCore(bid, V2, OWNER);
    const seed = await db.query(
      `select id from public.weak_point_checks where slug = $1`,
      ["mercedes-benz-glc-x253-rear-wheel-wells"]
    );
    const seedId = seed.rows[0].id;
    await db.query(
      `insert into public.vehicle_baseline_responses
         (baseline_id, vehicle_id, owner_user_id, weak_point_check_id, check_key, check_label, response, source_name)
       values ($1, $2, $3, $4, $5, $6, 'issue', 'Test Owner')`,
      [
        bid,
        V2,
        OWNER,
        seedId,
        "weakpoint:mercedes-benz-glc-x253-rear-wheel-wells",
        "Rear wheel wells",
      ]
    );
    const res = await tryComplete(bid);

    let deleteBlocked = false;
    let deleteMessage = "";
    try {
      await db.query(`delete from public.vehicle_baselines where id = $1`, [bid]);
    } catch (e) {
      deleteBlocked = e.message.includes("immutable");
      deleteMessage = e.message;
    }

    const statusRes = await db.query(
      `select status from public.vehicle_baselines where id = $1`,
      [bid]
    );

    const pass =
      res.ok &&
      deleteBlocked &&
      statusRes.rows[0]?.status === "completed";
    record(
      "baseline-direct-delete-blocked",
      "Direct delete of a completed baseline is blocked",
      pass,
      JSON.stringify({ completed: res.ok, deleteBlocked, deleteMessage, status: statusRes.rows[0]?.status })
    );
  } catch (e) {
    record("baseline-direct-delete-blocked", "Direct delete of a completed baseline is blocked", false, e.message);
  }

  // Scenario 7
  try {
    await db.query(`select set_config('app.uid', $1, false)`, [OWNER2]);
    await makeVehicle(V3, OWNER2, 2020, "Toyota", "RAV4", "JTMB1RFV0LD000001");
    await db.query(
      `insert into public.vehicle_timeline_events
         (vehicle_id, owner_user_id, vin, layer, category, title, source_type, source_name, occurred_at)
       values ($1, $2, (select vin from public.user_vehicles where id = $1), 'reported', 'service', 'Oil change', 'owner', 'Test Owner', now())`,
      [V3, OWNER2]
    );
    const bid = await makeBaseline(V3, OWNER2);
    await answerCore(bid, V3, OWNER2);

    await db.query(`select set_config('app.uid', $1, false)`, [OWNER]);
    await db.query(`delete from auth.users where id = $1`, [OWNER2]);

    const vehicleCount = await countRows(
      `select count(*)::int as n from public.user_vehicles where id = $1`,
      [V3]
    );
    const eventCount = await countRows(
      `select count(*)::int as n from public.vehicle_timeline_events where owner_user_id = $1`,
      [OWNER2]
    );
    const baselineCount = await countRows(
      `select count(*)::int as n from public.vehicle_baselines where owner_user_id = $1`,
      [OWNER2]
    );
    const responseCount = await countRows(
      `select count(*)::int as n from public.vehicle_baseline_responses where owner_user_id = $1`,
      [OWNER2]
    );

    const pass =
      vehicleCount === 0 &&
      eventCount === 0 &&
      baselineCount === 0 &&
      responseCount === 0;
    record(
      "account-delete-cascades",
      "Deleting an account cascades all owned records",
      pass,
      JSON.stringify({ vehicleCount, eventCount, baselineCount, responseCount })
    );
  } catch (e) {
    record("account-delete-cascades", "Deleting an account cascades all owned records", false, e.message);
  }

  console.log(JSON.stringify(results));
  await db.close();
  process.exit(0);
}

main();
