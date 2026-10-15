/**
 * Worker for garageConditionCheckTrigger.test.ts.
 *
 * Boots PGlite (real PostgreSQL), replays the Garage migration over the
 * platform stubs in garage-migration-stubs.sql, then runs the condition-
 * check timeline-trigger scenarios and prints a JSON array of results:
 * [{ id, name, pass, detail }]. Runs as a plain Node child process because
 * the repo's Vitest setup targets jsdom, while PGlite needs a Node fs.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const OWNER = "11111111-1111-1111-1111-111111111111";
const VEHICLE = "aaaaaaaa-0000-0000-0000-000000000001";

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass: Boolean(pass), detail: String(detail) });
}

const db = new PGlite();
try {
  await db.exec(
    readFileSync(new URL("./garage-migration-stubs.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    readFileSync(
      new URL(
        "../../supabase/migrations/20261012173000_garage_two_layer_record.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`
    insert into auth.users (id) values ('${OWNER}');
    insert into public.user_vehicles (id, user_id, year, make, model, vin)
    values ('${VEHICLE}', '${OWNER}', 2017, 'Mercedes-Benz', 'GLC',
            'WDC0G4KB3GF052161');
  `);
} catch (error) {
  console.error(`migration replay failed: ${error.message}`);
  process.exit(1);
}

async function eventCount(checkId) {
  const r = await db.query(
    `select count(*)::int as n from public.vehicle_timeline_events
     where condition_check_id = $1`,
    [checkId],
  );
  return r.rows[0].n;
}

async function newCheck(checkKey, label) {
  const r = await db.query(
    `insert into public.vehicle_condition_checks
       (vehicle_id, owner_user_id, check_key, label)
     values ($1, $2, $3, $4) returning id`,
    [VEHICLE, OWNER, checkKey, label],
  );
  return r.rows[0].id;
}

async function recordStatus(checkId, status, note) {
  await db.query(
    `update public.vehicle_condition_checks
     set status = $2, last_checked_at = now(), last_source_type = 'owner',
         last_source_name = 'Gerrod Parchmon', note = $3
     where id = $1`,
    [checkId, status, note],
  );
}

// GATE-A1: status change + note-only edit on the checked row -> 1 event.
{
  const id = "gate-a1";
  const name =
    "note-only edit on a checked row writes no second timeline event";
  try {
    const checkId = await newCheck("smell_cabin", "Cabin smell");
    await recordStatus(checkId, "checked_issue", "Musty smell at pickup");
    const afterStatus = await eventCount(checkId);
    await db.query(
      `update public.vehicle_condition_checks
       set note = 'Musty smell at pickup; stronger after rain' where id = $1`,
      [checkId],
    );
    const afterNoteEdit = await eventCount(checkId);
    const events = await db.query(
      `select title, detail from public.vehicle_timeline_events
       where condition_check_id = $1`,
      [checkId],
    );
    const row = await db.query(
      `select note from public.vehicle_condition_checks where id = $1`,
      [checkId],
    );
    const pass =
      afterStatus === 1 &&
      afterNoteEdit === 1 &&
      events.rows.length === 1 &&
      events.rows[0].title === "Cabin smell — issue recorded" &&
      events.rows[0].detail === "Musty smell at pickup" &&
      row.rows[0].note === "Musty smell at pickup; stronger after rain";
    record(
      id,
      name,
      pass,
      `events after status change=${afterStatus}, after note edit=${afterNoteEdit}, ` +
        `event=${JSON.stringify(events.rows[0] ?? null)}, row note=${JSON.stringify(row.rows[0].note)}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// D3 sibling: note-only update on a not_checked row -> 0 events.
{
  const id = "d3-sibling";
  const name = "note-only update on a not_checked check writes no event";
  try {
    const checkId = await newCheck("sound_idle", "Engine idle sound");
    await db.query(
      `update public.vehicle_condition_checks
       set note = 'Will check at pickup' where id = $1`,
      [checkId],
    );
    const count = await eventCount(checkId);
    record(id, name, count === 0, `events=${count}`);
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// One event per status change.
{
  const id = "status-changes";
  const name = "each status change writes exactly one timeline event";
  try {
    const checkId = await newCheck("feel_brakes", "Brake pedal feel");
    await recordStatus(checkId, "checked_issue", "Pedal feels spongy");
    const afterFirst = await eventCount(checkId);
    await recordStatus(checkId, "checked_ok", "Pedal firm after bleed");
    const afterSecond = await eventCount(checkId);
    record(
      id,
      name,
      afterFirst === 1 && afterSecond === 2,
      `after first=${afterFirst}, after second=${afterSecond}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

// Evidence-media change (status unchanged) -> one event; note edit -> none.
{
  const id = "media-change";
  const name =
    "evidence-media change writes an event; a later note-only edit does not";
  try {
    const checkId = await newCheck("sight_dash", "Dash warning lights");
    await recordStatus(checkId, "checked_ok", "No warning lights");
    const afterStatus = await eventCount(checkId);
    await db.query(
      `update public.vehicle_condition_checks
       set evidence_media =
             '[{"bucket":"garage-vehicle-media","path":"u/v/dash.jpg"}]'::jsonb
       where id = $1`,
      [checkId],
    );
    const afterMedia = await eventCount(checkId);
    await db.query(
      `update public.vehicle_condition_checks
       set note = 'Photo added later' where id = $1`,
      [checkId],
    );
    const afterNote = await eventCount(checkId);
    record(
      id,
      name,
      afterStatus === 1 && afterMedia === 2 && afterNote === 2,
      `after status=${afterStatus}, after media=${afterMedia}, after note edit=${afterNote}`,
    );
  } catch (error) {
    record(id, name, false, error.message);
  }
}

console.log(JSON.stringify(results));
await db.close();
process.exit(0);
