// Proactive Events Phase 1 — the delivery gate (spec section 2).
//
// Pure function: given the user's pending queue rows, their shown history,
// their preferences, the set of records that have been acted on since the
// rows were queued, the current time, and the user's timezone, decide the
// ONE message that may be shown now (or none), which rows must be
// cancelled (acted-on records), and which must be expired (too old to be
// relevant). The hook persists those state changes; this module only
// decides, so every global rule is testable here.
//
// Rules implemented, in order:
// - pending rows older than 14 days expire.
// - rows whose record was acted on are cancelled ("kill switch").
// - master switch off -> nothing shows.
// - per-category opt-outs and the recall safety toggle are read from the
//   CURRENT preferences — opt-out at delivery time, not queue time.
// - quiet hours 21:00-08:00 in the user's local time -> nothing shows.
// - caps: at most 1 shown per rolling 48 hours and 3 per rolling 7 days.
//   An E3 recall (or an E2 repair-completion) may break the 48-hour cap
//   exactly once — if the message shown inside the current 48-hour window
//   was itself a cap-breaker, no second break is allowed. The weekly cap
//   has no exceptions, and cap-breakers still count toward it.
// - priority (spec section 2, with E8 seated in its recall family):
//   E3 > E8 > E2 > E1 safety > E1/E4/E6 > E7 > E5/E9.

import type { ProactiveCategory } from "./events";

export interface PendingMessage {
  id: string;
  eventType: string;
  category: ProactiveCategory;
  sourceKey: string;
  payload: Record<string, unknown>;
  eligibleAt: string;
  createdAt: string;
}

export interface ShownRecord {
  eventType: string;
  payload: Record<string, unknown>;
  shownAt: string;
}

export interface ProactivePrefs {
  masterEnabled: boolean;
  assessmentFollowups: boolean;
  repairUpdates: boolean;
  postRepairCheckins: boolean;
  servicePrompts: boolean;
  recallAlertsEnabled: boolean;
}

export const DEFAULT_PREFS: ProactivePrefs = {
  masterEnabled: true,
  assessmentFollowups: true,
  repairUpdates: true,
  postRepairCheckins: true,
  servicePrompts: true,
  recallAlertsEnabled: true,
};

export interface DeliveryInput {
  pending: PendingMessage[];
  shownHistory: ShownRecord[];
  prefs: ProactivePrefs;
  now: Date;
  timeZone: string;
  /** sourceKeys (event-namespaced matching is the caller's job: keys here
   *  are `${eventType}:${sourceKey}`) of records acted on since queueing. */
  actedKeys: Set<string>;
}

export interface DeliveryDecision {
  show: PendingMessage | null;
  cancelIds: string[];
  expireIds: string[];
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const PENDING_TTL = 14 * DAY;

export function localHour(now: Date, timeZone: string): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    }).format(now);
    const h = parseInt(s, 10);
    return Number.isNaN(h) ? now.getUTCHours() : h % 24;
  } catch {
    return now.getUTCHours();
  }
}

export function inQuietHours(now: Date, timeZone: string): boolean {
  const h = localHour(now, timeZone);
  return h >= 21 || h < 8;
}

export function categoryEnabled(prefs: ProactivePrefs, category: ProactiveCategory): boolean {
  switch (category) {
    case "recalls": return prefs.recallAlertsEnabled;
    case "assessment_followups": return prefs.assessmentFollowups;
    case "repair_updates": return prefs.repairUpdates;
    case "post_repair_checkins": return prefs.postRepairCheckins;
    case "service_prompts": return prefs.servicePrompts;
  }
}

export function priorityRank(m: { eventType: string; payload: Record<string, unknown> }): number {
  switch (m.eventType) {
    case "E3": return 0;
    case "E8": return 1;
    case "E2": return 2;
    case "E1": return m.payload.safety === true ? 3 : 4;
    case "E4": return 4;
    case "E6": return 4;
    case "E7": return 5;
    case "E5": return 6;
    case "E9": return 6;
    default: return 9;
  }
}

function isCapBreaker(m: { eventType: string; payload: Record<string, unknown> }): boolean {
  return m.eventType === "E3" || (m.eventType === "E2" && m.payload.kind === "repair_completed");
}

export function selectDelivery(input: DeliveryInput): DeliveryDecision {
  const { pending, shownHistory, prefs, now, timeZone, actedKeys } = input;
  const cancelIds: string[] = [];
  const expireIds: string[] = [];
  const survivors: PendingMessage[] = [];

  for (const row of pending) {
    if (now.getTime() - new Date(row.createdAt).getTime() > PENDING_TTL) {
      expireIds.push(row.id);
      continue;
    }
    if (actedKeys.has(`${row.eventType}:${row.sourceKey}`)) {
      cancelIds.push(row.id);
      continue;
    }
    survivors.push(row);
  }

  const none: DeliveryDecision = { show: null, cancelIds, expireIds };
  if (!prefs.masterEnabled) return none;

  const eligible = survivors.filter(
    (r) =>
      categoryEnabled(prefs, r.category) &&
      new Date(r.eligibleAt).getTime() <= now.getTime(),
  );
  if (eligible.length === 0) return none;
  if (inQuietHours(now, timeZone)) return none;

  const shown7d = shownHistory.filter(
    (s) => now.getTime() - new Date(s.shownAt).getTime() < 7 * DAY,
  );
  if (shown7d.length >= 3) return none;

  const shown48h = shownHistory.filter(
    (s) => now.getTime() - new Date(s.shownAt).getTime() < 48 * HOUR,
  );
  let candidates = eligible;
  if (shown48h.length >= 1) {
    // The 48-hour cap. One break is allowed, and only by a cap-breaker,
    // and only when the message inside the window was not itself a break.
    if (shown48h.some((s) => isCapBreaker(s))) return none;
    candidates = eligible.filter((r) => isCapBreaker(r));
    if (candidates.length === 0) return none;
  }

  const sorted = [...candidates].sort((a, b) => {
    const rank = priorityRank(a) - priorityRank(b);
    if (rank !== 0) return rank;
    const elig = new Date(a.eligibleAt).getTime() - new Date(b.eligibleAt).getTime();
    if (elig !== 0) return elig;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return { show: sorted[0], cancelIds, expireIds };
}
