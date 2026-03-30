import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

const LUXURY_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Lexus"];

/* ── Location Mapping: ZIP/city name → canonical city ── */
const locationMap: Record<string, string> = {
  // Michigan — Detroit Metro
  warren: "Warren", "48088": "Warren", "48089": "Warren", "48091": "Warren", "48092": "Warren", "48093": "Warren", "48094": "Warren", "48095": "Warren",
  birmingham: "Birmingham", "48009": "Birmingham", "48012": "Birmingham", "48025": "Birmingham", "48301": "Birmingham", "48302": "Birmingham", "48303": "Birmingham", "48304": "Birmingham",
  troy: "Troy", "48007": "Troy", "48083": "Troy", "48084": "Troy", "48085": "Troy", "48098": "Troy", "48099": "Troy",
  sterling: "Sterling Heights", "48310": "Sterling Heights", "48311": "Sterling Heights", "48312": "Sterling Heights", "48313": "Sterling Heights", "48314": "Sterling Heights", "48315": "Sterling Heights", "48316": "Sterling Heights", "48317": "Sterling Heights",
  "ann arbor": "Ann Arbor", "48103": "Ann Arbor", "48104": "Ann Arbor", "48105": "Ann Arbor", "48106": "Ann Arbor", "48107": "Ann Arbor", "48108": "Ann Arbor", "48109": "Ann Arbor", "48113": "Ann Arbor",
  dearborn: "Dearborn", "48120": "Dearborn", "48121": "Dearborn", "48123": "Dearborn", "48124": "Dearborn", "48126": "Dearborn", "48128": "Dearborn",
  livonia: "Livonia", "48150": "Livonia", "48151": "Livonia", "48152": "Livonia", "48153": "Livonia", "48154": "Livonia",
  detroit: "Detroit", "48201": "Detroit", "48202": "Detroit", "48203": "Detroit", "48204": "Detroit", "48205": "Detroit", "48206": "Detroit", "48207": "Detroit", "48208": "Detroit", "48209": "Detroit", "48210": "Detroit", "48211": "Detroit", "48212": "Detroit", "48213": "Detroit", "48214": "Detroit", "48215": "Detroit", "48216": "Detroit", "48217": "Detroit", "48218": "Detroit", "48219": "Detroit", "48221": "Detroit", "48222": "Detroit", "48223": "Detroit", "48224": "Detroit", "48225": "Detroit", "48226": "Detroit", "48227": "Detroit", "48228": "Detroit", "48229": "Detroit", "48230": "Detroit", "48231": "Detroit", "48232": "Detroit", "48233": "Detroit", "48234": "Detroit", "48235": "Detroit", "48236": "Detroit", "48237": "Detroit", "48238": "Detroit", "48239": "Detroit", "48240": "Detroit", "48242": "Detroit", "48243": "Detroit",
  southfield: "Southfield", "48033": "Southfield", "48034": "Southfield", "48037": "Southfield", "48075": "Southfield", "48076": "Southfield", "48086": "Southfield",
  "royal oak": "Royal Oak", "48067": "Royal Oak", "48068": "Royal Oak", "48073": "Royal Oak", "48074": "Royal Oak",
  farmington: "Farmington Hills", "48331": "Farmington Hills", "48332": "Farmington Hills", "48333": "Farmington Hills", "48334": "Farmington Hills", "48335": "Farmington Hills", "48336": "Farmington Hills",
  novi: "Novi", "48374": "Novi", "48375": "Novi", "48376": "Novi", "48377": "Novi",
  canton: "Canton", "48187": "Canton", "48188": "Canton",
  pontiac: "Pontiac", "48340": "Pontiac", "48341": "Pontiac", "48342": "Pontiac", "48343": "Pontiac",
  "rochester hills": "Rochester Hills", rochester: "Rochester Hills", "48306": "Rochester Hills", "48307": "Rochester Hills", "48308": "Rochester Hills", "48309": "Rochester Hills",
  westland: "Westland", "48185": "Westland", "48186": "Westland",
  plymouth: "Plymouth", "48170": "Plymouth", "48171": "Plymouth",
  ypsilanti: "Ypsilanti", "48197": "Ypsilanti", "48198": "Ypsilanti",
  "clarkston": "Pontiac", "48346": "Pontiac", "48347": "Pontiac", "48348": "Pontiac",
  "waterford": "Pontiac", "48327": "Pontiac", "48328": "Pontiac", "48329": "Pontiac",
  "lake orion": "Rochester Hills", "48359": "Rochester Hills", "48360": "Rochester Hills", "48361": "Rochester Hills", "48362": "Rochester Hills",
  "garden city": "Westland", "48135": "Westland", "48136": "Westland",
  "inkster": "Westland", "48141": "Westland",
  "wayne": "Westland", "48184": "Westland",
  "redford": "Detroit", "48239": "Detroit", "48240": "Detroit",
  "taylor": "Dearborn", "48180": "Dearborn",
  "lincoln park": "Dearborn", "48146": "Dearborn",
  "allen park": "Dearborn", "48101": "Dearborn",
  "wyandotte": "Dearborn", "48192": "Dearborn",
  "roseville": "Warren", "48066": "Warren",
  "eastpointe": "Warren", "48021": "Warren",
  "st clair shores": "Warren", "48080": "Warren", "48081": "Warren", "48082": "Warren",
  "madison heights": "Royal Oak", "48071": "Royal Oak",
  "hazel park": "Royal Oak", "48030": "Royal Oak",
  "berkley": "Royal Oak", "48072": "Royal Oak",
  "clawson": "Royal Oak", "48017": "Royal Oak",
  "northville": "Plymouth", "48167": "Plymouth", "48168": "Plymouth",
  "wixom": "Novi", "48393": "Novi",
  "south lyon": "Novi", "48178": "Novi",
  "milford": "Novi", "48381": "Novi",
  "commerce": "Farmington Hills", "48382": "Farmington Hills", "48390": "Farmington Hills",
  "west bloomfield": "Farmington Hills", "48322": "Farmington Hills", "48323": "Farmington Hills", "48324": "Farmington Hills", "48325": "Farmington Hills",
  "bloomfield": "Birmingham", "48320": "Birmingham", "48321": "Birmingham",
  "belleville": "Ypsilanti", "48111": "Ypsilanti", "48112": "Ypsilanti",
  "saline": "Ann Arbor", "48176": "Ann Arbor",
  flint: "Flint", "48501": "Flint", "48502": "Flint", "48503": "Flint", "48504": "Flint", "48505": "Flint", "48506": "Flint", "48507": "Flint", "48509": "Flint",
  "burton": "Flint", "48519": "Flint", "48529": "Flint",
  "grand blanc": "Flint", "48439": "Flint",
  "fenton": "Flint", "48430": "Flint",
  lansing: "Lansing", "48901": "Lansing", "48906": "Lansing", "48910": "Lansing", "48911": "Lansing", "48912": "Lansing", "48915": "Lansing", "48917": "Lansing", "48924": "Lansing",
  "east lansing": "Lansing", "48823": "Lansing", "48824": "Lansing", "48825": "Lansing", "48826": "Lansing",
  "okemos": "Lansing", "48864": "Lansing",
  kalamazoo: "Kalamazoo", "49001": "Kalamazoo", "49002": "Kalamazoo", "49003": "Kalamazoo", "49004": "Kalamazoo", "49006": "Kalamazoo", "49007": "Kalamazoo", "49008": "Kalamazoo", "49009": "Kalamazoo",
  "portage": "Kalamazoo", "49024": "Kalamazoo",
  "grand rapids": "Grand Rapids", "49501": "Grand Rapids", "49503": "Grand Rapids", "49504": "Grand Rapids", "49505": "Grand Rapids", "49506": "Grand Rapids", "49507": "Grand Rapids", "49508": "Grand Rapids", "49509": "Grand Rapids", "49512": "Grand Rapids", "49525": "Grand Rapids", "49534": "Grand Rapids", "49546": "Grand Rapids",
  "wyoming": "Grand Rapids", "49519": "Grand Rapids",
  "kentwood": "Grand Rapids",
  // Ohio
  columbus: "Columbus", "43201": "Columbus", "43202": "Columbus", "43203": "Columbus", "43204": "Columbus", "43205": "Columbus", "43206": "Columbus", "43207": "Columbus", "43209": "Columbus", "43210": "Columbus", "43211": "Columbus", "43212": "Columbus", "43213": "Columbus", "43214": "Columbus", "43215": "Columbus", "43216": "Columbus", "43217": "Columbus", "43218": "Columbus", "43219": "Columbus", "43220": "Columbus", "43221": "Columbus", "43222": "Columbus", "43223": "Columbus", "43224": "Columbus", "43226": "Columbus", "43227": "Columbus", "43228": "Columbus", "43229": "Columbus", "43230": "Columbus", "43231": "Columbus", "43232": "Columbus", "43234": "Columbus", "43235": "Columbus", "43236": "Columbus", "43240": "Columbus",
  toledo: "Toledo", "43601": "Toledo", "43603": "Toledo", "43604": "Toledo", "43605": "Toledo", "43606": "Toledo", "43607": "Toledo", "43608": "Toledo", "43609": "Toledo", "43610": "Toledo", "43611": "Toledo", "43612": "Toledo", "43613": "Toledo", "43614": "Toledo", "43615": "Toledo", "43617": "Toledo", "43620": "Toledo", "43623": "Toledo", "43635": "Toledo",
  dublin: "Dublin", "43016": "Dublin", "43017": "Dublin",
  westerville: "Westerville", "43081": "Westerville", "43082": "Westerville",
  "bowling green": "Bowling Green", "43402": "Bowling Green", "43403": "Bowling Green",
  perrysburg: "Perrysburg", "43551": "Perrysburg", "43552": "Perrysburg",
  "hilliard": "Hilliard", "43026": "Hilliard",
  "grove city": "Columbus", "43123": "Columbus",
  "reynoldsburg": "Columbus", "43068": "Columbus",
  "gahanna": "Columbus",
  "upper arlington": "Columbus",
  "worthington": "Columbus", "43085": "Columbus",
  "powell": "Dublin", "43065": "Dublin",
  "delaware": "Dublin", "43015": "Dublin",
  "maumee": "Toledo", "43537": "Toledo",
  "sylvania": "Toledo", "43560": "Toledo",
  "oregon": "Toledo", "43616": "Toledo",
  "findlay": "Perrysburg", "45839": "Perrysburg", "45840": "Perrysburg",
  cleveland: "Cleveland", "44101": "Cleveland", "44102": "Cleveland", "44103": "Cleveland", "44104": "Cleveland", "44105": "Cleveland", "44106": "Cleveland", "44107": "Cleveland", "44108": "Cleveland", "44109": "Cleveland", "44110": "Cleveland", "44111": "Cleveland", "44112": "Cleveland", "44113": "Cleveland", "44114": "Cleveland", "44115": "Cleveland", "44118": "Cleveland", "44119": "Cleveland", "44120": "Cleveland", "44121": "Cleveland", "44125": "Cleveland", "44127": "Cleveland", "44128": "Cleveland", "44129": "Cleveland", "44130": "Cleveland", "44134": "Cleveland", "44135": "Cleveland",
  "parma": "Cleveland", "lakewood": "Cleveland", "euclid": "Cleveland",
  cincinnati: "Cincinnati", "45201": "Cincinnati", "45202": "Cincinnati", "45203": "Cincinnati", "45204": "Cincinnati", "45205": "Cincinnati", "45206": "Cincinnati", "45207": "Cincinnati", "45208": "Cincinnati", "45209": "Cincinnati", "45210": "Cincinnati", "45211": "Cincinnati", "45212": "Cincinnati", "45213": "Cincinnati", "45214": "Cincinnati", "45215": "Cincinnati", "45216": "Cincinnati", "45217": "Cincinnati", "45218": "Cincinnati", "45219": "Cincinnati", "45220": "Cincinnati", "45223": "Cincinnati", "45224": "Cincinnati", "45225": "Cincinnati", "45226": "Cincinnati", "45227": "Cincinnati", "45229": "Cincinnati", "45230": "Cincinnati", "45231": "Cincinnati", "45232": "Cincinnati", "45233": "Cincinnati", "45236": "Cincinnati", "45237": "Cincinnati", "45238": "Cincinnati", "45239": "Cincinnati", "45240": "Cincinnati", "45241": "Cincinnati", "45242": "Cincinnati", "45243": "Cincinnati", "45244": "Cincinnati", "45245": "Cincinnati", "45246": "Cincinnati", "45247": "Cincinnati", "45248": "Cincinnati", "45249": "Cincinnati", "45251": "Cincinnati", "45252": "Cincinnati",
  "mason": "Cincinnati", "45040": "Cincinnati",
  "west chester": "Cincinnati", "45069": "Cincinnati",
  dayton: "Dayton", "45401": "Dayton", "45402": "Dayton", "45403": "Dayton", "45404": "Dayton", "45405": "Dayton", "45406": "Dayton", "45409": "Dayton", "45410": "Dayton", "45414": "Dayton", "45415": "Dayton", "45416": "Dayton", "45417": "Dayton", "45419": "Dayton", "45420": "Dayton", "45424": "Dayton", "45426": "Dayton", "45428": "Dayton", "45429": "Dayton", "45430": "Dayton", "45431": "Dayton", "45432": "Dayton", "45433": "Dayton", "45439": "Dayton", "45440": "Dayton",
  "kettering": "Dayton", "beavercreek": "Dayton",
  akron: "Akron", "44301": "Akron", "44302": "Akron", "44303": "Akron", "44304": "Akron", "44305": "Akron", "44306": "Akron", "44307": "Akron", "44308": "Akron", "44310": "Akron", "44311": "Akron", "44312": "Akron", "44313": "Akron", "44314": "Akron", "44319": "Akron", "44320": "Akron",
  "canton oh": "Akron", "44701": "Akron", "44702": "Akron", "44703": "Akron", "44704": "Akron", "44705": "Akron", "44706": "Akron", "44707": "Akron", "44708": "Akron", "44709": "Akron", "44710": "Akron", "44711": "Akron", "44714": "Akron", "44718": "Akron", "44720": "Akron", "44721": "Akron",
};

