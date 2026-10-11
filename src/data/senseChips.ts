import type { SenseType } from '@/types/symptom';

export const SENSE_CHIPS: Record<SenseType, string[]> = {
  SEE: [
    'warning light on',
    'smoke',
    'steam',
    'leak under car',
    'visible damage',
    'tire looks low',
    'fluid on ground',
    'rust/corrosion',
  ],
  HEAR: [
    'squealing',
    'grinding',
    'knocking',
    'rattling',
    'hissing',
    'clicking',
    'humming/whining',
    'clunking over bumps',
  ],
  SMELL: [
    'sweet',
    'rotten egg',
    'burning',
    'gasoline',
    'musty',
    'hot/metallic',
  ],
  FEEL: [
    'vibration in steering wheel',
    'vibration in seat',
    'pulling left',
    'pulling right',
    'spongy brake pedal',
    'shaking at speed',
    'hard to steer',
  ],
};

export const TIMING_CHIPS: string[] = [
  'just started',
  'hours ago',
  'days ago',
  'weeks ago',
  'worse in the morning',
  'worse when engine is hot',
];

export const CONDITION_CHIPS: string[] = [
  'when braking',
  'when accelerating',
  'at idle',
  'over bumps',
  'turning',
  'at highway speed',
  'cold start',
];

export const LOCATION_CHIPS: string[] = [
  'front',
  'rear',
  'left side',
  'right side',
  'under the hood',
  'inside the cabin',
  'near a wheel',
];

export const SENSE_LABELS: Record<SenseType, string> = {
  SEE: 'See',
  HEAR: 'Hear',
  SMELL: 'Smell',
  FEEL: 'Feel',
};

export const SENSE_ICONS: Record<SenseType, string> = {
  SEE: '👁️',
  HEAR: '👂',
  SMELL: '👃',
  FEEL: '✋',
};

export const SENSE_ORDER: SenseType[] = ['SEE', 'HEAR', 'SMELL', 'FEEL'];
