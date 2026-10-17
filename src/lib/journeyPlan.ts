export type BudgetTier = 'low' | 'medium' | 'high';
export type MetroArea = 'detroit' | 'columbus' | 'other';
export type JourneyStepKey = 'getting_around' | 'getting_car_there' | 'paying_for_it';

export interface JourneySituationInput {
  downtimeDaysMin: number;
  downtimeDaysMax: number;
  dailyDistanceMiles: number;
  budgetTier: BudgetTier;
  vehicleDrivable: boolean;
  metroArea: MetroArea;
  issueCategory?: string;
}

export interface TransitOption {
  agencyName: string;
  plannerUrl: string;
  metroArea: 'detroit' | 'columbus';
}

export type PlanItemKind = 'real' | 'partner_slot';

export interface PlanLink {
  label: string;
  url: string;
}

export interface PlanItem {
  key: string;
  label: string;
  kind: PlanItemKind;
  description: string;
  transitOption?: TransitOption;
  links?: PlanLink[];
}

export interface PlanStep {
  step: JourneyStepKey;
  title: string;
  items: PlanItem[];
}

export interface JourneyPlan {
  steps: PlanStep[];
}

export interface CoverageGuidance {
  show: boolean;
  text: string;
}

/**
 * Qualitative, non-numeric cost-framing phrases keyed by daily distance band.
 * Each phrase contains the word "estimated" and never contains a dollar sign
 * or a specific price figure.
 */
export const COST_FRAMES: Record<'short' | 'moderate' | 'longer', string> = {
  short:
    'Short daily trips like this tend to add up to a modest estimated total over a few days.',
  moderate:
    'Moderate daily distances like this typically bring a mid-range estimated total if downtime stretches on.',
  longer:
    'Longer daily distances like this can push the estimated total noticeably higher over the downtime period.',
};

/**
 * Resolve the cost-framing band for a given daily distance in miles.
 */
function getCostFrameKey(dailyDistanceMiles: number): 'short' | 'moderate' | 'longer' {
  if (dailyDistanceMiles < 10) return 'short';
  if (dailyDistanceMiles <= 25) return 'moderate';
  return 'longer';
}

/**
 * Return the official transit option for a supported metro area, or null
 * for metros without a known integration.
 */
export function getTransitOptionForMetro(metro: MetroArea): TransitOption | null {
  if (metro === 'detroit') {
    return {
      agencyName: 'SMART',
      plannerUrl: 'https://www.smartbus.org',
      metroArea: 'detroit',
    };
  }
  if (metro === 'columbus') {
    return {
      agencyName: 'COTA',
      plannerUrl: 'https://www.cota.com',
      metroArea: 'columbus',
    };
  }
  return null;
}

function buildGettingAroundItems(input: JourneySituationInput): PlanItem[] {
  const costFrame = COST_FRAMES[getCostFrameKey(input.dailyDistanceMiles)];

  const rideshareItem: PlanItem = {
    key: 'rideshare_slot',
    label: 'Rideshare',
    kind: 'real',
    description: `Rideshare can cover short hops while your vehicle is out. ${costFrame}`,
    links: [
      { label: 'Open Uber', url: 'https://www.uber.com' },
      { label: 'Open Lyft', url: 'https://www.lyft.com' },
    ],
  };

  const rentalItem: PlanItem = {
    key: 'rental_slot',
    label: 'Rental car',
    kind: 'real',
    description:
      'A rental car tends to make more sense for longer downtime, since it replaces your vehicle entirely rather than trip by trip. The estimated total scales with how many days you need one.',
    links: [
      { label: 'Open Enterprise', url: 'https://www.enterprise.com' },
      { label: 'Open Hertz', url: 'https://www.hertz.com' },
      { label: 'Open Avis', url: 'https://www.avis.com' },
      { label: 'Open Budget', url: 'https://www.budget.com' },
    ],
  };

  const transitOption = getTransitOptionForMetro(input.metroArea);
  const transitItem: PlanItem = transitOption
    ? {
        key: 'public_transit',
        label: `Public transit (${transitOption.agencyName})`,
        kind: 'real',
        description: `Plan your trip using ${transitOption.agencyName}'s official trip planner at ${transitOption.plannerUrl}.`,
        transitOption,
      }
    : {
        key: 'public_transit',
        label: 'Public transit',
        kind: 'real',
        description:
          'Local transit options depend on where you live, so check the national directory of transit agencies maintained by the American Public Transportation Association (APTA) to find your local agency.',
        links: [
          {
            label: 'Find your local transit agency',
            url: 'https://www.apta.com/research-technical-resources/public-transportation-links/',
          },
        ],
      };

  if (input.budgetTier === 'low') {
    return [transitItem, rideshareItem, rentalItem];
  }

  return [rideshareItem, rentalItem, transitItem];
}

