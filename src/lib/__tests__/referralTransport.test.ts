/**
 * Mobility Brief 3 — referral transport helpers.
 *
 * Contract: exact owner-facing copy (the liability line is the
 * brief's string verbatim and no more; the stated charge is labeled
 * as the shop's), chain-level status derivation prefers the hop
 * that actually took the car, and chain exhaustion is detected so
 * the owner is never left at a silent dead end.
 */
import { describe, expect, it } from "vitest";
import {
  TRANSPORT_LIABILITY_LINE,
  TRANSPORT_SAFETY_LINE,
  TRANSPORT_STATUS_LABELS,
  chainExhausted,
  chainOutcomeTransportCost,
  chainTransportCharge,
  chainTransportStatus,
  type TransportHopLike,
} from "../referralTransport";

const hop = (partial: Partial<TransportHopLike>): TransportHopLike => ({
  status: "sent",
  preference_order: 1,
  transport_status: null,
  transport_charge_stated: null,
  outcome_transport_cost: null,
  ...partial,
});

describe("referralTransport copy", () => {
  it("uses the brief's liability line verbatim", () => {
    expect(TRANSPORT_LIABILITY_LINE).toBe(
      "The shop arranges pickup and delivery; you'll confirm the details and any charge with the shop before pickup"
    );
  });

  it("carries the arranged-state safety basics from the brief", () => {
    expect(TRANSPORT_SAFETY_LINE).toContain("confirm the name of the towing operator");
    expect(TRANSPORT_SAFETY_LINE).toContain("remove valuables");
    expect(TRANSPORT_SAFETY_LINE).toContain("keys will change hands");
  });

  it("labels every status in plain language", () => {
    expect(TRANSPORT_STATUS_LABELS).toEqual({
      requested: "Pickup requested",
      arranged: "Shop has arranged pickup",
      picked_up: "Car picked up",
      delivered: "Car delivered to the shop",
      unable: "Shop could not arrange pickup",
    });
  });
});

describe("chainTransportStatus", () => {
  it("is null when the package never requested transport", () => {
    expect(
      chainTransportStatus([hop({ status: "accepted", transport_status: "arranged" })], false)
    ).toBeNull();
  });

  it("falls back to 'requested' when no hop carries a thread yet", () => {
    expect(chainTransportStatus([hop({ status: "sent" })], true)).toBe("requested");
  });

  it("prefers the accepted hop's thread over an earlier hop's", () => {
    const hops = [
      hop({ status: "declined", preference_order: 1, transport_status: "requested" }),
      hop({ status: "accepted", preference_order: 2, transport_status: "picked_up" }),
    ];
    expect(chainTransportStatus(hops, true)).toBe("picked_up");
  });

  it("uses the active hop's thread while awaiting a decision", () => {
    const hops = [
      hop({ status: "declined", preference_order: 1, transport_status: "requested" }),
      hop({ status: "viewed", preference_order: 2, transport_status: "requested" }),
    ];
    expect(chainTransportStatus(hops, true)).toBe("requested");
  });
});

describe("chainTransportCharge / chainOutcomeTransportCost", () => {
  it("takes the stated charge from the accepted hop", () => {
    const hops = [
      hop({ status: "declined", preference_order: 1 }),
      hop({ status: "accepted", preference_order: 2, transport_charge_stated: 75 }),
    ];
    expect(chainTransportCharge(hops)).toBe(75);
  });

  it("is null when no hop stated a charge", () => {
    expect(chainTransportCharge([hop({ status: "accepted" })])).toBeNull();
  });

  it("reads the filed outcome transport cost from the outcome hop", () => {
    const hops = [
      hop({ status: "outcome_reported", outcome_cost: 500, outcome_transport_cost: 75 } as TransportHopLike),
    ];
    expect(chainOutcomeTransportCost(hops)).toBe(75);
  });
});

describe("chainExhausted", () => {
  it("is true when every hop declined or expired", () => {
    expect(
      chainExhausted([hop({ status: "declined" }), hop({ status: "expired", preference_order: 2 })])
    ).toBe(true);
  });

  it("is false while any hop is live or took the referral", () => {
    expect(chainExhausted([hop({ status: "declined" }), hop({ status: "sent", preference_order: 2 })])).toBe(false);
    expect(chainExhausted([hop({ status: "accepted" })])).toBe(false);
    expect(chainExhausted([])).toBe(false);
  });
});
