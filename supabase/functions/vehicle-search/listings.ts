/**
 * MarketCheck listings access for the vehicle-search edge function.
 *
 * R-72: this module is the ONLY path from vehicle-search to listing data.
 * When MarketCheck cannot serve real listings (no key, key rejected,
 * upstream error, timeout, unreadable response), the outcome is an explicit
 * "unavailable" result. There is deliberately no substitute dataset here:
 * a listings search must never answer a dead feed with invented cars.
 *
 * Kept free of Deno globals so the behavior is unit-testable from the
 * vitest suite (same pattern as chat/aiden-guard.ts and
 * unsplash-search/scoring.ts).
 */

export interface SearchParams {
  zipCode: string;
  maxDistance?: number;
  minYear?: number;
  maxYear?: number;
  maxPrice?: number;
  maxMileage?: number;
  makes?: string[];
}

export interface VehicleListing {
  id: string;
  spec: {
    make: string; model: string; year: number; trim?: string; bodyStyle?: string;
    engine?: string; transmission?: string; drivetrain?: string; fuelType?: string;
    mpgCity?: number; mpgHighway?: number;
  };
  price: number;
  mileage: number;
  location: { city: string; state: string; zipCode: string; distance?: number };
  dealer: { name: string; rating?: number; reviewCount?: number };
  features: string[];
  images: string[];
  badges: string[];
  monthlyPayment?: { amount: number; apr: number; termMonths: number; downPayment: number };
  source: string;
  sourceUrl: string;
  daysOnMarket?: number;
}

export type MarketCheckOutcome =
  | { available: true; listings: VehicleListing[] }
  | { available: false; reason: string };

export const LISTINGS_UNAVAILABLE_CODE = "LISTINGS_UNAVAILABLE";
export const LISTINGS_UNAVAILABLE_MESSAGE =
  "Car listings are temporarily unavailable. Try again shortly.";

export const MARKETCHECK_TIMEOUT_MS = 10_000;

type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export function buildMarketCheckUrl(apiKey: string, params: SearchParams): string {
  const url = new URL("https://mc-api.marketcheck.com/v2/search/car/active");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("zip", params.zipCode);
  url.searchParams.set("radius", String(params.maxDistance ?? 50));
  url.searchParams.set("rows", "6");
  url.searchParams.set("car_type", "used");

  if (params.makes?.length) url.searchParams.set("make", params.makes.join(","));
  if (params.minYear) url.searchParams.set("year_range", `${params.minYear}-${params.maxYear ?? 2026}`);
  if (params.maxPrice) url.searchParams.set("price_range", `0-${params.maxPrice}`);
  if (params.maxMileage) url.searchParams.set("miles_range", `0-${params.maxMileage}`);

  return url.toString();
}

export function mapMarketCheckListings(results: any[], searchZipCode: string): VehicleListing[] {
  return results.map((r: any) => {
    const price = r.price ?? 0;
    const apr = 5.9; const termMonths = 60;
    const downPayment = Math.round(price * 0.1);
    const loanAmount = price - downPayment;
    const monthlyRate = apr / 100 / 12;
    const monthlyPayment = loanAmount > 0
      ? Math.round(loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1))
      : 0;

    const badges: string[] = [];
    if (r.is_certified) badges.push("certified");
    if ((r.miles ?? 0) < 40000) badges.push("low-mileage");
    if (r.one_owner) badges.push("one-owner");
    if (r.clean_title) badges.push("accident-free");

    return {
      id: r.id ?? `mc-${r.vin ?? Math.random().toString(36).slice(2)}`,
      spec: {
        make: r.build?.make ?? r.make ?? "", model: r.build?.model ?? r.model ?? "",
        year: r.build?.year ?? r.year ?? 0, trim: r.build?.trim ?? r.trim,
        bodyStyle: r.build?.body_type ?? r.body_type, engine: r.build?.engine ?? r.engine,
        transmission: r.build?.transmission ?? r.transmission, drivetrain: r.build?.drivetrain ?? r.drivetrain,
        fuelType: r.build?.fuel_type ?? r.fuel_type, mpgCity: r.build?.city_miles, mpgHighway: r.build?.highway_miles,
      },
      price, mileage: r.miles ?? 0,
      location: { city: r.dealer?.city ?? "", state: r.dealer?.state ?? "", zipCode: r.dealer?.zip ?? searchZipCode, distance: r.dist },
      dealer: { name: r.dealer?.name ?? "Dealer", rating: r.dealer?.rating, reviewCount: r.dealer?.review_count },
      features: r.extra?.features ?? [], images: r.media?.photo_links?.slice(0, 5) ?? [], badges,
      monthlyPayment: price > 0 ? { amount: monthlyPayment, apr, termMonths, downPayment } : undefined,
      source: "marketcheck", sourceUrl: r.vdp_url ?? "", daysOnMarket: r.dom,
    } as VehicleListing;
  });
}

/**
 * Fetch real listings from MarketCheck. Any failure to obtain a trustworthy
 * answer — rejection (401/403/other non-200), network error, timeout, or an
 * unreadable body — resolves to { available: false }. A 200 response with
 * zero listings is a real, available answer and is NOT unavailable.
 */
export async function searchMarketCheck(
  fetchFn: FetchFn,
  apiKey: string,
  params: SearchParams,
  timeoutMs: number = MARKETCHECK_TIMEOUT_MS,
): Promise<MarketCheckOutcome> {
  const url = buildMarketCheckUrl(apiKey, params);
  console.log("MarketCheck query:", url.replace(apiKey, "***"));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp: Response;
  try {
    resp = await fetchFn(url, { signal: controller.signal });
  } catch (err) {
    console.error("MarketCheck fetch failed:", err);
    return { available: false, reason: "upstream_fetch_failed" };
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    let detail = "";
    try { detail = (await resp.text()).slice(0, 300); } catch { /* body unreadable; status is enough */ }
    console.error(`MarketCheck rejected the request (HTTP ${resp.status}):`, detail);
    return { available: false, reason: `upstream_http_${resp.status}` };
  }

  let data: any;
  try {
    data = await resp.json();
  } catch (err) {
    console.error("MarketCheck returned an unreadable response:", err);
    return { available: false, reason: "upstream_bad_response" };
  }

  const results = Array.isArray(data?.listings) ? data.listings : [];
  console.log(`MarketCheck returned ${results.length} listings`);
  return { available: true, listings: mapMarketCheckListings(results, params.zipCode) };
}

/** Wire body for a healthy answer (including a genuine zero-match search). */
export function availableBody(listings: VehicleListing[], cached: boolean) {
  return {
    success: true,
    available: true,
    listings,
    total: listings.length,
    source: "marketcheck",
    cached,
  };
}

/**
 * Wire body for the unavailable state: machine-readable (available: false,
 * stable code), carries the plain-language message, and contains no listings.
 */
export function unavailableBody() {
  return {
    success: false,
    available: false,
    code: LISTINGS_UNAVAILABLE_CODE,
    error: LISTINGS_UNAVAILABLE_MESSAGE,
    listings: [] as VehicleListing[],
    total: 0,
    source: "unavailable",
    cached: false,
  };
}
