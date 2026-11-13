/**
 * Mobility Brief 3 (Option A) tests for the Garage referral view.
 *
 * Contract under test:
 *  - The chain's transport status shows in plain language next to
 *    the referral status, with the shop's stated charge labeled as
 *    the shop's and the brief's liability line.
 *  - At the "arranged" state the safety basics from the brief show.
 *  - The outcome/confirmation surface shows repair cost and
 *    transport cost separately, then the total.
 *  - An exhausted chain tells the owner the request could not be
 *    fulfilled inside their list and points at the next move.
 *  - When no request exists and a shop has accepted, the owner can
 *    add the request (request_referral_transport).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const SHOP = {
  id: "shop-1",
  name: "Test Auto Repair",
  address: "123 Main St",
  city: "Detroit",
  state: "MI",
  zip_code: "48201",
  lat: 42.35,
  lng: -83.06,
  offers_loaner: false,
  offers_shuttle: false,
  offers_pickup_delivery: true,
  mobility_notes: null,
};

function hopRow(partial: Record<string, unknown>) {
  return {
    id: "hop-1",
    package_id: "pkg-1",
    shop_id: "shop-1",
    chain_id: "chain-1",
    preference_order: 1,
    escalated_from: null,
    status: "accepted",
    sent_at: "2026-11-13T10:00:00Z",
    responded_at: "2026-11-13T11:00:00Z",
    window_expires_at: null,
    outcome_found: null,
    outcome_did: null,
    outcome_cost: null,
    outcome_transport_cost: null,
    transport_status: null,
    transport_charge_stated: null,
    outcome_reported_at: null,
    completion_confirmed_by: null,
    completion_confirmed_at: null,
    founder_flagged: false,
    disputed_at: null,
    created_at: "2026-11-13T10:00:00Z",
    updated_at: "2026-11-13T11:00:00Z",
    ...partial,
  };
}

const state = {
  rows: [] as ReturnType<typeof hopRow>[],
  packages: [] as Record<string, unknown>[],
  rpcCalls: [] as { name: string; args: unknown }[],
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    rpc: vi.fn(async (name: string, args?: unknown) => {
      state.rpcCalls.push({ name, args });
      return { data: { ok: true }, error: null };
    }),
    from: vi.fn((table: string) => {
      if (table === "shop_referrals") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({ data: state.rows, error: null })),
          })),
        };
      }
      if (table === "service_providers") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => ({ data: [SHOP], error: null })),
          })),
        };
      }
      // referral_packages
      return {
        select: vi.fn(() => ({
          in: vi.fn(async () => ({ data: state.packages, error: null })),
        })),
      };
    }),
  },
}));

import OwnerReferralStatus from "../OwnerReferralStatus";

const LIABILITY =
  "The shop arranges pickup and delivery; you'll confirm the details and any charge with the shop before pickup";

describe("OwnerReferralStatus — Mobility Brief 3 transport", () => {
  it("shows the arranged state with the shop's labeled charge, the owner's note, and the safety basics", async () => {
    state.rows = [
      hopRow({ transport_status: "arranged", transport_charge_stated: 75 }),
    ];
    state.packages = [
      {
        id: "pkg-1",
        zip_code: "48201",
        transport_requested: true,
        transport_note: "In the driveway",
      },
    ];
    render(<OwnerReferralStatus />);

    expect(await screen.findByText("Shop has arranged pickup")).toBeInTheDocument();
    expect(
      screen.getByText("Pickup/delivery charge set by the shop: $75")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your note for the shop: In the driveway/)
    ).toBeInTheDocument();
    expect(screen.getByText(LIABILITY)).toBeInTheDocument();
    expect(
      screen.getByText(/confirm the name of the towing operator with the shop/)
    ).toBeInTheDocument();
  });

  it("shows repair cost and transport cost separately, then the total, on the outcome surface", async () => {
    state.rows = [
      hopRow({
        status: "outcome_reported",
        outcome_found: "Worn pads",
        outcome_did: "Replaced pads and rotors",
        outcome_cost: 500,
        outcome_transport_cost: 75,
        outcome_reported_at: "2026-11-13T15:00:00Z",
        transport_status: "delivered",
      }),
    ];
    state.packages = [
      {
        id: "pkg-1",
        zip_code: "48201",
        transport_requested: true,
        transport_note: null,
      },
    ];
    render(<OwnerReferralStatus />);

    expect(await screen.findByText("Repair cost: $500")).toBeInTheDocument();
    expect(
      screen.getByText("Pickup/delivery: $75 (charge set by the shop)")
    ).toBeInTheDocument();
    expect(screen.getByText("Total: $575")).toBeInTheDocument();
    expect(screen.queryByText("Cost: $500")).not.toBeInTheDocument();
    // The transport thread reads as delivered alongside it.
    expect(screen.getByText("Car delivered to the shop")).toBeInTheDocument();
  });

  it("tells the owner when the chain ran out with the request unfulfilled", async () => {
    state.rows = [
      hopRow({ id: "hop-1", status: "declined", transport_status: "requested" }),
      hopRow({
        id: "hop-2",
        preference_order: 2,
        status: "expired",
        transport_status: "requested",
      }),
    ];
    state.packages = [
      {
        id: "pkg-1",
        zip_code: "48201",
        transport_requested: true,
        transport_note: null,
      },
    ];
    render(<OwnerReferralStatus />);

    expect(
      await screen.findByText(
        /Your pickup and delivery request could not be fulfilled by the shops on your list/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/or arrange your own tow/)).toBeInTheDocument();
  });

  it("lets the owner add the request after a shop has accepted", async () => {
    state.rows = [hopRow({})];
    state.packages = [
      {
        id: "pkg-1",
        zip_code: "48201",
        transport_requested: false,
        transport_note: null,
      },
    ];
    state.rpcCalls = [];
    render(<OwnerReferralStatus />);

    const openButton = await screen.findByRole("button", {
      name: /This car can.t be driven — request pickup and delivery/,
    });
    fireEvent.click(openButton);

    fireEvent.click(
      screen.getByRole("button", { name: "Request pickup and delivery" })
    );

    await vi.waitFor(() => {
      expect(
        state.rpcCalls.some((c) => c.name === "request_referral_transport")
      ).toBe(true);
    });
    const call = state.rpcCalls.find((c) => c.name === "request_referral_transport");
    expect(call?.args).toMatchObject({ p_referral_id: "hop-1" });
  });
});
