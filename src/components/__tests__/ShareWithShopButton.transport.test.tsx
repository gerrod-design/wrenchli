/**
 * Mobility Brief 3 (Option A) integration test for the pilot send
 * flow's pickup/delivery request.
 *
 * Contract under test:
 *  - The owner can mark "This car can't be driven — I need pickup
 *    and delivery" and add a note; the brief's liability line shows
 *    with it.
 *  - While the request is on, shops that offer pickup and delivery
 *    surface first in the picker, and the owner can narrow the list
 *    to just those shops.
 *  - If none of the owner's chosen shops has said it offers pickup
 *    and delivery, the owner is told plainly before sending — no
 *    silent dead end.
 *  - Sending writes transport_requested / transport_note on the
 *    package and starts the first hop's transport thread.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const SHOPS = [
  {
    id: "shop-no",
    name: "Aardvark Auto",
    address: "1 First St",
    city: "Detroit",
    state: "MI",
    zip_code: "48201",
    lat: 42.35,
    lng: -83.06,
    offers_loaner: false,
    offers_shuttle: false,
    offers_pickup_delivery: false,
    mobility_notes: null,
  },
  {
    id: "shop-yes",
    name: "Zebra Auto",
    address: "9 Ninth St",
    city: "Detroit",
    state: "MI",
    zip_code: "48202",
    lat: 42.36,
    lng: -83.07,
    offers_loaner: false,
    offers_shuttle: false,
    offers_pickup_delivery: true,
    mobility_notes: null,
  },
];

const inserts: Record<string, any[]> = { referral_packages: [], shop_referrals: [] };

vi.mock("@/lib/analytics", () => ({
  trackPlausibleEvent: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn((table: string) => {
      if (table === "service_providers") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({ data: SHOPS, error: null })),
          })),
        };
      }
      if (table === "referral_packages") {
        return {
          insert: vi.fn((payload: any) => {
            inserts.referral_packages.push(payload);
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: "pkg-1", token: "tok-1" },
                  error: null,
                })),
              })),
            };
          }),
        };
      }
      // shop_referrals
      return {
        insert: vi.fn(async (payload: any) => {
          inserts.shop_referrals.push(payload);
          return { error: null };
        }),
      };
    }),
  },
}));

import ShareWithShopButton from "../ShareWithShopButton";

const LIABILITY =
  "The shop arranges pickup and delivery; you'll confirm the details and any charge with the shop before pickup";

describe("ShareWithShopButton (pilot) — Mobility Brief 3 transport request", () => {
  it("offers the immobile-car request, surfaces offering shops first, warns plainly, and writes the request on send", async () => {
    render(<ShareWithShopButton pilot diagnosisTitle="Engine will not start" />);

    await screen.findByText("Aardvark Auto");
    await screen.findByText("Zebra Auto");

    // The request control is present; the liability line is not
    // shown until the owner turns the request on.
    const toggle = screen.getByRole("checkbox", {
      name: /This car can.t be driven — I need pickup and delivery/,
    });
    expect(screen.queryByText(LIABILITY)).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByText(LIABILITY)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Where the car sits, and anything the driver should know/)
    ).toBeInTheDocument();

    // Offering shops surface first once the request is on.
    const listItems = screen
      .getAllByRole("button")
      .filter(
        (b) =>
          b.getAttribute("aria-pressed") !== null &&
          (b.textContent?.includes("Auto") ?? false)
      );
    expect(listItems[0].textContent).toContain("Zebra Auto");
    expect(listItems[1].textContent).toContain("Aardvark Auto");

    // The filter narrows the list to offering shops only.
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Only show shops that offer pickup and delivery/ })
    );
    expect(screen.queryByText("Aardvark Auto")).not.toBeInTheDocument();
    expect(screen.getByText("Zebra Auto")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Only show shops that offer pickup and delivery/ })
    );
    await screen.findByText("Aardvark Auto");

    // Pick only the shop that has NOT said it offers the service:
    // the plain no-offer notice appears before sending.
    fireEvent.click(screen.getByRole("button", { name: /Aardvark Auto/ }));
    expect(
      screen.getByText("None of the shops you chose has said it offers pickup and delivery.")
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(/Where the car sits, and anything the driver should know/),
      { target: { value: "Car is in the driveway" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /Send to first-choice shop/ }));

    // The package carries the request; the first hop's thread starts.
    await screen.findByText("Referral Package Created!");
    expect(inserts.referral_packages).toHaveLength(1);
    expect(inserts.referral_packages[0]).toMatchObject({
      transport_requested: true,
      transport_note: "Car is in the driveway",
    });
    expect(inserts.shop_referrals).toHaveLength(1);
    expect(inserts.shop_referrals[0]).toMatchObject({
      shop_id: "shop-no",
      transport_status: "requested",
    });

    // The sent view repeats the plain warning for this pick.
    expect(
      screen.getByText(/None of the shops you chose has said it offers pickup and delivery\. Your pickup and delivery request still goes with your package/)
    ).toBeInTheDocument();
  });

  it("leaves the package untouched when the request is off", async () => {
    inserts.referral_packages.length = 0;
    inserts.shop_referrals.length = 0;
    render(<ShareWithShopButton pilot diagnosisTitle="Worn brake pads" />);

    await screen.findByText("Zebra Auto");
    fireEvent.click(screen.getByRole("button", { name: /Zebra Auto/ }));
    fireEvent.click(screen.getByRole("button", { name: /Send to first-choice shop/ }));

    await screen.findByText("Referral Package Created!");
    expect(inserts.referral_packages[0]).toMatchObject({ transport_requested: false });
    expect(inserts.referral_packages[0].transport_note).toBeNull();
    expect(inserts.shop_referrals[0]).not.toHaveProperty("transport_status");
  });
});