function buildGettingCarThereItems(input: JourneySituationInput): PlanItem[] {
  if (input.vehicleDrivable) {
    return [
      {
        key: 'drop_off_self',
        label: 'Drive it in yourself',
        kind: 'real',
        description:
          'Drive the vehicle to the shop yourself and arrange a ride or transit trip home, then plan how you will get back to pick it up once work is complete.',
      },
    ];
  }

  return [
    {
      key: 'tow_slot',
      label: 'Towing',
      kind: 'partner_slot',
      description: 'Arrange a tow to get the vehicle from its current location to the shop.',
    },
    {
      key: 'pickup_delivery',
      label: 'Shop pickup & delivery',
      kind: 'partner_slot',
      description: 'Some shops offer pickup and delivery so you never have to arrange your own ride.',
    },
    {
      key: 'mobile_inspection_slot',
      label: 'Mobile inspection',
      kind: 'partner_slot',
      description:
        'A mobile technician can perform an initial assessment at the vehicle\'s location before it moves anywhere.',
    },
  ];
}

function buildPayingForItItems(): PlanItem[] {
  return [
    {
      key: 'financing_info',
      label: 'Financing options',
      kind: 'real',
      description:
        'Some financing options are available right now, and more are coming soon. See the financing options page for what is currently offered.',
    },
    {
      key: 'financing_apply_slot',
      label: 'Apply for financing',
      kind: 'partner_slot',
      description: 'Apply for financing to help cover the cost of this repair.',
    },
    {
      key: 'service_contract_check',
      label: 'Service contract check',
      kind: 'real',
      description:
        'If you have a service contract or warranty on file in your Garage, check it before paying — some repairs may be covered.',
    },
  ];
}

/**
 * Build the fixed three-step journey plan for a given situation. Step order
 * is always getting_around, getting_car_there, paying_for_it.
 */
export function buildJourneyPlan(input: JourneySituationInput): JourneyPlan {
  return {
    steps: [
      {
        step: 'getting_around',
        title: 'Getting around',
        items: buildGettingAroundItems(input),
      },
      {
        step: 'getting_car_there',
        title: 'Getting the car there',
        items: buildGettingCarThereItems(input),
      },
      {
        step: 'paying_for_it',
        title: 'Paying for it',
        items: buildPayingForItItems(),
      },
    ],
  };
}

/**
 * Return a new plan with shop-context-sensitive items filtered. Currently
 * only affects the mobile_inspection_slot item in getting_car_there, which
 * is only shown when the shop in context supports mobile_service.
 */
export function filterPlanForShopContext(
  plan: JourneyPlan,
  capabilities: string[] | null
): JourneyPlan {
  const showMobileInspection =
    capabilities !== null && capabilities.includes('mobile_service');

  return {
    steps: plan.steps.map((step) => {
      if (step.step !== 'getting_car_there') {
        return { ...step, items: [...step.items] };
      }
      return {
        ...step,
        items: step.items.filter((item) => {
          if (item.key !== 'mobile_inspection_slot') return true;
          return showMobileInspection;
        }),
      };
    }),
  };
}

/**
 * Determine whether and what coverage guidance to show based on whether the
 * user has a service contract on file and whether an issue category is known.
 */
export function buildCoverageGuidance(
  hasServiceContract: boolean,
  issueCategory: string | undefined
): CoverageGuidance {
  if (!hasServiceContract) {
    return { show: false, text: '' };
  }
  if (!issueCategory) {
    return {
      show: true,
      text: 'You have a service contract on file. Check with your provider about what it covers before paying out of pocket.',
    };
  }
  return {
    show: true,
    text: 'This repair may be covered under your service contract with {providerName} — verify with your provider before paying out of pocket.',
  };
}

/**
 * Format coverage guidance text for display, substituting the provider name
 * placeholder and appending the standard Wrenchli disclaimer.
 */
export function formatCoverageGuidance(g: CoverageGuidance, providerName: string): string {
  if (!g.show) return '';
  const substituted = g.text.includes('{providerName}')
    ? g.text.replace('{providerName}', providerName)
    : g.text;
  return `${substituted} Wrenchli does not determine coverage — your provider has the final answer.`;
}
