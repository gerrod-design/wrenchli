// Proactive Events Phase 1 — pure event evaluators.
//
// Each function takes plain record shapes (exactly what the
// check-proactive-events edge function fetches, and what tests fabricate),
// the set of queue keys that already exist, and `now`, and returns the queue
// candidate to insert — or null when the event must not fire. The edge
// function mirrors these predicates query-for-query; this module is the
// tested reference implementation. Fire-once is enforced twice: here, by
// the existing-keys check, and in the database, by the unique index on
// (user_id, event_type, source_key).

export type ProactiveCategory =
  | "assessment_followups"
  | "repair_updates"
  | "post_repair_checkins"
  | "service_prompts"
  | "recalls";

export type EventType = "E1" | "E2" | "E3" | "E4" | "E5" | "E6" | "E7" | "E8" | "E9";

export interface QueueCandidate {
  userId: string;
  eventType: EventType;
  category: ProactiveCategory;
  sourceTable: string;
  sourceId: string;
  sourceKey: string;
  vehicleId: string | null;
  payload: Record<string, unknown>;
  eligibleAt: string;
  /** 'suppressed' rows are internal bookkeeping markers, never delivered. */
  initialState?: "pending" | "suppressed";
}

export interface ExistingRow {
  eventType: string;
  sourceKey: string;
  state: string;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function keyOf(eventType: string, sourceKey: string): string {
  return `${eventType}:${sourceKey}`;
}

function has(existing: Set<string>, eventType: string, sourceKey: string): boolean {
  return existing.has(keyOf(eventType, sourceKey));
}

export function existingKeySet(rows: ExistingRow[]): Set<string> {
  return new Set(rows.map((r) => keyOf(r.eventType, r.sourceKey)));
}

function ageMs(now: Date, iso: string): number {
  return now.getTime() - new Date(iso).getTime();
}

// ---------------------------------------------------------------------------
// E1 / E6 — assessment follow-through and abandonment (diagnostic_sessions)
// ---------------------------------------------------------------------------

export interface AssessmentRecord {
  sessionId: string;
  userId: string;
  status: "intake" | "diagnosing" | "complete" | "abandoned" | "outcome_reported";
  createdAt: string;
  updatedAt: string;
  /** Display name from the wizard vehicle row; null when none is linked. */
  vehicleName: string | null;
  /** diagnoses.created_at for a completed assessment. */
  completedAt: string | null;
  /** diagnoses.urgency; 'immediate' is the safety tier. */
  urgency: string | null;
  /** Top possible cause, stated as the assessment stated it. */
  likelyCause: string | null;
  /** Any recorded next step: handoff created, outcome reported, repair
   *  recorded against the session, or a journey plan started from it. */
  actedOn: boolean;
}

export function evaluateE1(
  rec: AssessmentRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  if (rec.status !== "complete" || !rec.completedAt || !rec.likelyCause || !rec.vehicleName) {
    return null;
  }
  if (rec.actedOn) return null;
  const age = ageMs(now, rec.completedAt);
  const safety = rec.urgency === "immediate";
  const base = {
    userId: rec.userId,
    eventType: "E1" as const,
    category: "assessment_followups" as const,
    sourceTable: "diagnostic_sessions",
    sourceId: rec.sessionId,
    vehicleId: null,
    payload: {
      vehicleName: rec.vehicleName,
      completedAt: rec.completedAt,
      likelyCause: rec.likelyCause,
      safety,
    },
  };
  if (safety) {
    const firstKey = `session:${rec.sessionId}:safety`;
    if (!has(existing, "E1", firstKey)) {
      if (age < 24 * HOUR) return null;
      return { ...base, sourceKey: firstKey, eligibleAt: new Date(new Date(rec.completedAt).getTime() + 24 * HOUR).toISOString() };
    }
    // The one allowed re-fire: the first safety touch exists (shown or
    // dismissed), the record is still untouched, and 72 hours have passed.
    const refireKey = `session:${rec.sessionId}:safety:refire`;
    if (has(existing, "E1", refireKey)) return null;
    if (age < 72 * HOUR) return null;
    return { ...base, sourceKey: refireKey, eligibleAt: new Date(new Date(rec.completedAt).getTime() + 72 * HOUR).toISOString() };
  }
  const sourceKey = `session:${rec.sessionId}`;
  if (has(existing, "E1", sourceKey)) return null;
  if (age < 48 * HOUR) return null;
  return { ...base, sourceKey, eligibleAt: new Date(new Date(rec.completedAt).getTime() + 48 * HOUR).toISOString() };
}

export function evaluateE6(
  rec: AssessmentRecord & { hasContent: boolean },
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  if (rec.status !== "intake" && rec.status !== "diagnosing" && rec.status !== "abandoned") {
    return null;
  }
  // A bare session row with nothing entered is not a conversation to resume.
  if (!rec.hasContent && rec.status !== "abandoned") return null;
  if (rec.actedOn) return null;
  if (ageMs(now, rec.updatedAt) < 24 * HOUR) return null;
  const sourceKey = `session:${rec.sessionId}`;
  if (has(existing, "E6", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E6",
    category: "assessment_followups",
    sourceTable: "diagnostic_sessions",
    sourceId: rec.sessionId,
    sourceKey,
    vehicleId: null,
    payload: { vehicleName: rec.vehicleName },
    eligibleAt: new Date(new Date(rec.updatedAt).getTime() + 24 * HOUR).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// E4 — estimate viewed, not acted on (the estimate = the top possible cause
// shown with the completed assessment; see the report for the view proxy)
// ---------------------------------------------------------------------------

export interface EstimateRecord {
  sessionId: string;
  diagnosisId: string;
  userId: string;
  vehicleName: string | null;
  item: string;
  costLow: number;
  costHigh: number;
  viewedAt: string;
  actedOn: boolean;
}

export function evaluateE4(
  rec: EstimateRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  if (!rec.vehicleName) return null;
  if (rec.actedOn) return null;
  if (ageMs(now, rec.viewedAt) < 7 * DAY) return null;
  const sourceKey = `diagnosis:${rec.diagnosisId}`;
  if (has(existing, "E4", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E4",
    category: "assessment_followups",
    sourceTable: "diagnoses",
    sourceId: rec.diagnosisId,
    sourceKey,
    vehicleId: null,
    payload: {
      vehicleName: rec.vehicleName,
      item: rec.item,
      costLow: rec.costLow,
      costHigh: rec.costHigh,
    },
    eligibleAt: new Date(new Date(rec.viewedAt).getTime() + 7 * DAY).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// E2 — repair status changed (Garage records and handoff records)
// ---------------------------------------------------------------------------

export interface RepairChangeRecord {
  userId: string;
  /** user_vehicles id when the record is tied to a Garage vehicle. */
  vehicleId: string | null;
  vehicleName: string;
  kind: "repair_completed" | "package_created";
  recordTable: string;
  recordId: string;
  occurredAt: string;
  hasFinalCost: boolean;
}

export function evaluateE2(
  rec: RepairChangeRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  // Only fresh changes are news; older records are history, not a status
  // change, and must not flood the queue on the checker's first runs.
  if (ageMs(now, rec.occurredAt) > 14 * DAY) return null;
  if (ageMs(now, rec.occurredAt) < 0) return null;
  // Repair completions batch within the hour per vehicle (spec E2).
  const sourceKey = rec.kind === "repair_completed"
    ? `veh:${rec.vehicleId ?? "none"}:repair:${rec.occurredAt.slice(0, 13)}`
    : `handoff:${rec.recordId}`;
  if (has(existing, "E2", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E2",
    category: "repair_updates",
    sourceTable: rec.recordTable,
    sourceId: rec.recordId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: { vehicleName: rec.vehicleName, kind: rec.kind, hasFinalCost: rec.hasFinalCost },
    eligibleAt: rec.occurredAt,
  };
}

// ---------------------------------------------------------------------------
// E7 — post-repair check-in
// ---------------------------------------------------------------------------

export interface CompletedRepairRecord {
  userId: string;
  vehicleId: string | null;
  vehicleName: string;
  recordTable: "maintenance_records" | "repair_history";
  recordId: string;
  repairLabel: string;
  completedDate: string;
  /** The owner already reported the outcome for this repair. */
  outcomeAlreadyReported: boolean;
}

export function evaluateE7(
  rec: CompletedRepairRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  if (rec.outcomeAlreadyReported) return null;
  const age = ageMs(now, rec.completedDate);
  if (age < 10 * DAY) return null;
  // Do not reach back indefinitely: a completion older than 60 days is a
  // record, not a check-in moment.
  if (age > 60 * DAY) return null;
  const sourceKey = `repair:${rec.recordTable}:${rec.recordId}`;
  if (has(existing, "E7", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E7",
    category: "post_repair_checkins",
    sourceTable: rec.recordTable,
    sourceId: rec.recordId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: { vehicleName: rec.vehicleName, repairLabel: rec.repairLabel },
    eligibleAt: new Date(new Date(rec.completedDate).getTime() + 10 * DAY).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// E3 — new recall found (recall_alerts), batched per vehicle per check day
// ---------------------------------------------------------------------------

export interface RecallCampaign {
  campaignNumber: string;
  title: string;
  foundAt: string;
}

export interface RecallFinding {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  campaigns: RecallCampaign[];
}

export function evaluateE3(
  finding: RecallFinding,
  existing: Set<string>,
): QueueCandidate[] {
  // Group the campaigns a single check produced (same calendar day, UTC)
  // into one message, per the spec's batching rule.
  const byDay = new Map<string, RecallCampaign[]>();
  for (const c of finding.campaigns) {
    const day = c.foundAt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(c);
  }
  const out: QueueCandidate[] = [];
  for (const [, campaigns] of byDay) {
    const numbers = campaigns.map((c) => c.campaignNumber).sort();
    const sourceKey = `veh:${finding.vehicleId}:campaigns:${numbers.join(".")}`;
    if (has(existing, "E3", sourceKey)) continue;
    const sorted = [...campaigns].sort((a, b) => a.foundAt.localeCompare(b.foundAt));
    out.push({
      userId: finding.userId,
      eventType: "E3",
      category: "recalls",
      sourceTable: "recall_alerts",
      sourceId: finding.vehicleId,
      sourceKey,
      vehicleId: finding.vehicleId,
      payload: {
        vehicleName: finding.vehicleName,
        campaignCount: campaigns.length,
        firstCampaignTitle: sorted[0].title,
      },
      eligibleAt: sorted[sorted.length - 1].foundAt,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// E8 — recall status corrected after being unavailable (vehicle_recall_checks)
// The table holds only the latest check per vehicle, so the checker first
// records a suppressed marker row when it observes a failed check; the
// correction can only be claimed once that marker exists.
// ---------------------------------------------------------------------------

export interface RecallCheckState {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  status: "ok" | "failed";
  checkedAt: string;
  campaignsFound: number | null;
}

export function evaluateE8Marker(rec: RecallCheckState): QueueCandidate | null {
  if (rec.status !== "failed") return null;
  return {
    userId: rec.userId,
    eventType: "E8",
    category: "recalls",
    sourceTable: "vehicle_recall_checks",
    sourceId: rec.vehicleId,
    sourceKey: `veh:${rec.vehicleId}:failed-observed`,
    vehicleId: rec.vehicleId,
    payload: { vehicleName: rec.vehicleName },
    eligibleAt: rec.checkedAt,
    initialState: "suppressed",
  };
}

export function evaluateE8(
  rec: RecallCheckState,
  existing: Set<string>,
): QueueCandidate | null {
  if (rec.status !== "ok") return null;
  if ((rec.campaignsFound ?? 0) > 0) return null; // campaigns hand off to E3
  if (!has(existing, "E8", `veh:${rec.vehicleId}:failed-observed`)) return null;
  const sourceKey = `veh:${rec.vehicleId}:corrected:${rec.checkedAt.slice(0, 10)}`;
  if (has(existing, "E8", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E8",
    category: "recalls",
    sourceTable: "vehicle_recall_checks",
    sourceId: rec.vehicleId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: { vehicleName: rec.vehicleName },
    eligibleAt: rec.checkedAt,
  };
}

// ---------------------------------------------------------------------------
// E5 — seasonal prompts and mileage-based service prompts
// ---------------------------------------------------------------------------

export function seasonForDate(now: Date): { season: "fall" | "spring"; year: number } | null {
  const y = now.getUTCFullYear();
  const fallStart = Date.UTC(y, 8, 15);
  const fallEnd = Date.UTC(y, 10, 30, 23, 59, 59);
  const springStart = Date.UTC(y, 3, 15);
  const springEnd = Date.UTC(y, 5, 15, 23, 59, 59);
  const t = now.getTime();
  if (t >= fallStart && t <= fallEnd) return { season: "fall", year: y };
  if (t >= springStart && t <= springEnd) return { season: "spring", year: y };
  return null;
}

export interface SeasonalRecord {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  /** Latest sourced battery-check date (fall) — null when none on record. */
  batteryLastCheckedAt: string | null;
  /** Latest sourced A/C service date (spring) — null when none on record. */
  acLastCheckedAt: string | null;
}

export function evaluateE5Seasonal(
  rec: SeasonalRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  const s = seasonForDate(now);
  if (!s) return null;
  const sourceKey = `user:${rec.userId}:season:${s.season}:${s.year}`;
  if (has(existing, "E5", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E5",
    category: "service_prompts",
    sourceTable: "user_vehicles",
    sourceId: rec.vehicleId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: {
      subType: "seasonal",
      vehicleName: rec.vehicleName,
      season: s.season,
      lastCheckedAt: s.season === "fall" ? rec.batteryLastCheckedAt : rec.acLastCheckedAt,
    },
    eligibleAt: now.toISOString(),
  };
}

export interface MaintenanceDueRecord {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  alertId: string;
  serviceLabel: string;
  /** Sourced reading the due-ness was computed from (never an estimate). */
  readingMiles: number;
  readingDate: string;
  overdue: boolean;
  alertCreatedAt: string;
  /** An E5 mileage message for this vehicle + service was dismissed < 90d ago. */
  dismissedWithin90d: boolean;
  /** A service record for this item exists after the alert was created. */
  serviceCompletedSince: boolean;
}

export function evaluateE5Mileage(
  rec: MaintenanceDueRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  if (rec.dismissedWithin90d) return null;
  if (rec.serviceCompletedSince) return null;
  // Only fresh alerts are prompts; stale ones are history.
  if (ageMs(now, rec.alertCreatedAt) > 7 * DAY) return null;
  const sourceKey = `malert:${rec.alertId}`;
  if (has(existing, "E5", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E5",
    category: "service_prompts",
    sourceTable: "maintenance_alerts",
    sourceId: rec.alertId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: {
      subType: "mileage",
      vehicleName: rec.vehicleName,
      serviceLabel: rec.serviceLabel,
      readingMiles: rec.readingMiles,
      readingDate: rec.readingDate,
      overdue: rec.overdue,
    },
    eligibleAt: rec.alertCreatedAt,
  };
}

// ---------------------------------------------------------------------------
// E9 — mileage reading gone stale (vehicle_mileage_readings / user_vehicles)
// ---------------------------------------------------------------------------

export interface MileageStalenessRecord {
  userId: string;
  vehicleId: string;
  vehicleName: string;
  latestReading: { miles: number; date: string } | null;
  vehicleCreatedAt: string;
}

export function evaluateE9(
  rec: MileageStalenessRecord,
  existing: Set<string>,
  now: Date,
): QueueCandidate | null {
  // One prompt per vehicle per 180-day bucket: the bucket in the key is
  // what lets the event honestly re-fire next period and never before.
  if (rec.latestReading) {
    if (ageMs(now, rec.latestReading.date) <= 180 * DAY) return null;
    const bucket = Math.floor(now.getTime() / (180 * DAY));
    const sourceKey = `veh:${rec.vehicleId}:stale:${bucket}`;
    if (has(existing, "E9", sourceKey)) return null;
    return {
      userId: rec.userId,
      eventType: "E9",
      category: "service_prompts",
      sourceTable: "vehicle_mileage_readings",
      sourceId: rec.vehicleId,
      sourceKey,
      vehicleId: rec.vehicleId,
      payload: {
        vehicleName: rec.vehicleName,
        lastReadingMiles: rec.latestReading.miles,
        lastReadingDate: rec.latestReading.date,
      },
      eligibleAt: now.toISOString(),
    };
  }
  if (ageMs(now, rec.vehicleCreatedAt) <= 30 * DAY) return null;
  const bucket = Math.floor(ageMs(now, rec.vehicleCreatedAt) / (180 * DAY));
  const sourceKey = `veh:${rec.vehicleId}:noreading:${bucket}`;
  if (has(existing, "E9", sourceKey)) return null;
  return {
    userId: rec.userId,
    eventType: "E9",
    category: "service_prompts",
    sourceTable: "user_vehicles",
    sourceId: rec.vehicleId,
    sourceKey,
    vehicleId: rec.vehicleId,
    payload: { vehicleName: rec.vehicleName, lastReadingMiles: null, lastReadingDate: null },
    eligibleAt: now.toISOString(),
  };
}
