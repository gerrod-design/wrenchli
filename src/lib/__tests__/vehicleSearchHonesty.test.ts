/**
 * R-72 — vehicle-search listings honesty.
 *
 * The vehicle-search edge function used to answer a dead MarketCheck feed
 * (no key, rejected key, upstream error) with hard-coded invented listings.
 * These tests pin the replacement behavior in the function's data module
 * (supabase/functions/vehicle-search/listings.ts):
 *   (a) any upstream failure produces the explicit LISTINGS_UNAVAILABLE
 *       state and zero listings — fabricated cars can never be served;
 *   (b) a healthy upstream response still returns the real listings, and a
 *       genuine zero-match search is an available (empty) answer, not an
 *       outage;
 *   (c) the fabricated dataset is gone from the function source entirely.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  availableBody,
  searchMarketCheck,
  unavailableBody,
  LISTINGS_UNAVAILABLE_CODE,
  LISTINGS_UNAVAILABLE_MESSAGE,
  type SearchParams,
} from "../../../supabase/functions/vehicle-search/listings";

const PARAMS: SearchParams = { zipCode: "48201" };

const RETIRED_KEY_BODY = JSON.stringify({
  message:
    "This API key has been retired as part of our API credential rotation. Create a new key at https://developers.marketcheck.com/api-keys or contact api@marketcheck.com.",
  code: 403,
});

const RAW_LISTING_1 = {
  id: "mc-real-1",
  vin: "1HGCV1F34KA000001",
  price: 21495,
  miles: 38210,
  dom: 9,
  build: {
    make: "Honda", model: "Accord", year: 2020, trim: "Sport",
    body_type: "Sedan", engine: "1.5L Turbo I4", transmission: "CVT",
    drivetrain: "FWD", fuel_type: "Gasoline", city_miles: 29, highway_miles: 35,
  },
  dealer: { name: "Suburban Honda", city: "Farmington Hills", state: "MI", zip: "48334", rating: 4.4, review_count: 512 },
  vdp_url: "https://example.com/vdp/1",
  is_certified: true, one_owner: true, clean_title: false,
  extra: { features: ["Sunroof"] },
  media: { photo_links: ["https://example.com/p1.jpg"] },
};

const RAW_LISTING_2 = {
  id: "mc-real-2",
  price: 15900,
  miles: 66400,
  build: { make: "Ford", model: "Fusion", year: 2019 },
  // No dealer.zip on purpose: the mapper must default to the search ZIP,
  // exactly as the pre-R-72 healthy path did.
  dealer: { name: "Village Ford", city: "Dearborn", state: "MI" },
  vdp_url: "https://example.com/vdp/2",
};

function jsonFetch(status: number, body: unknown) {
  return (async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as any;
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("R-72 (a): upstream failure => explicit unavailable state, zero listings", () => {
  it("key rejected with 403 (the retired production key) is unavailable", async () => {
    const outcome = await searchMarketCheck(jsonFetch(403, RETIRED_KEY_BODY), "any-key", PARAMS);
    expect(outcome.available).toBe(false);
  });

  it("key rejected with 401 is unavailable", async () => {
    const outcome = await searchMarketCheck(jsonFetch(401, { message: "unauthorized" }), "any-key", PARAMS);
    expect(outcome.available).toBe(false);
  });

  it("upstream 500 is unavailable", async () => {
    const outcome = await searchMarketCheck(jsonFetch(500, "server error"), "any-key", PARAMS);
    expect(outcome.available).toBe(false);
  });

  it("network failure (fetch throws) is unavailable", async () => {
    const throwingFetch = (async () => {
      throw new TypeError("fetch failed");
    }) as any;
    const outcome = await searchMarketCheck(throwingFetch, "any-key", PARAMS);
    expect(outcome.available).toBe(false);
  });

  it("timeout (fetch never answers, abort fires) is unavailable", async () => {
    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("The operation was aborted")));
      })) as any;
    const outcome = await searchMarketCheck(hangingFetch, "any-key", PARAMS, 25);
    expect(outcome.available).toBe(false);
  });

  it("unreadable 200 body is unavailable", async () => {
    const outcome = await searchMarketCheck(jsonFetch(200, "this is not json"), "any-key", PARAMS);
    expect(outcome.available).toBe(false);
  });

  it("the unavailable wire body is machine-readable and carries no listings", () => {
    const body = unavailableBody();
    expect(body.success).toBe(false);
    expect(body.available).toBe(false);
    expect(body.code).toBe(LISTINGS_UNAVAILABLE_CODE);
    expect(body.error).toBe(LISTINGS_UNAVAILABLE_MESSAGE);
    expect(body.listings).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.source).toBe("unavailable");
    const wire = JSON.stringify(body);
    expect(wire).not.toContain("Metro Honda");
    expect(wire).not.toContain("fallback");
  });
});

describe("R-72 (b): healthy upstream => real listings still flow", () => {
  it("maps real MarketCheck listings with source 'marketcheck'", async () => {
    const outcome = await searchMarketCheck(
      jsonFetch(200, { listings: [RAW_LISTING_1, RAW_LISTING_2] }),
      "live-key",
      PARAMS,
    );
    expect(outcome.available).toBe(true);
    if (!outcome.available) throw new Error("expected available outcome");
    expect(outcome.listings).toHaveLength(2);

    const [first, second] = outcome.listings;
    expect(first.source).toBe("marketcheck");
    expect(first.spec).toMatchObject({ make: "Honda", model: "Accord", year: 2020 });
    expect(first.price).toBe(21495);
    expect(first.mileage).toBe(38210);
    expect(first.dealer.name).toBe("Suburban Honda");
    expect(first.location.zipCode).toBe("48334");
    expect(first.badges).toEqual(expect.arrayContaining(["certified", "one-owner"]));
    expect(first.monthlyPayment?.amount).toBeGreaterThan(0);
    // Missing dealer ZIP defaults to the search ZIP (pre-R-72 healthy behavior).
    expect(second.location.zipCode).toBe("48201");
  });

  it("a genuine zero-match search is available and empty, not an outage", async () => {
    const outcome = await searchMarketCheck(jsonFetch(200, { listings: [] }), "live-key", PARAMS);
    expect(outcome.available).toBe(true);
    if (!outcome.available) throw new Error("expected available outcome");
    expect(outcome.listings).toEqual([]);
  });

  it("the available wire body reports success with the real totals", async () => {
    const outcome = await searchMarketCheck(
      jsonFetch(200, { listings: [RAW_LISTING_1] }),
      "live-key",
      PARAMS,
    );
    if (!outcome.available) throw new Error("expected available outcome");
    const body = availableBody(outcome.listings, false);
    expect(body.success).toBe(true);
    expect(body.available).toBe(true);
    expect(body.total).toBe(1);
    expect(body.source).toBe("marketcheck");
    expect(body.cached).toBe(false);
    expect(body.listings[0].id).toBe("mc-real-1");
  });
});

describe("R-72 (c): the fabricated dataset can never be served again", () => {
  const fnDir = resolve(process.cwd(), "supabase/functions/vehicle-search");
  const indexSrc = readFileSync(resolve(fnDir, "index.ts"), "utf8");
  const listingsSrc = readFileSync(resolve(fnDir, "listings.ts"), "utf8");

  it.each([
    "Metro Honda",
    "Toyota of Dearborn",
    "Bill Brown Ford",
    "fb-1",
    "fb-2",
    "fb-3",
    "getFallbackListings",
    '"fallback"',
  ])("vehicle-search source contains no %s", (needle) => {
    expect(indexSrc).not.toContain(needle);
    expect(listingsSrc).not.toContain(needle);
  });
});
