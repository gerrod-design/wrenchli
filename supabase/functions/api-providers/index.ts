import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

/* ── Types ── */
interface ServiceProvider {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address: string;
  phone: string;
  distance_miles: number;
  specialties: string[];
  price_tier: "budget" | "mid" | "premium";
  response_time: string;
  availability: "same_day" | "next_day" | "within_week";
  wrenchli_verified: boolean;
  quote_url: string;
  booking_url?: string;
}

/* ── Hash API key ── */
async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Provider Database ── */
function getProvidersDatabase(): ServiceProvider[] {
  const baseUrl = "https://wrenchli.lovable.app";
  return [
    // Warren 48091
    {
      id: "warren_precision",
      name: "Precision Auto Repair",
      rating: 4.7,
      review_count: 143,
      address: "123 Main St, Warren, MI 48091",
      phone: "(586) 555-0123",
      distance_miles: 0,
      specialties: ["general", "engine", "brakes", "transmission"],
      price_tier: "mid",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=warren_precision`,
    },
    {
      id: "warren_auto_tech",
      name: "Auto Technology Inc",
      rating: 4.5,
      review_count: 89,
      address: "456 Van Dyke Ave, Warren, MI 48091",
      phone: "(586) 353-5700",
      distance_miles: 2,
      specialties: ["general", "domestic", "import"],
      price_tier: "mid",
      response_time: "4 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=warren_auto_tech`,
    },
    // Birmingham 48009
    {
      id: "birmingham_auto_europe",
      name: "Auto Europe",
      rating: 4.9,
      review_count: 156,
      address: "677 S Eton St, Birmingham, MI 48009",
      phone: "(248) 645-6300",
      distance_miles: 0,
      specialties: ["european", "luxury", "bmw", "mercedes", "audi"],
      price_tier: "premium",
      response_time: "1 hour",
      availability: "next_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=birmingham_auto_europe`,
    },
    {
      id: "birmingham_first_call",
      name: "First Call Auto",
      rating: 4.6,
      review_count: 78,
      address: "890 Maple Rd, Birmingham, MI 48009",
      phone: "(248) 555-0789",
      distance_miles: 1,
      specialties: ["european", "domestic", "general"],
      price_tier: "premium",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=birmingham_first_call`,
    },
    // Troy 48084
    {
      id: "troy_auto_pro",
      name: "Auto Pro",
      rating: 4.8,
      review_count: 234,
      address: "1234 Big Beaver Rd, Troy, MI 48084",
      phone: "(248) 555-0456",
      distance_miles: 0,
      specialties: ["general", "brakes", "electrical", "ac_service"],
      price_tier: "mid",
      response_time: "1 hour",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=troy_auto_pro`,
    },
    {
      id: "troy_auto_lab",
      name: "Auto Lab",
      rating: 4.4,
      review_count: 167,
      address: "5678 Rochester Rd, Troy, MI 48084",
      phone: "(248) 555-0321",
      distance_miles: 2,
      specialties: ["general", "oil_change", "brakes", "transmission"],
      price_tier: "mid",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=troy_auto_lab`,
    },
    // Sterling Heights 48315
    {
      id: "sterling_family_auto",
      name: "Sterling Family Auto Care",
      rating: 4.6,
      review_count: 198,
      address: "9012 Van Dyke Ave, Sterling Heights, MI 48315",
      phone: "(586) 555-0654",
      distance_miles: 0,
      specialties: ["general", "family_service", "brakes", "maintenance"],
      price_tier: "mid",
      response_time: "3 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=sterling_family_auto`,
    },
    // Ann Arbor 48104
    {
      id: "annarbor_student_auto",
      name: "A2 Student Auto Service",
      rating: 4.3,
      review_count: 156,
      address: "3456 Washtenaw Ave, Ann Arbor, MI 48104",
      phone: "(734) 555-0987",
      distance_miles: 0,
      specialties: ["general", "budget_friendly", "student_specials"],
      price_tier: "budget",
      response_time: "4 hours",
      availability: "next_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=annarbor_student_auto`,
    },
    {
      id: "annarbor_professional_auto",
      name: "Ann Arbor Professional Auto",
      rating: 4.7,
      review_count: 89,
      address: "7890 Plymouth Rd, Ann Arbor, MI 48104",
      phone: "(734) 555-0147",
      distance_miles: 3,
      specialties: ["general", "import", "luxury"],
      price_tier: "premium",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=annarbor_professional_auto`,
    },
    // Dearborn 48124
    {
      id: "dearborn_motor_city_auto",
      name: "Motor City Auto Works",
      rating: 4.8,
      review_count: 212,
      address: "2345 Michigan Ave, Dearborn, MI 48124",
      phone: "(313) 555-0234",
      distance_miles: 0,
      specialties: ["general", "domestic", "engine", "transmission"],
      price_tier: "mid",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=dearborn_motor_city_auto`,
    },
    {
      id: "dearborn_ford_country",
      name: "Ford Country Service Center",
      rating: 4.6,
      review_count: 178,
      address: "4567 Ford Rd, Dearborn, MI 48124",
      phone: "(313) 555-0567",
      distance_miles: 1,
      specialties: ["domestic", "ford", "general", "electrical"],
      price_tier: "mid",
      response_time: "3 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=dearborn_ford_country`,
    },
    {
      id: "dearborn_value_auto",
      name: "Value Auto Repair",
      rating: 4.4,
      review_count: 134,
      address: "6789 Telegraph Rd, Dearborn, MI 48124",
      phone: "(313) 555-0891",
      distance_miles: 2,
      specialties: ["general", "brakes", "oil_change", "budget_friendly"],
      price_tier: "budget",
      response_time: "4 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=dearborn_value_auto`,
    },
    // Livonia 48150
    {
      id: "livonia_suburban_auto",
      name: "Suburban Auto Care",
      rating: 4.7,
      review_count: 189,
      address: "12345 Middlebelt Rd, Livonia, MI 48150",
      phone: "(734) 555-0345",
      distance_miles: 0,
      specialties: ["general", "family_service", "brakes", "maintenance"],
      price_tier: "mid",
      response_time: "2 hours",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=livonia_suburban_auto`,
    },
    {
      id: "livonia_euro_tech",
      name: "Euro Tech Auto Specialists",
      rating: 4.8,
      review_count: 145,
      address: "23456 Plymouth Rd, Livonia, MI 48150",
      phone: "(734) 555-0678",
      distance_miles: 2,
      specialties: ["european", "luxury", "bmw", "mercedes", "volkswagen"],
      price_tier: "premium",
      response_time: "1 hour",
      availability: "next_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=livonia_euro_tech`,
    },
    {
      id: "livonia_quick_lane",
      name: "Quick Lane Livonia",
      rating: 4.3,
      review_count: 267,
      address: "34567 Seven Mile Rd, Livonia, MI 48150",
      phone: "(734) 555-0912",
      distance_miles: 3,
      specialties: ["general", "oil_change", "tires", "budget_friendly"],
      price_tier: "budget",
      response_time: "1 hour",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: `${baseUrl}/vehicle-insights?shop=livonia_quick_lane`,
    },
  ];
}