/* ── ZIP prefix → state mapping for fallback ── */
const zipPrefixToState: Record<string, string> = {
  "480": "MI", "481": "MI", "482": "MI", "483": "MI", "484": "MI", "485": "MI", "486": "MI", "487": "MI", "488": "MI", "489": "MI", "490": "MI", "491": "MI", "492": "MI", "493": "MI", "494": "MI", "495": "MI", "496": "MI", "497": "MI", "498": "MI", "499": "MI",
  "430": "OH", "431": "OH", "432": "OH", "433": "OH", "434": "OH", "435": "OH", "436": "OH", "437": "OH", "438": "OH", "439": "OH", "440": "OH", "441": "OH", "442": "OH", "443": "OH", "444": "OH", "445": "OH", "446": "OH", "447": "OH", "448": "OH", "449": "OH", "450": "OH", "451": "OH", "452": "OH", "453": "OH", "454": "OH", "455": "OH", "456": "OH", "457": "OH", "458": "OH",
};

/* ── Coordinates for map centering ── */
const cityCoords: Record<string, { lat: number; lng: number }> = {
  Warren: { lat: 42.4897, lng: -83.0148 },
  Birmingham: { lat: 42.5467, lng: -83.2113 },
  Troy: { lat: 42.5803, lng: -83.1458 },
  "Sterling Heights": { lat: 42.5803, lng: -83.0302 },
  "Ann Arbor": { lat: 42.2808, lng: -83.7430 },
  Dearborn: { lat: 42.3223, lng: -83.1763 },
  Livonia: { lat: 42.3684, lng: -83.3527 },
  Detroit: { lat: 42.3314, lng: -83.0458 },
  Southfield: { lat: 42.4734, lng: -83.2219 },
  "Royal Oak": { lat: 42.4895, lng: -83.1446 },
  "Farmington Hills": { lat: 42.4853, lng: -83.3771 },
  Novi: { lat: 42.4801, lng: -83.4755 },
  Canton: { lat: 42.3087, lng: -83.4816 },
  Pontiac: { lat: 42.6389, lng: -83.2910 },
  "Rochester Hills": { lat: 42.6584, lng: -83.1499 },
  Westland: { lat: 42.3242, lng: -83.4002 },
  Plymouth: { lat: 42.3714, lng: -83.4702 },
  Ypsilanti: { lat: 42.2411, lng: -83.6130 },
  Flint: { lat: 43.0125, lng: -83.6875 },
  Lansing: { lat: 42.7325, lng: -84.5555 },
  Kalamazoo: { lat: 42.2917, lng: -85.5872 },
  "Grand Rapids": { lat: 42.9634, lng: -85.6681 },
  Columbus: { lat: 39.9612, lng: -82.9988 },
  Toledo: { lat: 41.6528, lng: -83.5379 },
  Dublin: { lat: 40.0992, lng: -83.1141 },
  Westerville: { lat: 40.1262, lng: -82.9291 },
  Hilliard: { lat: 40.0334, lng: -83.1585 },
  "Bowling Green": { lat: 41.3748, lng: -83.6513 },
  Perrysburg: { lat: 41.5570, lng: -83.6271 },
  Cleveland: { lat: 41.4993, lng: -81.6944 },
  Cincinnati: { lat: 39.1031, lng: -84.5120 },
  Dayton: { lat: 39.7589, lng: -84.1916 },
  Akron: { lat: 41.0814, lng: -81.5190 },
};

