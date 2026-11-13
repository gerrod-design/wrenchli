/**
 * Referral transport helpers (Mobility Brief 3 — Option A:
 * shop-arranged tow / flatbed pickup and delivery, 2026-11-13).
 *
 * The transport request lives on the referral package; the status
 * thread lives on each shop_referrals hop. Copy rules locked in the
 * brief: no generic tow prices anywhere (the only charge ever shown
 * is the addressed shop's own stated charge, labeled as the shop's),
 * and the owner-facing liability line is exactly
 * TRANSPORT_LIABILITY_LINE and no more.
 */

export const TRANSPORT_LIABILITY_LINE =
  "The shop arranges pickup and delivery; you'll confirm the details and any charge with the shop before pickup";

/** Safety basics shown at the "arranged" state — informational
 *  only (Brief 3). */
export const TRANSPORT_SAFETY_LINE =
  "Before pickup: confirm the name of the towing operator with the shop, remove valuables from the car, and note how the keys will change hands.";

export type TransportStatus =
  | "requested"
  | "arranged"
  | "picked_up"
  | "delivered"
  | "unable";

/** Owner-facing plain-language label for each transport status. */
export const TRANSPORT_STATUS_LABELS: Record<TransportStatus, string> = {
  requested: "Pickup requested",
  arranged: "Shop has arranged pickup",
  picked_up: "Car picked up",
  delivered: "Car delivered to the shop",
  unable: "Shop could not arrange pickup",
};

/** Minimal hop shape the transport derivations need. */
export interface TransportHopLike {
  status: string;
  preference_order: number;
  transport_status?: string | null;
  transport_charge_stated?: number | null;
  outcome_transport_cost?: number | null;
}

const LIVE_TRANSPORT_STATUSES = [
  "accepted",
  "outcome_reported",
  "completed",
] as const;

/**
 * The transport status an owner should see for a chain: the hop
 * that actually took (or is taking) the car wins — accepted, then
 * outcome/completion — then the active hop awaiting a decision,
 * then the latest hop. When the package requests transport but no
 * hop carries a thread yet, the request itself is the status.
 */
export function chainTransportStatus(
  hops: TransportHopLike[],
  transportRequested: boolean
): TransportStatus | null {
  if (!transportRequested) return null;
  const ordered = [...hops].sort((a, b) => a.preference_order - b.preference_order);
  const withThread = ordered.filter((h) => h.transport_status != null);
  const pick = (statuses: readonly string[]) =>
    withThread.find((h) => statuses.includes(h.status));
  const hop =
    pick(LIVE_TRANSPORT_STATUSES) ??
    pick(["sent", "viewed"]) ??
    withThread[withThread.length - 1];
  if (hop?.transport_status) return hop.transport_status as TransportStatus;
  return "requested";
}

/** The shop-stated charge that belongs to the same hop the chain
 *  status came from (accepted / outcome / completed first). */
export function chainTransportCharge(
  hops: TransportHopLike[]
): number | null {
  const ordered = [...hops].sort((a, b) => a.preference_order - b.preference_order);
  const pick = (statuses: readonly string[]) =>
    ordered.find(
      (h) => statuses.includes(h.status) && h.transport_charge_stated != null
    );
  const hop = pick(LIVE_TRANSPORT_STATUSES) ?? pick(["sent", "viewed"]);
  return hop?.transport_charge_stated ?? null;
}

/** The filed outcome transport cost, from the hop that reported an
 *  outcome (or completed). */
export function chainOutcomeTransportCost(
  hops: TransportHopLike[]
): number | null {
  const ordered = [...hops].sort((a, b) => a.preference_order - b.preference_order);
  const hop = ordered.find(
    (h) =>
      (h.status === "outcome_reported" || h.status === "completed") &&
      h.outcome_transport_cost != null
  );
  return hop?.outcome_transport_cost ?? null;
}

/** True when every hop of the chain ended without a shop taking
 *  the referral (all declined / expired): the request could not be
 *  fulfilled inside the owner's list. */
export function chainExhausted(hops: TransportHopLike[]): boolean {
  return (
    hops.length > 0 &&
    hops.every((h) => h.status === "declined" || h.status === "expired")
  );
}
