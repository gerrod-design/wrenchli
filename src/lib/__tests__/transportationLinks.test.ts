/**
 * Unit tests for the Mobility Brief 1 transportation link builders.
 *
 * Contract under test (brief, 2026-11-09; approved 2026-11-13):
 *  - Uber uses the documented universal-link form, pickup resolved
 *    on the rider's device (`my_location`), dropoff = the shop.
 *  - Lyft ships as a plain link (its prefill scheme is from a
 *    deprecated SDK program and could not be proven at build time).
 *  - Maps transit links use the documented URLs API form with the
 *    origin always omitted; the only consumer location ever in a
 *    URL is a ZIP code, as the directions-home destination.
 *  - No affiliate parameters (no Uber `client_id`) anywhere.
 *  - Mobility attributes render only when set.
 */
import { describe, expect, it } from "vitest";
import {
  chainShowsHomeDirections,
  hasMobilityAttributes,
  lyftRideUrl,
  mobilityAttributes,
  pickPanelShop,
  shopFormattedAddress,
  transitDirectionsUrl,
  uberRideUrl,
  type MobilityShop,
} from "../transportationLinks";

const SHOP: MobilityShop = {
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
};

const BARE_SHOP: MobilityShop = {
  id: "shop-2",
  name: "Bare Bones Auto",
  offers_loaner: false,
  offers_shuttle: false,
  offers_pickup_delivery: false,
  mobility_notes: null,
};

describe("shopFormattedAddress", () => {
  it("composes street, city, state and ZIP", () => {
    expect(shopFormattedAddress(SHOP)).toBe("123 Main St, Detroit, MI 48201");
  });

  it("omits missing parts without dangling separators", () => {
    expect(shopFormattedAddress({ id: "x", name: "X", city: "Detroit", state: "MI" })).toBe(
      "Detroit, MI"
    );
    expect(shopFormattedAddress({ id: "x", name: "X" })).toBe("");
  });
});

describe("mobilityAttributes", () => {
  it("returns only the attributes that are set, with both label forms", () => {
    const attrs = mobilityAttributes(SHOP);
    expect(attrs.map((a) => a.key)).toEqual(["loaner", "pickup_delivery"]);
    expect(attrs[0].shortLabel).toBe("Loaner cars");
    expect(attrs[0].chipLabel).toBe("Shop-reported: loaner cars");
    expect(attrs[1].chipLabel).toBe("Shop-reported: pickup and delivery");
  });

  it("returns nothing when nothing is set — never a 'no' claim", () => {
    expect(mobilityAttributes(BARE_SHOP)).toEqual([]);
    expect(hasMobilityAttributes(BARE_SHOP)).toBe(false);
  });

  it("treats notes alone as having something to show", () => {
    expect(hasMobilityAttributes({ ...BARE_SHOP, mobility_notes: "Call ahead" })).toBe(true);
    expect(hasMobilityAttributes(SHOP)).toBe(true);
  });
});

describe("uberRideUrl", () => {
  it("builds the documented setPickup link with device-resolved pickup and the shop as dropoff", () => {
    const url = uberRideUrl(SHOP);
    expect(url.startsWith("https://m.uber.com/ul/?action=setPickup")).toBe(true);
    expect(url).toContain("pickup[latitude]=my_location");
    expect(url).toContain("dropoff[latitude]=42.35");
    expect(url).toContain("dropoff[longitude]=-83.06");
    expect(url).toContain("dropoff[nickname]=Test%20Auto%20Repair");
    expect(url).toContain(
      "dropoff[formatted_address]=123%20Main%20St%2C%20Detroit%2C%20MI%2048201"
    );
  });

  it("never carries an affiliate client_id", () => {
    expect(uberRideUrl(SHOP)).not.toContain("client_id");
    expect(uberRideUrl(null)).not.toContain("client_id");
  });

  it("with no shop, opens the rider flow with only the device-resolved pickup", () => {
    const url = uberRideUrl(null);
    expect(url).toContain("pickup[latitude]=my_location");
    expect(url).not.toContain("dropoff");
  });

  it("fromShop sets the pickup at the shop and leaves the dropoff to the rider", () => {
    const url = uberRideUrl(SHOP, "fromShop");
    expect(url).toContain("pickup[latitude]=42.35");
    expect(url).toContain("pickup[longitude]=-83.06");
    expect(url).not.toContain("dropoff");
    expect(url).not.toContain("my_location");
  });

  it("without coordinates, still prefills the shop by name and address", () => {
    const url = uberRideUrl({ ...SHOP, lat: null, lng: null });
    expect(url).not.toContain("dropoff[latitude]");
    expect(url).toContain("dropoff[nickname]=Test%20Auto%20Repair");
    expect(url).toContain("dropoff[formatted_address]");
  });
});

