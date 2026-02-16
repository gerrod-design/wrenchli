import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

/* ── Maintenance Schedule Database ── */
interface MaintenanceItem {
  type: string;
  label: string;
  interval_miles: number;
  interval_months: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  priority: "essential" | "recommended" | "optional";
  description: string;
}

const MAINTENANCE_SCHEDULE: MaintenanceItem[] = [
  { type: "oil_change", label: "Oil Change", interval_miles: 5000, interval_months: 6, estimated_cost_low: 30, estimated_cost_high: 75, priority: "essential", description: "Replace engine oil and filter to maintain engine health." },
  { type: "tire_rotation", label: "Tire Rotation", interval_miles: 7500, interval_months: 12, estimated_cost_low: 25, estimated_cost_high: 50, priority: "recommended", description: "Even out tire wear for longer tire life and better handling." },
  { type: "brake_inspection", label: "Brake Inspection", interval_miles: 15000, interval_months: 12, estimated_cost_low: 0, estimated_cost_high: 50, priority: "essential", description: "Check brake pad thickness, rotors, and fluid level." },
  { type: "air_filter", label: "Engine Air Filter", interval_miles: 15000, interval_months: 24, estimated_cost_low: 15, estimated_cost_high: 40, priority: "recommended", description: "Replace engine air filter for optimal fuel efficiency." },
  { type: "cabin_filter", label: "Cabin Air Filter", interval_miles: 15000, interval_months: 12, estimated_cost_low: 15, estimated_cost_high: 35, priority: "optional", description: "Replace cabin air filter for clean air inside the vehicle." },
  { type: "transmission_service", label: "Transmission Service", interval_miles: 60000, interval_months: 60, estimated_cost_low: 150, estimated_cost_high: 400, priority: "essential", description: "Replace transmission fluid to protect internal components." },
  { type: "coolant_flush", label: "Coolant Flush", interval_miles: 30000, interval_months: 36, estimated_cost_low: 100, estimated_cost_high: 200, priority: "recommended", description: "Replace coolant to prevent overheating and corrosion." },
  { type: "spark_plugs", label: "Spark Plug Replacement", interval_miles: 60000, interval_months: 60, estimated_cost_low: 100, estimated_cost_high: 300, priority: "essential", description: "Replace spark plugs for proper combustion and fuel economy." },
  { type: "battery_check", label: "Battery Check", interval_miles: 30000, interval_months: 24, estimated_cost_low: 0, estimated_cost_high: 25, priority: "recommended", description: "Test battery health and clean terminals." },
  { type: "serpentine_belt", label: "Serpentine Belt", interval_miles: 60000, interval_months: 60, estimated_cost_low: 100, estimated_cost_high: 200, priority: "essential", description: "Inspect and replace serpentine belt to prevent breakdowns." },
];

/* ── Brand-specific adjustments ── */
const BRAND_INTERVALS: Record<string, Record<string, Partial<MaintenanceItem>>> = {
  BMW: {
    oil_change: { interval_miles: 10000, estimated_cost_low: 80, estimated_cost_high: 150 },
    brake_inspection: { estimated_cost_low: 50, estimated_cost_high: 120 },
    spark_plugs: { estimated_cost_low: 250, estimated_cost_high: 500 },
  },
  "Mercedes-Benz": {
    oil_change: { interval_miles: 10000, estimated_cost_low: 90, estimated_cost_high: 160 },
    spark_plugs: { estimated_cost_low: 280, estimated_cost_high: 550 },
  },
  Audi: {
    oil_change: { interval_miles: 10000, estimated_cost_low: 80, estimated_cost_high: 145 },
    spark_plugs: { estimated_cost_low: 250, estimated_cost_high: 480 },
  },
  Tesla: {
    oil_change: { interval_miles: 0, label: "N/A (Electric)", estimated_cost_low: 0, estimated_cost_high: 0 },
    spark_plugs: { interval_miles: 0, label: "N/A (Electric)", estimated_cost_low: 0, estimated_cost_high: 0 },
    serpentine_belt: { interval_miles: 0, label: "N/A (Electric)", estimated_cost_low: 0, estimated_cost_high: 0 },
    transmission_service: { interval_miles: 0, label: "N/A (Electric)", estimated_cost_low: 0, estimated_cost_high: 0 },
  },
};

