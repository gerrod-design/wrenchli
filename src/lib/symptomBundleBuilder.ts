import type {
  SenseBundle,
  SenseObservation,
  SenseType,
  TimingDescriptor,
  ConditionDescriptor,
  LocationDescriptor,
} from '@/types/symptom';

export function buildSenseBundle(
  observations: SenseObservation[],
  timing: TimingDescriptor[],
  conditions: ConditionDescriptor[],
  locations: LocationDescriptor[],
  vehicleContext?: SenseBundle['vehicleContext'],
): SenseBundle {
  return {
    observations,
    timing,
    conditions,
    locations,
    vehicleContext,
    timestamp: new Date().toISOString(),
  };
}

export function createEmptyObservations(): SenseObservation[] {
  const senses: SenseType[] = ['SEE', 'HEAR', 'SMELL', 'FEEL'];
  return senses.map((sense) => ({ sense, descriptors: [] }));
}

/**
 * Generates one directed recording instruction from the bundle.
 * Priority: HEAR > SEE > FEEL > SMELL > fallback.
 */
export function generateDirectedPrompt(bundle: SenseBundle): string {
  const bySense = new Map<SenseType, SenseObservation>();
  for (const obs of bundle.observations) bySense.set(obs.sense, obs);

  const hear = bySense.get('HEAR');
  if (hear && (hear.descriptors.length > 0 || hear.freeText)) {
    return 'Record 10 seconds while the noise is happening — keep the phone near where it\u2019s loudest.';
  }

  const see = bySense.get('SEE');
  if (see && (see.descriptors.length > 0 || see.freeText)) {
    const target = see.descriptors[0] ?? 'the issue';
    return `Point the camera at the ${target} and hold steady for 10 seconds.`;
  }

  const feel = bySense.get('FEEL');
  if (feel && (feel.descriptors.length > 0 || feel.freeText)) {
    return 'Mount the phone on the dash and record 10 seconds at the speed where you feel it. Only record while driving safely.';
  }

  const smell = bySense.get('SMELL');
  if (smell && (smell.descriptors.length > 0 || smell.freeText)) {
    return 'Record 10 seconds where the smell is strongest. If under the hood, make sure the engine is off and cool first.';
  }

  return 'Record 10 seconds of the issue — keep the phone steady and capture any sound.';
}

export function getCoveredSenses(bundle: SenseBundle): SenseType[] {
  return bundle.observations
    .filter((o) => o.descriptors.length > 0 || (o.freeText && o.freeText.trim().length > 0))
    .map((o) => o.sense);
}

export function isBundleEmpty(bundle: SenseBundle): boolean {
  return getCoveredSenses(bundle).length === 0;
}
/**
 * Directed recording instruction for the video-first primer flow, keyed to the single
 * sense the driver picked first. FEEL/SMELL are used for the optional-video step and
 * are framed for parked-only recording.
 */
export function generatePrimerPrompt(primer: SenseType): string {
  switch (primer) {
    case 'HEAR':
      return "Hold the phone near where the noise is loudest and record about 10 seconds while the sound is happening.";
    case 'SEE':
      return "Point the camera at what you see and hold steady for about 10 seconds.";
    case 'FEEL':
      return "Only record while parked, or mount the phone on the dash before you start driving — never hold your phone while driving. If you can record safely, capture about 10 seconds.";
    case 'SMELL':
      return "Want to show us anything — a leak, smoke, or a warning light? Point the camera at it and hold steady for about 10 seconds.";
    default: {
      const exhaustiveCheck: never = primer;
      return exhaustiveCheck;
    }
  }
}