describe("lyftRideUrl", () => {
  it("ships the plain rider page — the dated prefill scheme is not used", () => {
    expect(lyftRideUrl()).toBe("https://www.lyft.com/rider");
    expect(lyftRideUrl()).not.toContain("lyft://");
  });
});

describe("transitDirectionsUrl", () => {
  it("uses the documented Maps URLs form with transit mode and no origin", () => {
    const url = transitDirectionsUrl("123 Main St, Detroit, MI 48201");
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=123%20Main%20St%2C%20Detroit%2C%20MI%2048201"
    );
    expect(url).not.toContain("origin");
  });

  it("with no destination, opens the directions form", () => {
    expect(transitDirectionsUrl(null)).toBe(
      "https://www.google.com/maps/dir/?api=1&travelmode=transit"
    );
  });

  it("the home variant's destination is the ZIP code only", () => {
    expect(transitDirectionsUrl("48201")).toContain("destination=48201");
  });
});

describe("pickPanelShop", () => {
  const byId = { [SHOP.id]: SHOP, [BARE_SHOP.id]: BARE_SHOP };

  it("points at the accepted hop's shop once a shop accepts", () => {
    const hops = [
      { shop_id: BARE_SHOP.id, status: "declined", preference_order: 1 },
      { shop_id: SHOP.id, status: "accepted", preference_order: 2 },
    ];
    expect(pickPanelShop(hops, byId)?.id).toBe(SHOP.id);
  });

  it("before acceptance, points at the active hop's shop", () => {
    const hops = [
      { shop_id: SHOP.id, status: "sent", preference_order: 1 },
      { shop_id: BARE_SHOP.id, status: "sent", preference_order: 2 },
    ];
    // hops arrive unordered in the row list; the first ACTIVE hop in
    // preference order is the panel target.
    const hopsShuffled = [hops[1], hops[0]];
    expect(pickPanelShop(hopsShuffled, byId)?.id).toBe(SHOP.id);
  });

  it("during the confirmation window, points at the outcome hop's shop", () => {
    const hops = [{ shop_id: SHOP.id, status: "outcome_reported", preference_order: 1 }];
    expect(pickPanelShop(hops, byId)?.id).toBe(SHOP.id);
  });

  it("returns null for an empty chain or an unknown shop", () => {
    expect(pickPanelShop([], byId)).toBeNull();
    expect(
      pickPanelShop([{ shop_id: "missing", status: "accepted", preference_order: 1 }], byId)
    ).toBeNull();
  });
});

describe("chainShowsHomeDirections", () => {
  it("is true once an outcome is reported or the repair completed", () => {
    expect(
      chainShowsHomeDirections([{ shop_id: "a", status: "completed", preference_order: 1 }])
    ).toBe(true);
    expect(
      chainShowsHomeDirections([
        { shop_id: "a", status: "outcome_reported", preference_order: 1 },
      ])
    ).toBe(true);
  });

  it("is false while the referral is still in flight", () => {
    expect(
      chainShowsHomeDirections([{ shop_id: "a", status: "accepted", preference_order: 1 }])
    ).toBe(false);
  });
});
