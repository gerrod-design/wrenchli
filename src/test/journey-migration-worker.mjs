// Plain Node worker that exercises the journey-plan migration against a real
// Postgres-compatible engine (PGlite) outside of jsdom/vitest. Mirrors the
// pattern in garage-migration-worker.mjs: boot PGlite, load platform stubs
// (auth schema + user_vehicles), apply the migration under test, seed fixture
// data, run a battery of scenarios, and print a single JSON array of results
// on stdout so the vitest wrapper can assert against it.

import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';
const VEHICLE = 'aaaaaaaa-0000-0000-0000-000000000001';

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
}

async function main() {
  const stubsSql = readFileSync(
    new URL('./garage-migration-stubs.sql', import.meta.url),
    'utf8',
  );
  const migrationSql = readFileSync(
    new URL(
      '../../supabase/migrations/20261015133000_journey_plan.sql',
      import.meta.url,
    ),
    'utf8',
  );

  const db = new PGlite();

  await db.exec(stubsSql);
  await db.exec(migrationSql);

  await db.exec(`
    insert into auth.users (id) values ('${USER_A}'), ('${USER_B}');
  `);

  await db.exec(`
    insert into public.user_vehicles (id, user_id, year, make, model, vin)
    values ('${VEHICLE}', '${USER_A}', 2016, 'Mercedes-Benz', 'GLC', 'WDC0G4KB3GF052161');
  `);

  // 1. tables_exist
  try {
    const { rows } = await db.query(`
      select table_name from information_schema.tables
      where table_schema = 'public'
        and table_name in ('journey_plans', 'journey_plan_selections', 'vehicle_service_contracts', 'shop_capabilities');
    `);
    const found = rows.map((r) => r.table_name);
    const expected = [
      'journey_plans',
      'journey_plan_selections',
      'vehicle_service_contracts',
      'shop_capabilities',
    ];
    const missing = expected.filter((t) => !found.includes(t));

  // Mirror Supabase platform default privileges (the stubs do not provide
  // them; production projects grant these automatically). RLS policies in
  // the migration then do the row-level work these scenarios exercise.
  await db.exec(`
    grant select, insert, update, delete on public.journey_plans to authenticated;
    grant select, insert, update, delete on public.journey_plan_selections to authenticated;
    grant select, insert, update, delete on public.vehicle_service_contracts to authenticated;
    grant select on public.shop_capabilities to authenticated, anon;
  `);
    record(
      'tables_exist',
      'all four journey tables exist',
      missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : `found: ${found.join(', ')}`,
    );
  } catch (err) {
    record('tables_exist', 'all four journey tables exist', false, String(err));
  }

  // 2. rls_enabled
  try {
    const { rows } = await db.query(`
      select tablename, rowsecurity from pg_tables
      where schemaname = 'public'
        and tablename in ('journey_plans', 'journey_plan_selections', 'vehicle_service_contracts', 'shop_capabilities');
    `);
    const disabled = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
    const pass = rows.length === 4 && disabled.length === 0;
    record(
      'rls_enabled',
      'RLS enabled on all four journey tables',
      pass,
      disabled.length ? `rls disabled on: ${disabled.join(', ')}` : `checked ${rows.length} tables`,
    );
  } catch (err) {
    record('rls_enabled', 'RLS enabled on all four journey tables', false, String(err));
  }

  // 3. provenance_defaults
  try {
    const { rows: planRows } = await db.query(`
      insert into public.journey_plans
        (user_id, vehicle_id, downtime_days_min, downtime_days_max, daily_distance_miles, budget_tier, vehicle_drivable, metro_area, plan_snapshot)
      values
        ('${USER_A}', '${VEHICLE}', 1, 3, 10, 'low', false, 'detroit', '{}'::jsonb)
      returning layer, source_type;
    `);
    const plan = planRows[0];
    const planOk = plan.layer === 'reported' && plan.source_type === 'owner';

    const { rows: contractRows } = await db.query(`
      insert into public.vehicle_service_contracts (user_id, vehicle_id, provider_name)
      values ('${USER_A}', '${VEHICLE}', 'Acme')
      returning layer, source_type;
    `);
    const contract = contractRows[0];
    const contractOk = contract.layer === 'reported' && contract.source_type === 'owner';

    const { rows: capRows } = await db.query(`
      insert into public.shop_capabilities (shop_id, capability)
      values ('shop-1', 'loaner_cars')
      returning source_type;
    `);
    const cap = capRows[0];
    const capOk = cap.source_type === 'shop';

    const pass = planOk && contractOk && capOk;
    record(
      'provenance_defaults',
      'default layer/source_type values are applied',
      pass,
      JSON.stringify({ plan, contract, cap }),
    );
  } catch (err) {
    record('provenance_defaults', 'default layer/source_type values are applied', false, String(err));
  }

  // 4. owner_isolation
  try {
    await db.exec(`select set_config('app.uid', '${USER_A}', false);`);
    await db.exec(`set role authenticated;`);
    const { rows: aRows } = await db.query(`select count(*)::int as count from public.journey_plans;`);
    const aCount = aRows[0].count;

    await db.exec(`select set_config('app.uid', '${USER_B}', false);`);
    const { rows: bRows } = await db.query(`select count(*)::int as count from public.journey_plans;`);
    const bCount = bRows[0].count;

    await db.exec(`reset role;`);

    const pass = aCount === 1 && bCount === 0;
    record('owner_isolation', 'owners only see their own journey plans', pass, `A=${aCount}, B=${bCount}`);
  } catch (err) {
    try {
      await db.exec('reset role;');
    } catch {
      /* ignore */
    }
    record('owner_isolation', 'owners only see their own journey plans', false, String(err));
  }

  // 5. contracts_isolation
  try {
    await db.exec(`select set_config('app.uid', '${USER_A}', false);`);
    await db.exec(`set role authenticated;`);
    const { rows: aRows } = await db.query(
      `select count(*)::int as count from public.vehicle_service_contracts;`,
    );
    const aCount = aRows[0].count;

    await db.exec(`select set_config('app.uid', '${USER_B}', false);`);
    const { rows: bRows } = await db.query(
      `select count(*)::int as count from public.vehicle_service_contracts;`,
    );
    const bCount = bRows[0].count;

    await db.exec(`reset role;`);

    const pass = aCount === 1 && bCount === 0;
    record(
      'contracts_isolation',
      'owners only see their own service contracts',
      pass,
      `A=${aCount}, B=${bCount}`,
    );
  } catch (err) {
    try {
      await db.exec('reset role;');
    } catch {
      /* ignore */
    }
    record('contracts_isolation', 'owners only see their own service contracts', false, String(err));
  }

  // 6. capabilities_public_read
  try {
    await db.exec(`set role anon;`);
    await db.exec(`select set_config('app.uid', '', false);`);
    const { rows } = await db.query(`select count(*)::int as count from public.shop_capabilities;`);
    await db.exec(`reset role;`);

    const pass = rows[0].count >= 1;
    record('capabilities_public_read', 'anon can read shop capabilities', pass, `count=${rows[0].count}`);
  } catch (err) {
    try {
      await db.exec('reset role;');
    } catch {
      /* ignore */
    }
    record('capabilities_public_read', 'anon can read shop capabilities', false, String(err));
  }

  // 7. capabilities_no_public_write
  try {
    await db.exec(`select set_config('app.uid', '${USER_A}', false);`);
    await db.exec(`set role authenticated;`);
    let threw = false;
    try {
      await db.exec(`insert into public.shop_capabilities (shop_id, capability) values ('shop-2', 'shuttle');`);
    } catch {
      threw = true;
    }
    await db.exec(`reset role;`);

    record(
      'capabilities_no_public_write',
      'authenticated users cannot write shop capabilities',
      threw,
      threw ? 'insert correctly rejected' : 'insert unexpectedly succeeded',
    );
  } catch (err) {
    try {
      await db.exec('reset role;');
    } catch {
      /* ignore */
    }
    record('capabilities_no_public_write', 'authenticated users cannot write shop capabilities', false, String(err));
  }

  // 8. check_constraints
  try {
    let planThrew = false;
    try {
      await db.exec(`
        insert into public.journey_plans
          (user_id, vehicle_id, downtime_days_min, downtime_days_max, daily_distance_miles, budget_tier, vehicle_drivable, metro_area, plan_snapshot)
        values
          ('${USER_A}', '${VEHICLE}', 1, 3, 10, 'bogus', false, 'detroit', '{}'::jsonb);
      `);
    } catch {
      planThrew = true;
    }

    let capThrew = false;
    try {
      await db.exec(`insert into public.shop_capabilities (shop_id, capability) values ('shop-3', 'bogus_cap');`);
    } catch {
      capThrew = true;
    }

    const pass = planThrew && capThrew;
    record(
      'check_constraints',
      'check constraints reject invalid enum-like values',
      pass,
      `planThrew=${planThrew}, capThrew=${capThrew}`,
    );
  } catch (err) {
    record('check_constraints', 'check constraints reject invalid enum-like values', false, String(err));
  }

  console.log(JSON.stringify(results));
}

main().catch((err) => {
  console.log(
    JSON.stringify([
      { id: 'boot', name: 'worker booted successfully', pass: false, detail: String(err && err.stack ? err.stack : err) },
    ]),
  );
  process.exit(0);
});
