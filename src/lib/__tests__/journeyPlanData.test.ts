import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  inserts: [] as any[],
  mode: 'ok' as 'ok' | 'error',
  rows: [] as any[],
  lastTable: '' as string,
}));

vi.mock('@/integrations/supabase/client', () => {
  function makeBuilder(table: string) {
    const builder: any = {
      insert(payload: any) {
        state.inserts.push({ table, payload });
        return builder;
      },
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      single() {
        return Promise.resolve(
          state.mode === 'ok'
            ? { data: state.rows[0] ?? {}, error: null }
            : { data: null, error: new Error('boom') }
        );
      },
      maybeSingle() {
        return Promise.resolve({ data: state.rows[0] ?? null, error: null });
      },
      then(onFulfilled: any, onRejected: any) {
        const result = {
          data: state.rows,
          error: state.mode === 'ok' ? null : new Error('boom'),
        };
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return {
    supabase: {
      from(table: string) {
        state.lastTable = table;
        return makeBuilder(table);
      },
    },
  };
});

import {
  saveJourneyPlan,
  saveJourneyPlanSelection,
  saveServiceContract,
  getShopCapabilities,
  getServiceContracts,
} from '@/lib/journeyPlanData';
import { buildJourneyPlan, type JourneySituationInput } from '@/lib/journeyPlan';

beforeEach(() => {
  state.inserts = [];
  state.rows = [];
  state.mode = 'ok';
  state.lastTable = '';
});

const input: JourneySituationInput = {
  downtimeDaysMin: 1,
  downtimeDaysMax: 3,
  dailyDistanceMiles: 12,
  budgetTier: 'low',
  vehicleDrivable: false,
  metroArea: 'columbus',
  issueCategory: 'engine',
};

describe('saveJourneyPlan', () => {
  it('inserts into journey_plans and resolves the created row', async () => {
    state.rows = [{ id: 'plan-1' }];
    const plan = buildJourneyPlan(input);

    const result = await saveJourneyPlan('user-1', 'veh-1', input, plan);

    expect(result).toEqual({ id: 'plan-1' });
    expect(state.inserts).toHaveLength(1);
    const entry = state.inserts[0];
    expect(entry.table).toBe('journey_plans');
    expect(entry.payload).toMatchObject({
      user_id: 'user-1',
      vehicle_id: 'veh-1',
      budget_tier: input.budgetTier,
      plan_snapshot: plan,
      layer: 'reported',
      source_type: 'owner',
      assessment_id: null,
    });
  });
});

describe('saveJourneyPlanSelection', () => {
  it('inserts into journey_plan_selections with expected fields', async () => {
    state.rows = [{ id: 'sel-1' }];

    await saveJourneyPlanSelection('user-1', 'plan-1', 'getting_around', 'public_transit');

    expect(state.inserts).toHaveLength(1);
    const entry = state.inserts[0];
    expect(entry.table).toBe('journey_plan_selections');
    expect(entry.payload).toMatchObject({
      layer: 'reported',
      source_type: 'owner',
      option_key: 'public_transit',
    });
  });
});

describe('saveServiceContract', () => {
  it('inserts into vehicle_service_contracts with expected fields', async () => {
    state.rows = [{ id: 'contract-1' }];

    await saveServiceContract('user-1', 'veh-1', { providerName: 'Acme Warranty Co' } as any);

    expect(state.inserts).toHaveLength(1);
    const entry = state.inserts[0];
    expect(entry.table).toBe('vehicle_service_contracts');
    expect(entry.payload).toMatchObject({
      provider_name: 'Acme Warranty Co',
      plan_name: null,
      layer: 'reported',
      source_type: 'owner',
    });
  });
});

describe('getShopCapabilities', () => {
  it('resolves an array of capability strings', async () => {
    state.rows = [{ capability: 'loaner_cars' }, { capability: 'shuttle' }];

    const result = await getShopCapabilities('shop-9');

    expect(result).toEqual(['loaner_cars', 'shuttle']);
  });

  it('resolves an empty array on error, never throws', async () => {
    state.mode = 'error';

    const result = await getShopCapabilities('shop-9');

    expect(result).toEqual([]);
  });
});

describe('getServiceContracts', () => {
  it('resolves the rows array', async () => {
    state.rows = [{ id: 'c1' }, { id: 'c2' }];

    const result = await getServiceContracts('veh-1');

    expect(result).toEqual(state.rows);
  });
});
