import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import {
  availableBody,
  searchMarketCheck,
  unavailableBody,
  type SearchParams,
  type VehicleListing,
} from "./listings.ts";

/**
 * vehicle-search — real used-car listings from MarketCheck.
 *
 * R-72: when MarketCheck cannot serve real listings (no key configured, key
 * rejected, upstream error, timeout), this function returns the explicit
 * LISTINGS_UNAVAILABLE state and no listings at all. It must never answer a
 * dead feed with invented cars; the hard-coded substitute dataset that used
 * to be served in that case has been removed.
 *
 * The in-memory cache below only ever holds real MarketCheck listings
 * (including genuine zero-match results). Unavailable outcomes are never
 * cached, so a recovered feed is picked up on the next request.
 */

const cache = new Map<string, { listings: VehicleListing[]; ts: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCacheKey(params: SearchParams): string {
  return JSON.stringify({
    z: params.zipCode, d: params.maxDistance ?? 50, y0: params.minYear,
    y1: params.maxYear, p: params.maxPrice, m: params.maxMileage, mk: params.makes?.sort(),
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.GENEROUS);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.GENEROUS.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  const jsonHeaders = { ...securityHeaders, "Content-Type": "application/json" };

  try {
    let params: SearchParams;

    // Support both GET (query params from chat function) and POST (JSON body)
    if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        zipCode: url.searchParams.get("location") || url.searchParams.get("zipCode") || url.searchParams.get("zip") || "",
        maxDistance: url.searchParams.has("maxDistance") ? Number(url.searchParams.get("maxDistance")) : undefined,
        minYear: url.searchParams.has("minYear") ? Number(url.searchParams.get("minYear")) : undefined,
        maxYear: url.searchParams.has("maxYear") ? Number(url.searchParams.get("maxYear")) : undefined,
        maxPrice: url.searchParams.has("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
        maxMileage: url.searchParams.has("maxMileage") ? Number(url.searchParams.get("maxMileage")) : undefined,
        makes: url.searchParams.has("vehicle_make") ? [url.searchParams.get("vehicle_make")!] : undefined,
      };
    } else {
      params = await req.json();
    }

    if (!params.zipCode) {
      return new Response(
        JSON.stringify({ success: false, error: "zipCode is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const cacheKey = getCacheKey(params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log("Cache hit for", params.zipCode);
      return new Response(
        JSON.stringify(availableBody(cached.listings, true)),
        { headers: jsonHeaders }
      );
    }

    const marketCheckKey = Deno.env.get("MARKETCHECK_API_KEY");
    if (!marketCheckKey) {
      console.warn("MARKETCHECK_API_KEY not set; returning LISTINGS_UNAVAILABLE");
      return new Response(
        JSON.stringify(unavailableBody()),
        { headers: jsonHeaders }
      );
    }

    const outcome = await searchMarketCheck(fetch, marketCheckKey, params);
    if (!outcome.available) {
      console.error("MarketCheck unavailable:", outcome.reason);
      return new Response(
        JSON.stringify(unavailableBody()),
        { headers: jsonHeaders }
      );
    }

    if (cache.size > 50) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) cache.delete(oldest[0]);
    }
    cache.set(cacheKey, { listings: outcome.listings, ts: Date.now() });

    return new Response(
      JSON.stringify(availableBody(outcome.listings, false)),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Vehicle search error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Search failed" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
