// Proactive Events Phase 1 — THE single home of every proactive message
// string (spec: wrenchli-proactive-event-list-spec-2026-10-26.md).
//
// The gate sweeps this module. Rules for every string here and every string
// these builders can produce:
// - Aiden is the only voice. No other persona names.
// - The word "diagnose" in any form NEVER appears. Wrenchli gives a
//   preliminary assessment; shops do the hands-on work.
// - No promise of continuous recall monitoring: E3/E8 state only what a
//   check actually found.
// - No implication that shops are being matched, are waiting, or can be
//   booked. Shop matching is paused.
// - No city names, no coverage claims.
// - Mileage figures come only from sourced readings on the record; these
//   builders never invent a number — callers pass only sourced values.

export const DISMISS_LABEL = "Stop messages like this";
export const CARD_SPEAKER = "Aiden";

// ---------------------------------------------------------------------------
// formatting helpers (deterministic, locale-fixed for testability)
// ---------------------------------------------------------------------------

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatWeekday(iso: string): string {
  const d = new Date(iso);
  return WEEKDAYS[d.getUTCDay()];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatMiles(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatRange(low: number, high: number): string {
  return `$${formatMiles(low)}–$${formatMiles(high)}`;
}

// ---------------------------------------------------------------------------
// payload shapes (produced by the event evaluators / the checker)
// ---------------------------------------------------------------------------

export interface E1Payload { vehicleName: string; completedAt: string; likelyCause: string; safety: boolean }
export interface E2Payload { vehicleName: string; kind: "repair_completed" | "package_created"; description?: string; hasFinalCost: boolean }
export interface E3Payload { vehicleName: string; campaignCount: number; firstCampaignTitle: string }
export interface E4Payload { vehicleName: string; item: string; costLow: number; costHigh: number }
export interface E5SeasonalPayload { vehicleName: string; season: "fall" | "spring"; lastCheckedAt: string | null }
export interface E5MileagePayload { vehicleName: string; serviceLabel: string; readingMiles: number; readingDate: string; overdue: boolean }
export interface E6Payload { vehicleName: string | null }
export interface E7Payload { vehicleName: string; repairLabel: string }
export interface E8Payload { vehicleName: string }
export interface E9Payload { vehicleName: string; lastReadingMiles: number | null; lastReadingDate: string | null }

export type ProactivePayload =
  | E1Payload | E2Payload | E3Payload | E4Payload | E5SeasonalPayload
  | E5MileagePayload | E6Payload | E7Payload | E8Payload | E9Payload;

// ---------------------------------------------------------------------------
// message builders — one per event (E5 has two sub-types)
// ---------------------------------------------------------------------------

export function e1Message(p: E1Payload): string {
  const day = formatWeekday(p.completedAt);
  if (p.safety) {
    return `Your preliminary assessment for the ${p.vehicleName} from ${day} pointed to ${p.likelyCause}, and it came back as a Shop Required item, so it should not sit. You haven't picked a next step yet. Want me to lay out your options: what can wait, what can't, and what fair looks like?`;
  }
  return `Your preliminary assessment for the ${p.vehicleName} from ${day} pointed to ${p.likelyCause}. You haven't picked a next step yet. Want me to lay out your options: what can wait, what can't, and what fair looks like?`;
}

export function e2Message(p: E2Payload): string {
  if (p.kind === "package_created") {
    return `Update on the ${p.vehicleName}: a shareable package from your assessment is saved on the car's record.`;
  }
  return p.hasFinalCost
    ? `Update on the ${p.vehicleName}: your repair is now marked complete and the final cost is on the record.`
    : `Update on the ${p.vehicleName}: your repair is now marked complete.`;
}

export function e3Message(p: E3Payload): string {
  if (p.campaignCount > 1) {
    return `${p.campaignCount} new recalls were issued for your ${p.vehicleName}, including ${p.firstCampaignTitle}. These are manufacturer repairs, done free at a dealer. The details are on the car's record in your Garage.`;
  }
  return `A new recall was issued for your ${p.vehicleName}: ${p.firstCampaignTitle}. This is a manufacturer repair, done free at a dealer. The details are on the car's record in your Garage.`;
}

export function e4Message(p: E4Payload): string {
  return `You looked at an estimate for ${p.item} on the ${p.vehicleName} last week: ${formatRange(p.costLow, p.costHigh)}. Prices move, so treat that number as a snapshot. Want a fresh look, or help deciding what to do with it?`;
}

export function e5SeasonalMessage(p: E5SeasonalPayload): string {
  if (p.season === "fall") {
    const checked = p.lastCheckedAt
      ? `Your ${p.vehicleName}'s battery was last checked on ${formatDate(p.lastCheckedAt)}.`
      : `Your ${p.vehicleName} has no battery check on its record.`;
    return `Fall is when weak batteries quit. ${checked} Here is what to watch for.`;
  }
  const checked = p.lastCheckedAt
    ? `Your ${p.vehicleName}'s air conditioning was last serviced on ${formatDate(p.lastCheckedAt)}.`
    : `Your ${p.vehicleName} has no air conditioning service on its record.`;
  return `Warm weather is when a tired air conditioner shows itself. ${checked} Here is what to watch for.`;
}

export function e5MileageMessage(p: E5MileagePayload): string {
  const due = p.overdue ? "is past due for" : "is around due for";
  return `Based on the reading on record (${formatMiles(p.readingMiles)} miles, ${formatDate(p.readingDate)}), the ${p.vehicleName} ${due} ${p.serviceLabel}. This is a maintenance reminder, not a problem found.`;
}

export function e6Message(p: E6Payload): string {
  if (p.vehicleName) {
    return `You started telling me about the ${p.vehicleName} yesterday and we didn't finish. Pick up where you left off? What you already entered is saved.`;
  }
  return `You started an assessment yesterday and we didn't finish. Pick up where you left off? What you already entered is saved.`;
}

export function e7Message(p: E7Payload): string {
  return `Ten days since the ${p.repairLabel} on the ${p.vehicleName} was marked done. How is it holding up: fixed, partly, or is the problem back? Your answer goes on the car's record.`;
}

export function e8Message(p: E8Payload): string {
  return `Recall status for the ${p.vehicleName} is now confirmed: no open recalls found.`;
}

export function e9Message(p: E9Payload): string {
  if (p.lastReadingMiles != null && p.lastReadingDate) {
    return `I don't have a current mileage for the ${p.vehicleName} (last reading ${formatMiles(p.lastReadingMiles)} miles, ${formatDate(p.lastReadingDate)}). A fresh odometer photo keeps its service reminders and record accurate.`;
  }
  return `I don't have a mileage reading for the ${p.vehicleName} yet. A fresh odometer photo keeps its service reminders and record accurate.`;
}

export function messageFor(eventType: string, payload: Record<string, unknown>): string {
  switch (eventType) {
    case "E1": return e1Message(payload as unknown as E1Payload);
    case "E2": return e2Message(payload as unknown as E2Payload);
    case "E3": return e3Message(payload as unknown as E3Payload);
    case "E4": return e4Message(payload as unknown as E4Payload);
    case "E5": return (payload as { subType?: string }).subType === "mileage"
      ? e5MileageMessage(payload as unknown as E5MileagePayload)
      : e5SeasonalMessage(payload as unknown as E5SeasonalPayload);
    case "E6": return e6Message(payload as unknown as E6Payload);
    case "E7": return e7Message(payload as unknown as E7Payload);
    case "E8": return e8Message(payload as unknown as E8Payload);
    case "E9": return e9Message(payload as unknown as E9Payload);
    default: return "";
  }
}

// ---------------------------------------------------------------------------
// reason lines — the "why you're seeing this" line every message carries
// ---------------------------------------------------------------------------

export function reasonFor(eventType: string, payload: Record<string, unknown>): string {
  const v = (payload as { vehicleName?: string }).vehicleName ?? "your vehicle";
  switch (eventType) {
    case "E1": {
      const p = payload as unknown as E1Payload;
      return p.safety
        ? `Because your assessment from ${formatWeekday(p.completedAt)} flagged a safety item, and it still has no next step.`
        : `Because your assessment from ${formatWeekday(p.completedAt)} has no next step yet.`;
    }
    case "E2": return `Because the repair record for your ${v} changed.`;
    case "E3": return `Because a recall check on your ${v} found something new.`;
    case "E4": return `Because you looked at this estimate a week ago and it is still open.`;
    case "E5": return (payload as { subType?: string }).subType === "mileage"
      ? `Because the mileage on record for your ${v} says a service is coming due.`
      : `Because the season is a good time to check this on your ${v}.`;
    case "E6": return `Because you started an assessment and did not finish it.`;
    case "E7": return `Because a repair on your ${v} was marked done ten days ago.`;
    case "E8": return `Because the recall status for your ${v} could not be confirmed before, and now it can.`;
    case "E9": return `Because the mileage on record for your ${v} is out of date.`;
    default: return "";
  }
}

// ---------------------------------------------------------------------------
// primary action labels (exactly one action per message)
// ---------------------------------------------------------------------------

export function actionLabelFor(eventType: string, payload: Record<string, unknown>): string {
  switch (eventType) {
    case "E1": return "Lay out my options";
    case "E2": return "See the update";
    case "E3": return "See the recall details";
    case "E4": return "Take a fresh look";
    case "E5": return (payload as { subType?: string }).subType === "mileage" ? "See the reminder" : "See what to watch for";
    case "E6": return "Pick up where I left off";
    case "E7": return "Answer on the car's record";
    case "E8": return "See the recall status";
    case "E9": return "Add a mileage reading";
    default: return "Open";
  }
}

// ---------------------------------------------------------------------------
// settings copy (the proactive section of Notification Settings)
// ---------------------------------------------------------------------------

export const SETTINGS_TITLE = "Messages from Aiden";
export const SETTINGS_DESCRIPTION =
  "Aiden can speak first when something in your own records needs attention. You choose which kinds. Every message says why you are seeing it, and you can stop any kind at any time.";

export const MASTER_LABEL = "Let Aiden speak first";
export const MASTER_DESCRIPTION =
  "Off stops every proactive message. Aiden still answers whenever you ask.";

export const CATEGORY_COPY: Record<string, { label: string; description: string }> = {
  assessment_followups: {
    label: "Assessment follow-ups",
    description: "When an assessment has no next step yet, an estimate sits open, or an assessment was left unfinished.",
  },
  repair_updates: {
    label: "Repair updates",
    description: "When a repair record for one of your vehicles changes.",
  },
  post_repair_checkins: {
    label: "Post-repair check-ins",
    description: "A short check-in about ten days after a repair is marked done, asking whether the fix held.",
  },
  service_prompts: {
    label: "Service reminders and mileage",
    description: "Seasonal checks, services coming due from the mileage on record, and a nudge when a mileage reading goes stale.",
  },
};

export const RECALL_TOGGLE_LABEL = "Recall alerts";
export const RECALL_TOGGLE_DESCRIPTION =
  "When a recall check finds a new recall for one of your vehicles, or confirms a status that was unavailable before.";
export const RECALL_SAFETY_WARNING =
  "Turning this off means Aiden will not tell you when a new recall is found for a vehicle in your Garage. Recalls are safety repairs the manufacturer pays for. You can turn this back on at any time.";