function getScheduleForVehicle(make: string): MaintenanceItem[] {
  const overrides = BRAND_INTERVALS[make] ?? {};
  return MAINTENANCE_SCHEDULE
    .map((item) => {
      const override = overrides[item.type];
      if (override) {
        const merged = { ...item, ...override };
        if (merged.interval_miles === 0) return null; // skip N/A items
        return merged;
      }
      return item;
    })
    .filter((item): item is MaintenanceItem => item !== null);
}

interface UpcomingItem {
  type: string;
  label: string;
  due_mileage: number;
  miles_until_due: number;
  priority: "overdue" | "urgent" | "soon" | "upcoming";
  estimated_cost_low: number;
  estimated_cost_high: number;
  description: string;
}

function getUpcoming(
  schedule: MaintenanceItem[],
  currentMileage: number,
  lastServices: { type: string; mileage: number }[],
): UpcomingItem[] {
  return schedule
    .map((item) => {
      const last = lastServices.find((s) => s.type === item.type);
      const lastMileage = last?.mileage ?? 0;
      const dueMileage = lastMileage + item.interval_miles;
      const milesUntilDue = dueMileage - currentMileage;

      let priority: UpcomingItem["priority"];
      if (milesUntilDue < 0) priority = "overdue";
      else if (milesUntilDue <= 1000) priority = "urgent";
      else if (milesUntilDue <= 3000) priority = "soon";
      else priority = "upcoming";

      return {
        type: item.type,
        label: item.label,
        due_mileage: dueMileage,
        miles_until_due: milesUntilDue,
        priority,
        estimated_cost_low: item.estimated_cost_low,
        estimated_cost_high: item.estimated_cost_high,
        description: item.description,
      };
    })
    .sort((a, b) => a.miles_until_due - b.miles_until_due);
}

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
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
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
    return new Response(
      JSON.stringify({ error: "Invalid API key." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!keyRecord.is_active) {
    return new Response(
      JSON.stringify({ error: "API key is deactivated." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
    const body = await req.json();
    const { vehicle, last_services } = body;

    if (!vehicle || !vehicle.make || !vehicle.mileage) {
      return new Response(
        JSON.stringify({ error: "Vehicle make and mileage are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (vehicle.mileage < 0 || vehicle.mileage > 500000) {
      return new Response(
        JSON.stringify({ error: "Invalid mileage (0–500,000)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const schedule = getScheduleForVehicle(vehicle.make);
    const upcoming = getUpcoming(schedule, vehicle.mileage, last_services ?? []);

    const overdueCount = upcoming.filter((u) => u.priority === "overdue").length;
    const urgentCount = upcoming.filter((u) => u.priority === "urgent").length;

    const totalCostLow = upcoming.reduce((s, u) => s + u.estimated_cost_low, 0);
    const totalCostHigh = upcoming.reduce((s, u) => s + u.estimated_cost_high, 0);

    const baseUrl = "https://wrenchli.lovable.app";
    const response = {
      vehicle_summary: {
        make: vehicle.make,
        model: vehicle.model ?? null,
        year: vehicle.year ?? null,
        mileage: vehicle.mileage,
      },
      full_schedule: schedule.map((s) => ({
        type: s.type,
        label: s.label,
        interval_miles: s.interval_miles,
        interval_months: s.interval_months,
        estimated_cost_low: s.estimated_cost_low,
        estimated_cost_high: s.estimated_cost_high,
        priority: s.priority,
        description: s.description,
      })),
      upcoming_services: upcoming,
      summary: {
        total_items: upcoming.length,
        overdue_count: overdueCount,
        urgent_count: urgentCount,
        estimated_total_cost_low: totalCostLow,
        estimated_total_cost_high: totalCostHigh,
      },
      wrenchli_services: {
        garage_url: `${baseUrl}/garage`,
        vehicle_insights_url: `${baseUrl}/vehicle-insights`,
      },
    };

    // Log request
    supabase
      .from("api_request_logs")
      .insert({
        endpoint: "api-maintenance-schedule",
        key_hash: keyHash,
        diagnosis_title: `${overdueCount} overdue, ${urgentCount} urgent`,
        vehicle_year: vehicle.year ? String(vehicle.year) : null,
        vehicle_make: vehicle.make,
        vehicle_model: vehicle.model ?? null,
        response_status: 200,
        response_time_ms: Date.now() - requestStart,
        cost_low: totalCostLow,
        cost_high: totalCostHigh,
      })
      .then(() => {});

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("api-maintenance-schedule error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