/* ── Location Filter ── */
function filterByLocation(
  providers: ServiceProvider[],
  location: string,
): ServiceProvider[] {
  const loc = location.toLowerCase();
  const locationMap: Record<string, string> = {
    warren: "Warren",
    "48091": "Warren",
    birmingham: "Birmingham",
    "48009": "Birmingham",
    troy: "Troy",
    "48084": "Troy",
    sterling: "Sterling Heights",
    "48315": "Sterling Heights",
    "ann arbor": "Ann Arbor",
    "48104": "Ann Arbor",
    dearborn: "Dearborn",
    "48124": "Dearborn",
    livonia: "Livonia",
    "48150": "Livonia",
  };

  for (const [key, city] of Object.entries(locationMap)) {
    if (loc.includes(key)) {
      return providers.filter((p) => p.address.includes(city));
    }
  }
  return providers; // Return all for unknown locations
}

/* ── Provider Search ── */
function findServiceProviders(params: {
  location: string;
  service_type: string;
  radius_miles: number;
  price_range: string | null;
  vehicle_make: string | null;
}): ServiceProvider[] {
  let results = filterByLocation(getProvidersDatabase(), params.location);

  if (params.price_range) {
    results = results.filter((p) => p.price_tier === params.price_range);
  }

  if (params.service_type && params.service_type !== "general") {
    results = results.filter(
      (p) =>
        p.specialties.includes(params.service_type) ||
        p.specialties.includes("general"),
    );
  }

  const luxuryBrands = ["BMW", "Mercedes-Benz", "Audi", "Lexus"];
  if (params.vehicle_make && luxuryBrands.includes(params.vehicle_make)) {
    results.sort((a, b) => {
      const aSpec = a.specialties.includes("european") || a.specialties.includes("luxury");
      const bSpec = b.specialties.includes("european") || b.specialties.includes("luxury");
      if (aSpec && !bSpec) return -1;
      if (!aSpec && bSpec) return 1;
      return b.rating - a.rating;
    });
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results.slice(0, 8);
}

/* ── Handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use GET." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // --- Auth ---
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing API key. Include x-api-key header." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const keyHash = await hashApiKey(apiKey);

  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys")
    .select("id, is_active, rate_limit_per_minute")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyError || !keyRecord) {
    return new Response(JSON.stringify({ error: "Invalid API key." }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!keyRecord.is_active) {
    return new Response(JSON.stringify({ error: "API key is deactivated." }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Rate Limiting ---
  const windowStart = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("api_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key_hash", keyHash)
    .gte("requested_at", windowStart);

  if ((count ?? 0) >= keyRecord.rate_limit_per_minute) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded.",
        limit_per_minute: keyRecord.rate_limit_per_minute,
        retry_after_seconds: 60,
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } },
    );
  }

  supabase.from("api_rate_limits").insert({ key_hash: keyHash }).then(() => {});
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then(() => {});
  if (Math.random() < 0.05) supabase.rpc("cleanup_old_rate_limits").then(() => {});

  // --- Process ---
  const requestStart = Date.now();
  try {
    const url = new URL(req.url);
    const location = url.searchParams.get("location");
    const service_type = url.searchParams.get("service_type") || "general";
    const radius_miles = parseInt(url.searchParams.get("radius_miles") || "25", 10);
    const price_range = url.searchParams.get("price_range");
    const vehicle_make = url.searchParams.get("vehicle_make");

    if (!location) {
      return new Response(
        JSON.stringify({ error: "Location parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const providers = findServiceProviders({
      location,
      service_type,
      radius_miles,
      price_range,
      vehicle_make,
    });

    const baseUrl = "https://wrenchli.lovable.app";
    const response = {
      providers,
      search_params: {
        location,
        service_type,
        radius_miles,
        price_range,
        vehicle_make,
        results_count: providers.length,
      },
      wrenchli_services: {
        compare_quotes_url: `${baseUrl}/vehicle-insights?location=${encodeURIComponent(location)}&service=${service_type}`,
        book_service_url: `${baseUrl}/for-shops`,
        get_more_options_url: `${baseUrl}/vehicle-insights?location=${encodeURIComponent(location)}`,
      },
    };

    // Log request
    supabase.from("api_request_logs").insert({
      endpoint: "api-providers",
      key_hash: keyHash,
      diagnosis_title: service_type,
      zip_code: location,
      vehicle_make: vehicle_make || null,
      response_status: 200,
      response_time_ms: Date.now() - requestStart,
    }).then(() => {});

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("api-providers error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
