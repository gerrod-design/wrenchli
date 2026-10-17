import { describe, it, expect } from 'vitest';
import {
  COST_FRAMES,
  getTransitOptionForMetro,
  buildJourneyPlan,
  filterPlanForShopContext,
  buildCoverageGuidance,
  formatCoverageGuidance,
  type JourneySituationInput,
  type JourneyPlan,
} from '@/lib/journeyPlan';

const baseInput: JourneySituationInput = {
  downtimeDaysMin: 2,
  downtimeDaysMax: 4,
  dailyDistanceMiles: 18,
  budgetTier: 'medium',
  vehicleDrivable: false,
  metroArea: 'detroit',
  issueCategory: 'brakes',
};

function stepOf(plan: JourneyPlan, key: string) {
  return (plan as any).steps.find((s: any) => s.step === key);
}

function itemsOf(plan: JourneyPlan, key: string): any[] {
  const step = stepOf(plan, key);
  return step ? step.items : [];
}

function allItems(plan: JourneyPlan): any[] {
  return (plan as any).steps.flatMap((s: any) => s.items);
}

const budgetTiers = ['low', 'medium', 'high'] as const;
const metroAreas = ['detroit', 'columbus', 'other'] as const;
const drivableOptions = [true, false];

describe('getTransitOptionForMetro', () => {
  it('returns SMART for detroit', () => {
    expect(getTransitOptionForMetro('detroit')).toMatchObject({
      agencyName: 'SMART',
      plannerUrl: 'https://www.smartbus.org',
    });
  });

  it('returns COTA for columbus', () => {
    expect(getTransitOptionForMetro('columbus')).toMatchObject({
      agencyName: 'COTA',
      plannerUrl: 'https://www.cota.com',
    });
  });

  it('returns null for other', () => {
    expect(getTransitOptionForMetro('other')).toBeNull();
  });
});

describe('buildJourneyPlan structure', () => {
  it('always returns exactly 3 steps in order', () => {
    const plan = buildJourneyPlan(baseInput);
    const keys = (plan as any).steps.map((s: any) => s.step);
    expect(keys).toEqual(['getting_around', 'getting_car_there', 'paying_for_it']);
  });

  it('detroit plan contains a real public_transit item with SMART transitOption', () => {
    const plan = buildJourneyPlan(baseInput);
    const items = itemsOf(plan, 'getting_around');
    const transit = items.find((i) => i.key === 'public_transit');
    expect(transit).toBeDefined();
    expect(transit.kind).toBe('real');
    expect(transit.transitOption.agencyName).toBe('SMART');
  });

  it('metro other gets the national transit directory fallback item', () => {
    const plan = buildJourneyPlan({ ...baseInput, metroArea: 'other' });
    const items = itemsOf(plan, 'getting_around');
    const item = items.find((i) => i.key === 'public_transit');
    expect(item).toBeDefined();
    expect(item?.kind).toBe('real');
    expect(item?.label).toBe('Public transit');
    expect(item?.transitOption).toBeUndefined();
    expect(item?.links).toEqual([
      { label: 'Find your local transit agency', url: 'https://www.apta.com/research-technical-resources/public-transportation-links/' },
    ]);
  });

  it('low budget + detroit puts public_transit first', () => {
    const plan = buildJourneyPlan({ ...baseInput, budgetTier: 'low', metroArea: 'detroit' });
    const items = itemsOf(plan, 'getting_around');
    expect(items[0].key).toBe('public_transit');
  });

  it('low budget + other puts the transit fallback first', () => {
    const plan = buildJourneyPlan({ ...baseInput, budgetTier: 'low', metroArea: 'other' });
    const items = itemsOf(plan, 'getting_around');
    expect(items[0].key).toBe('public_transit');
  });

  it('medium budget + detroit puts rideshare_slot first', () => {
    const plan = buildJourneyPlan({ ...baseInput, budgetTier: 'medium', metroArea: 'detroit' });
    const items = itemsOf(plan, 'getting_around');
    expect(items[0].key).toBe('rideshare_slot');
  });

  it('rideshare_slot and rental_slot are real items with mobility links across full matrix', () => {
    for (const budgetTier of budgetTiers) {
      for (const metroArea of metroAreas) {
        for (const vehicleDrivable of drivableOptions) {
          const plan = buildJourneyPlan({
            ...baseInput,
            budgetTier,
            metroArea,
            vehicleDrivable,
          });
          const items = itemsOf(plan, 'getting_around');
          const rideshare = items.find((i) => i.key === 'rideshare_slot');
          const rental = items.find((i) => i.key === 'rental_slot');
          expect(rideshare).toBeDefined();
          expect(rideshare.kind).toBe('real');
          expect(rideshare.links).toEqual([
            { label: 'Open Uber', url: 'https://www.uber.com' },
            { label: 'Open Lyft', url: 'https://www.lyft.com' },
          ]);
          expect(rental).toBeDefined();
          expect(rental.kind).toBe('real');
          expect(rental.links).toEqual([
            { label: 'Open Enterprise', url: 'https://www.enterprise.com' },
            { label: 'Open Hertz', url: 'https://www.hertz.com' },
            { label: 'Open Avis', url: 'https://www.avis.com' },
            { label: 'Open Budget', url: 'https://www.budget.com' },
          ]);
        }
      }
    }
  });

  it('vehicleDrivable true -> getting_car_there has only drop_off_self', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: true });
    const items = itemsOf(plan, 'getting_car_there');
    expect(items.map((i) => i.key)).toEqual(['drop_off_self']);
  });

  it('vehicleDrivable false -> getting_car_there has tow/pickup/mobile inspection, all partner_slot', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: false });
    const items = itemsOf(plan, 'getting_car_there');
    expect(items.map((i) => i.key)).toEqual([
      'tow_slot',
      'pickup_delivery',
      'mobile_inspection_slot',
    ]);
    items.forEach((i) => expect(i.kind).toBe('partner_slot'));
  });

  it('paying_for_it has the expected keys and kinds', () => {
    const plan = buildJourneyPlan(baseInput);
    const items = itemsOf(plan, 'paying_for_it');
    expect(items.map((i) => i.key)).toEqual([
      'financing_info',
      'financing_apply_slot',
      'service_contract_check',
    ]);
    expect(items.map((i) => i.kind)).toEqual(['real', 'partner_slot', 'real']);
  });
});

