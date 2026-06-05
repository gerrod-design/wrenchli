import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const YELP_API_BASE = "https://api.yelp.com/v3";

interface YelpBusiness {
  id: string;
  name: string;
  phone: string;
  rating: number;
  review_count: number;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: { alias: string; title: string }[];
  price?: string;
}

function priceTierFromYelp(price?: string): string {
  if (!price) return "mid";
  if (price === "$") return "budget";
  if (price === "$$") return "mid";
  return "premium";
}

const FRANCHISE_PATTERNS = [
  'firestone', 'aamco', 'meineke', 'jiffy lube', 'midas',
  'pep boys', 'pepboys', 'valvoline', 'take 5', 'maaco',
  'safelite', 'tuffy', 'goodyear', 'ntb ', 'national tire',
  'big o tire', 'les schwab', 'christian brothers',
  'grease monkey', 'express oil', 'pennzoil', 'brake masters',
  'sun devil', 'monro ', 'tire kingdom', 'tires plus',
  'sullivan tire', 'belle tire', 'discount tire',
  'napa autocare', 'precision tune', 'car-x', 'speedy auto',
  'sears auto', 'walmart auto',
];

function isFranchise(name: string): boolean {
  const lower = name.toLowerCase();
  return FRANCHISE_PATTERNS.some((p) => lower.includes(p));
}

function specialtiesFromCategories(
  cats: { alias: string; title: string }[]
): string[] {
  return cats.map((c) => c.title).slice(0, 5);
}

Deno.serve(async (req) => {
  const optResp = handleCorsOptions(req);
  if (optResp) return optResp;

  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Internal-only: cron/function-to-function callers must present INTERNAL_SECRET
  const internalSecret = Deno.env.get('INTERNAL_SECRET');
  const callerSecret = req.headers.get('x-internal-secret');
  if (!internalSecret || callerSecret !== internalSecret) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    const YELP_API_KEY = Deno.env.get("YELP_API_KEY");
    if (!YELP_API_KEY) {
      throw new Error("YELP_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { zip_code, state, limit = 50 } = body;

    if (!zip_code && !state) {
      return new Response(
        JSON.stringify({ error: "zip_code or state is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const location = zip_code || state;
    const searchLimit = Math.min(limit, 50);
    const categories = "autorepair,transmissionrepair,auto_detailing,tires,oilchange";

    const url = `${YELP_API_BASE}/businesses/search?location=${encodeURIComponent(location)}&categories=${categories}&limit=${searchLimit}&sort_by=rating`;

    const yelpRes = await fetch(url, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });

    if (!yelpRes.ok) {
      const errText = await yelpRes.text();
      throw new Error(`Yelp API error [${yelpRes.status}]: ${errText}`);
    }

    const yelpData = await yelpRes.json();
    const businesses: YelpBusiness[] = yelpData.businesses || [];

    const qualified = businesses.filter(
      (b) =>
        b.phone &&
        b.location?.address1 &&
        b.rating !== undefined &&
        b.rating >= 3.0
    );

    const rows = qualified.map((b) => ({
      name: b.name,
      address: b.location.address1,
      city: b.location.city || null,
      state: b.location.state || null,
      zip_code: b.location.zip_code,
      phone: b.phone,
      lat: b.coordinates?.latitude || null,
      lng: b.coordinates?.longitude || null,
      rating: b.rating,
      review_count: b.review_count || 0,
      specialties: specialtiesFromCategories(b.categories),
      price_tier: priceTierFromYelp(b.price),
      is_dealer: false,
      is_partnered: false,
      is_franchise: isFranchise(b.name),
    }));

    let inserted = 0;
    if (rows.length > 0) {
      const { error: insertErr, count } = await supabase
        .from("service_providers")
        .upsert(rows, { onConflict: "name,address,zip_code", count: "exact" });
      if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);
      inserted = count ?? rows.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        fetched: businesses.length,
        qualified: qualified.length,
        inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("ingest-yelp-shops error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