/* ── Resolve location input → { city, state } ── */
function resolveLocation(location: string): { city: string | null; state: string | null } {
  const loc = location.toLowerCase().trim();

  // 1. Exact match in locationMap
  for (const [key, city] of Object.entries(locationMap)) {
    if (loc.includes(key)) {
      return { city, state: null };
    }
  }

  // 2. ZIP prefix → state fallback
  const zip = loc.replace(/\D/g, "");
  if (zip.length >= 3) {
    const prefix = zip.substring(0, 3);
    const state = zipPrefixToState[prefix];
    if (state) {
      const defaultCity = state === "MI" ? "Detroit" : "Columbus";
      return { city: defaultCity, state };
    }
  }

  return { city: null, state: null };
}

/* ── Query providers from database ── */
async function findServiceProviders(
  supabase: ReturnType<typeof createClient>,
  params: { location: string; service_type: string; price_range?: string | null; vehicle_make?: string | null },
) {
  const { city, state } = resolveLocation(params.location);

  if (!city && !state) {
    return { providers: [], city: null };
  }

  // Build query
  let query = supabase
    .from("service_providers")
    .select("*")
    .eq("is_active", true);

  if (city) {
    query = query.eq("city", city);
  } else if (state) {
    query = query.eq("state", state);
  }

  if (params.price_range) {
    query = query.eq("price_tier", params.price_range);
  }

  const { data: providers, error } = await query.limit(50);

  if (error) {
    console.error("DB query error:", error);
    return { providers: [], city };
  }

  let results = providers || [];

  // Filter by service type
  if (params.service_type && params.service_type !== "general") {
    results = results.filter(
      (p: any) =>
        (p.specialties || []).includes(params.service_type) ||
        (p.specialties || []).includes("general"),
    );
  }

  // Sort: luxury vehicle → prioritize european/luxury specialists
  if (params.vehicle_make && LUXURY_BRANDS.includes(params.vehicle_make)) {
    results.sort((a: any, b: any) => {
      const aSpec = (a.specialties || []).includes("european") || (a.specialties || []).includes("luxury");
      const bSpec = (b.specialties || []).includes("european") || (b.specialties || []).includes("luxury");
      if (aSpec && !bSpec) return -1;
      if (!aSpec && bSpec) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });
  } else {
    results.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
  }

  return { providers: results.slice(0, 10), city };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.GENEROUS);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.GENEROUS.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } },
    );
  }

  try {
    const { location, service_type = "general", price_range, vehicle_make } = await req.json();

    if (!location || typeof location !== "string") {
      return new Response(JSON.stringify({ error: "Location (ZIP code or city) is required" }), {
        status: 400,
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { providers, city } = await findServiceProviders(supabase, { location, service_type, price_range, vehicle_make });

    const coords = city ? cityCoords[city] : cityCoords["Detroit"];
    const providersWithCoords = providers.map((p: any, i: number) => ({
      id: p.id,
      name: p.name,
      rating: p.rating,
      review_count: p.review_count,
      address: p.address,
      phone: p.phone,
      distance_miles: 0,
      specialties: p.specialties || [],
      price_tier: p.price_tier,
      response_time: p.response_time,
      availability: p.availability,
      wrenchli_verified: p.wrenchli_verified,
      quote_url: p.quote_url || `https://wrenchli.lovable.app/find-shops`,
      booking_url: p.booking_url,
      is_dealer: p.is_dealer || false,
      dealer_brands: p.dealer_brands || [],
      is_partnered: p.is_partnered ?? true,
      lat: p.lat ?? (coords ? coords.lat + (i * 0.008 - 0.02) * (i % 2 === 0 ? 1 : -1) : undefined),
      lng: p.lng ?? (coords ? coords.lng + (i * 0.006 - 0.015) * (i % 2 === 0 ? -1 : 1) : undefined),
    }));

    return new Response(
      JSON.stringify({
        providers: providersWithCoords,
        center: coords,
        results_count: providersWithCoords.length,
        location,
        city: city || "Service Area",
      }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("find-shops error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