describe('cost framing', () => {
  function rideshareDesc(dailyDistanceMiles: number) {
    const plan = buildJourneyPlan({ ...baseInput, dailyDistanceMiles });
    const items = itemsOf(plan, 'getting_around');
    const rideshare = items.find((i) => i.key === 'rideshare_slot');
    return rideshare.description as string;
  }

  it('short distance uses COST_FRAMES.short', () => {
    expect(rideshareDesc(5)).toContain(COST_FRAMES.short);
  });

  it('moderate distance uses COST_FRAMES.moderate', () => {
    expect(rideshareDesc(18)).toContain(COST_FRAMES.moderate);
  });

  it('longer distance uses COST_FRAMES.longer', () => {
    expect(rideshareDesc(40)).toContain(COST_FRAMES.longer);
  });
});

describe('purity of descriptions', () => {
  it('no description contains a $ figure or the word diagnos across full matrix', () => {
    const distances = [5, 18, 40];
    for (const budgetTier of budgetTiers) {
      for (const metroArea of metroAreas) {
        for (const vehicleDrivable of drivableOptions) {
          for (const dailyDistanceMiles of distances) {
            const plan = buildJourneyPlan({
              ...baseInput,
              budgetTier,
              metroArea,
              vehicleDrivable,
              dailyDistanceMiles,
            });
            for (const item of allItems(plan)) {
              expect(item.description.includes('$')).toBe(false);
              expect(item.description).not.toMatch(/diagnos/i);
            }
          }
        }
      }
    }
  });
});

describe('filterPlanForShopContext', () => {
  it('removes mobile_inspection_slot when capabilities is null and keeps plan immutable', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: false });
    const before = JSON.parse(JSON.stringify(plan));
    const filtered = filterPlanForShopContext(plan, null);
    const filteredItems = itemsOf(filtered, 'getting_car_there');
    expect(filteredItems.find((i) => i.key === 'mobile_inspection_slot')).toBeUndefined();
    expect(plan).toEqual(before);
  });

  it('removes mobile_inspection_slot when capabilities does not include mobile_service', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: false });
    const filtered = filterPlanForShopContext(plan, ['loaner_cars']);
    const filteredItems = itemsOf(filtered, 'getting_car_there');
    expect(filteredItems.find((i) => i.key === 'mobile_inspection_slot')).toBeUndefined();
  });

  it('keeps mobile_inspection_slot when capabilities includes mobile_service', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: false });
    const filtered = filterPlanForShopContext(plan, ['mobile_service']);
    const filteredItems = itemsOf(filtered, 'getting_car_there');
    expect(filteredItems.find((i) => i.key === 'mobile_inspection_slot')).toBeDefined();
  });

  it('passes through structurally equal when plan is drivable (no such item)', () => {
    const plan = buildJourneyPlan({ ...baseInput, vehicleDrivable: true });
    const filtered = filterPlanForShopContext(plan, null);
    expect(filtered).toEqual(plan);
  });
});

describe('buildCoverageGuidance / formatCoverageGuidance', () => {
  it('returns no guidance when hasContract is false', () => {
    expect(buildCoverageGuidance(false, 'brakes')).toEqual({ show: false, text: '' });
  });

  it('shows guidance when hasContract true, issueCategory undefined', () => {
    const guidance = buildCoverageGuidance(true, undefined);
    expect(guidance.show).toBe(true);
  });

  it('shows guidance with placeholder text when hasContract true, brakes', () => {
    const guidance = buildCoverageGuidance(true, 'brakes');
    expect(guidance.show).toBe(true);
    expect(guidance.text).toContain('may be covered');
    expect(guidance.text).toContain('{providerName}');
  });

  it('formatCoverageGuidance substitutes provider name and adds disclaimer', () => {
    const guidance = buildCoverageGuidance(true, 'brakes');
    const formatted = formatCoverageGuidance(guidance, 'Acme Warranty Co');
    expect(formatted).toContain('Acme Warranty Co');
    expect(formatted).not.toContain('{providerName}');
    expect(formatted).toContain('does not determine coverage');
  });

  it('formatCoverageGuidance returns empty string when show is false', () => {
    const guidance = buildCoverageGuidance(false, 'brakes');
    expect(formatCoverageGuidance(guidance, 'Acme Warranty Co')).toBe('');
  });
});
