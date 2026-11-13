/**
 * Mobility Brief 1 integration test for the pilot shop picker.
 *
 * Contract under test:
 *  - Picker cards show shop-reported mobility chips only for shops
 *    whose attributes are set.
 *  - The transportation panel sits alongside the send control:
 *    unprefilled before a pick, pointed at the owner's first-choice
 *    shop (links + the shop's offers section) after it.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const SHOPS = [
  {
    id: "shop-1",
    name: "Test Auto Repair",
    address: "123 Main St",
    city: "Detroit",
    state: "MI",
    zip_code: "48201",
    lat: 42.35,
    lng: -83.06,
    offers_loaner: true,
    offers_shuttle: false,
    offers_pickup_delivery: true,
    mobility_notes: "Loaner with any repair over $500",
  },
  {
    id: "shop-2",
    name: "Bare Bones Auto",
    address: "9 Side St",
    city: "Detroit",
    state: "MI",
    zip_code: "48202",
    lat: 42.36,
    lng: -83.07,
    offers_loaner: false,
    offers_shuttle: false,
    offers_pickup_delivery: false,
    mobility_notes: null,
  },
];

vi.mock("@/lib/analytics", () => ({
  trackPlausibleEvent: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: SHOPS, error: null })),
      })),
    })),
  },
}));

import ShareWithShopButton from "../ShareWithShopButton";

describe("ShareWithShopButton (pilot) — Mobility Brief 1", () => {
  it("renders chips only for shops with attributes set, and a panel that follows the first pick", async () => {
    render(<ShareWithShopButton pilot diagnosisTitle="Worn brake pads" />);

    // Shops load from the picker query.
    await screen.findByText("Test Auto Repair");
    await screen.findByText("Bare Bones Auto");

    // Chips: only the attributed shop contributes any.
    expect(screen.getByText("Shop-reported: loaner cars")).toBeInTheDocument();
    expect(screen.getByText("Shop-reported: pickup and delivery")).toBeInTheDocument();
    expect(screen.queryByText(/Shop-reported: shuttle/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Shop-reported:/)).toHaveLength(2);

    // Panel alongside the send control, unprefilled before any pick.
    const panel = within(screen.getByTestId("transportation-panel"));
    expect(panel.getByText("Other ways to get around")).toBeInTheDocument();
    const uberBefore = panel.getByText(/Uber/).closest("a");
    expect(uberBefore?.getAttribute("href")).not.toContain("dropoff");
    expect(panel.queryByText(/This shop offers/)).not.toBeInTheDocument();

    // Pick the attributed shop: the panel points at it.
    fireEvent.click(screen.getByRole("button", { name: /Test Auto Repair/ }));

    const uberAfter = panel.getByText("Uber — ride to the shop").closest("a");
    expect(uberAfter?.getAttribute("href")).toContain("dropoff[latitude]=42.35");
    expect(uberAfter?.getAttribute("href")).toContain("pickup[latitude]=my_location");
    expect(
      panel.getByText("This shop offers, as reported by the shop")
    ).toBeInTheDocument();
    expect(panel.getByText("Loaner cars")).toBeInTheDocument();
    expect(panel.getByText("Loaner with any repair over $500")).toBeInTheDocument();
  });
});
