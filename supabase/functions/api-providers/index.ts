import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, BASE_URL } from "./types.ts";
import { findServiceProviders } from "./provider-search.ts";

/* ── Hash API key ── */
async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
        compare_quotes_url: `${BASE_URL}/vehicle-insights?location=${encodeURIComponent(location)}&service=${service_type}`,
        book_service_url: `${BASE_URL}/for-shops`,
        get_more_options_url: `${BASE_URL}/vehicle-insights?location=${encodeURIComponent(location)}`,
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
