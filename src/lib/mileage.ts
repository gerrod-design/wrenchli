// Batch 5 (R-50/R-57, spec v1.1 SS1-SS3/SS7): pure derivation rules for the
// append-only mileage readings ledger. Every consumer of vehicle mileage
// reads through these functions — never a stored bare attribute, never a
// raw extrapolation. Drafted via the Claude build lane; reviewed and
// materialized by the coordinator.

export type MileageUnit = 'mi' | 'km';
export type MileageSource = 'owner_reported' | 'dashboard_photo' | 'shop_document' | 'purchase_document';
export type ReadingLayer = 'reported' | 'observed';
export type ReadingStatus = 'current' | 'superseded' | 'disputed';

export interface MileageReading {
  id: string;
  vehicle_id: string;
  owner_user_id: string;
  odometer_value: number;
  unit: MileageUnit;
  odometer_miles: number;
  reading_date: string;
  source: MileageSource;
  source_detail: string | null;
  layer: ReadingLayer;
  status: ReadingStatus;
  superseded_by: string | null;
  unsupported: boolean;
  outlier_confirmed: boolean;
  evidence_media: unknown[];
  created_at: string;
}

export interface ReadingDisputeFact {
  id: string;
  vehicle_id: string;
  reading_id: string | null;
  kind: 'dispute' | 'dispute_dismissal' | 'discrepancy_dismissal';
  raised_by: string;
  reason: string;
  created_at: string;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function toMiles(value: number, unit: MileageUnit): number {
  if (unit === 'km') {
    return roundTo(value * 0.621371192, 2);
  }
  return value;
}

export function fromMiles(miles: number, unit: MileageUnit): number {
  if (unit === 'km') {
    return Math.round(miles / 0.621371192);
  }
  return Math.round(miles);
}

export function eligibleReadings(readings: MileageReading[]): MileageReading[] {
  return readings.filter((r) => r.status === 'current');
}

function dateOnlyToUTC(dateStr: string): number {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return Date.UTC(year, month - 1, day);
}

function createdAtToTime(createdAt: string): number {
  return new Date(createdAt).getTime();
}

export function deriveLatestReading(readings: MileageReading[]): MileageReading | null {
  const elig = eligibleReadings(readings);
  if (elig.length === 0) return null;

  let best: MileageReading | null = null;
  for (const r of elig) {
    if (best === null) {
      best = r;
      continue;
    }
    const rDate = dateOnlyToUTC(r.reading_date);
    const bDate = dateOnlyToUTC(best.reading_date);
    if (rDate > bDate) {
      best = r;
      continue;
    }
    if (rDate < bDate) {
      continue;
    }
    // tie on date -> observed layer wins
    if (r.layer === 'observed' && best.layer !== 'observed') {
      best = r;
      continue;
    }
    if (r.layer !== 'observed' && best.layer === 'observed') {
      continue;
    }
    // further tie -> greatest created_at
    const rCreated = createdAtToTime(r.created_at);
    const bCreated = createdAtToTime(best.created_at);
    if (rCreated > bCreated) {
      best = r;
    }
  }
  return best;
}

export const SOURCE_LABELS: Record<MileageSource, string> = {
  owner_reported: 'your report',
  dashboard_photo: 'dashboard photo',
  shop_document: 'shop document',
  purchase_document: 'purchase document',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatReadingDate(dateStr: string): string {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function formatThousands(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatReadingLabel(reading: MileageReading, displayUnit: MileageUnit): string {
  const converted = fromMiles(reading.odometer_miles, displayUnit);
  const valueStr = formatThousands(converted);
  const dateStr = formatReadingDate(reading.reading_date);
  const sourcePart =
    reading.source_detail !== null && reading.source_detail.trim() !== ''
      ? reading.source_detail
      : SOURCE_LABELS[reading.source];
  return `${valueStr} ${displayUnit} — ${dateStr}, ${sourcePart}`;
}

export const ESTIMATE_MAX_AGE_MONTHS = 18;

export type EstimateResult =
  | { kind: 'no_rate' }
  | { kind: 'too_old' }
  | { kind: 'estimate'; miles: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.4375;

export function estimateCurrentMiles(
  reading: MileageReading,
  annualMilesPerYear: number | null,
  now: Date
): EstimateResult {
  if (annualMilesPerYear === null) {
    return { kind: 'no_rate' };
  }

  const parts = reading.reading_date.split('-').map((p) => parseInt(p, 10));
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const readingUTCNoon = Date.UTC(year, month - 1, day, 12, 0, 0, 0);

  const nowTime = now.getTime();
  const diffMs = nowTime - readingUTCNoon;
  const ageMonths = Math.max(0, diffMs / MS_PER_DAY / DAYS_PER_MONTH);

  if (ageMonths > ESTIMATE_MAX_AGE_MONTHS) {
    return { kind: 'too_old' };
  }

  const miles = Math.round(
    reading.odometer_miles + (annualMilesPerYear * ageMonths) / 12
  );

  return { kind: 'estimate', miles };
}

export interface ReadingGateCandidate {
  odometer_miles: number;
  reading_date: string;
}

export type ReadingGateResult =
  | { kind: 'decrease'; predecessor?: MileageReading; successor?: MileageReading }
  | { kind: 'outlier'; milesPerDay: number; neighbor: MileageReading }
  | { kind: 'ok' };

export function evaluateReadingGate(
  readings: MileageReading[],
  candidate: ReadingGateCandidate
): ReadingGateResult {
  const elig = eligibleReadings(readings);
  const candDate = dateOnlyToUTC(candidate.reading_date);

  let predecessor: MileageReading | undefined;
  for (const r of elig) {
    const rDate = dateOnlyToUTC(r.reading_date);
    if (rDate <= candDate) {
      if (!predecessor) {
        predecessor = r;
      } else {
        const pDate = dateOnlyToUTC(predecessor.reading_date);
        if (rDate > pDate) {
          predecessor = r;
        } else if (rDate === pDate && r.odometer_miles > predecessor.odometer_miles) {
          predecessor = r;
        }
      }
    }
  }

  let successor: MileageReading | undefined;
  for (const r of elig) {
    const rDate = dateOnlyToUTC(r.reading_date);
    if (rDate > candDate) {
      if (!successor) {
        successor = r;
      } else {
        const sDate = dateOnlyToUTC(successor.reading_date);
        if (rDate < sDate) {
          successor = r;
        } else if (rDate === sDate && r.odometer_miles < successor.odometer_miles) {
          successor = r;
        }
      }
    }
  }

  if (predecessor && candidate.odometer_miles < predecessor.odometer_miles) {
    const result: { kind: 'decrease'; predecessor?: MileageReading; successor?: MileageReading } = {
      kind: 'decrease',
    };
    if (predecessor) result.predecessor = predecessor;
    if (successor) result.successor = successor;
    return result;
  }
  if (successor && candidate.odometer_miles > successor.odometer_miles) {
    const result: { kind: 'decrease'; predecessor?: MileageReading; successor?: MileageReading } = {
      kind: 'decrease',
    };
    if (predecessor) result.predecessor = predecessor;
    if (successor) result.successor = successor;
    return result;
  }

  const neighbors: MileageReading[] = [];
  if (predecessor) neighbors.push(predecessor);
  if (successor) neighbors.push(successor);

  for (const neighbor of neighbors) {
    const nDate = dateOnlyToUTC(neighbor.reading_date);
    let days = Math.abs(candDate - nDate) / MS_PER_DAY;
    const diff = Math.abs(candidate.odometer_miles - neighbor.odometer_miles);
    if (days === 0 && diff !== 0) {
      days = 1;
    }
    const milesPerDay = days === 0 ? 0 : diff / days;
    if (milesPerDay > 1000 || (diff > 25000 && days <= 90)) {
      return { kind: 'outlier', milesPerDay, neighbor };
    }
  }

  return { kind: 'ok' };
}

export interface DiscrepancyResult {
  observed: MileageReading;
  reported: MileageReading;
}

function latestByLayer(elig: MileageReading[], layer: ReadingLayer): MileageReading | null {
  const filtered = elig.filter((r) => r.layer === layer);
  if (filtered.length === 0) return null;

  let best: MileageReading | null = null;
  for (const r of filtered) {
    if (best === null) {
      best = r;
      continue;
    }
    const rDate = dateOnlyToUTC(r.reading_date);
    const bDate = dateOnlyToUTC(best.reading_date);
    if (rDate > bDate) {
      best = r;
      continue;
    }
    if (rDate < bDate) {
      continue;
    }
    const rCreated = createdAtToTime(r.created_at);
    const bCreated = createdAtToTime(best.created_at);
    if (rCreated > bCreated) {
      best = r;
    }
  }
  return best;
}

export function deriveDiscrepancy(
  readings: MileageReading[],
  facts: ReadingDisputeFact[]
): DiscrepancyResult | null {
  const elig = eligibleReadings(readings);
  const observed = latestByLayer(elig, 'observed');
  const reported = latestByLayer(elig, 'reported');

  if (observed === null || reported === null) {
    return null;
  }

  const obsDate = dateOnlyToUTC(observed.reading_date);
  const repDate = dateOnlyToUTC(reported.reading_date);
  const obsCreated = createdAtToTime(observed.created_at);
  const repCreated = createdAtToTime(reported.created_at);

  let later: MileageReading;
  let earlier: MileageReading;

  if (obsDate > repDate) {
    later = observed;
    earlier = reported;
  } else if (repDate > obsDate) {
    later = reported;
    earlier = observed;
  } else {
    if (obsCreated >= repCreated) {
      later = observed;
      earlier = reported;
    } else {
      later = reported;
      earlier = observed;
    }
  }

  if (!(later.odometer_miles < earlier.odometer_miles)) {
    return null;
  }

  const laterDate = dateOnlyToUTC(later.reading_date);
  const maxMiles = Math.max(observed.odometer_miles, reported.odometer_miles);

  const exceptionA = elig.some((r) => {
    const rDate = dateOnlyToUTC(r.reading_date);
    return rDate > laterDate && r.odometer_miles >= maxMiles;
  });

  if (exceptionA) {
    return null;
  }

  const laterCreated = Math.max(obsCreated, repCreated);
  const exceptionB = facts.some((f) => {
    if (f.kind !== 'discrepancy_dismissal') return false;
    const fCreated = createdAtToTime(f.created_at);
    return fCreated > laterCreated;
  });

  if (exceptionB) {
    return null;
  }

  return { observed, reported };
}

export function readingStatusLabel(reading: MileageReading): string | null {
  if (reading.unsupported) {
    return 'Unsupported — no source';
  }
  if (reading.status === 'disputed') {
    return 'Disputed';
  }
  if (reading.status === 'superseded') {
    return 'Superseded';
  }
  if (reading.outlier_confirmed) {
    return 'Owner-confirmed outlier';
  }
  return null;
}
