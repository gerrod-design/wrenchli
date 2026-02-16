import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

/* ── MSRP Database ── */
const MSRP_DATABASE: Record<string, number> = {
  "Honda-Accord-2024": 27295, "Honda-Accord-2023": 26120, "Honda-Accord-2022": 25100, "Honda-Accord-2021": 24970, "Honda-Accord-2020": 24020, "Honda-Accord-2019": 24020,
  "Honda-Civic-2024": 25050, "Honda-Civic-2023": 24100, "Honda-Civic-2022": 23100, "Honda-Civic-2021": 22550, "Honda-Civic-2020": 21250, "Honda-Civic-2019": 20345,
  "Honda-CR-V-2024": 33200, "Honda-CR-V-2023": 32350, "Honda-CR-V-2022": 31100, "Honda-CR-V-2021": 30100, "Honda-CR-V-2020": 28945, "Honda-CR-V-2019": 25350,
  "Toyota-Camry-2024": 26320, "Toyota-Camry-2023": 25295, "Toyota-Camry-2022": 24425, "Toyota-Camry-2021": 24970, "Toyota-Camry-2020": 24095, "Toyota-Camry-2019": 24095,
  "Toyota-Corolla-2024": 24255, "Toyota-Corolla-2023": 23195, "Toyota-Corolla-2022": 22195, "Toyota-Corolla-2021": 21550, "Toyota-Corolla-2020": 20430, "Toyota-Corolla-2019": 19600,
  "Toyota-RAV4-2024": 31080, "Toyota-RAV4-2023": 29825, "Toyota-RAV4-2022": 28500, "Toyota-RAV4-2021": 27325, "Toyota-RAV4-2020": 26350, "Toyota-RAV4-2019": 26545,
  "Ford-F-150-2024": 37240, "Ford-F-150-2023": 35290, "Ford-F-150-2022": 33695, "Ford-F-150-2021": 31895, "Ford-F-150-2020": 28745, "Ford-F-150-2019": 28155,
  "Ford-Escape-2024": 27170, "Ford-Escape-2023": 26080, "Ford-Escape-2022": 25200, "Ford-Escape-2021": 24885, "Ford-Escape-2020": 24885, "Ford-Escape-2019": 25200,
  "Ford-Explorer-2024": 36760, "Ford-Explorer-2023": 35650, "Ford-Explorer-2022": 33245, "Ford-Explorer-2021": 32765, "Ford-Explorer-2020": 32765,
  "Chevrolet-Silverado-2024": 36200, "Chevrolet-Silverado-2023": 34600, "Chevrolet-Silverado-2022": 32220, "Chevrolet-Silverado-2021": 30400, "Chevrolet-Silverado-2020": 28300,
  "Chevrolet-Equinox-2024": 27200, "Chevrolet-Equinox-2023": 26600, "Chevrolet-Equinox-2022": 25800, "Chevrolet-Equinox-2021": 24995, "Chevrolet-Equinox-2020": 23800,
  "Chevrolet-Malibu-2024": 25100, "Chevrolet-Malibu-2023": 24200, "Chevrolet-Malibu-2022": 23220, "Chevrolet-Malibu-2021": 22270, "Chevrolet-Malibu-2020": 22140,
  "Nissan-Altima-2024": 25080, "Nissan-Altima-2023": 24300, "Nissan-Altima-2022": 23550, "Nissan-Altima-2021": 24400, "Nissan-Altima-2020": 24200, "Nissan-Altima-2019": 24100,
  "Nissan-Rogue-2024": 27360, "Nissan-Rogue-2023": 26745, "Nissan-Rogue-2022": 25850, "Nissan-Rogue-2021": 25650, "Nissan-Rogue-2020": 25300, "Nissan-Rogue-2019": 26260,
  "Nissan-Sentra-2024": 20680, "Nissan-Sentra-2023": 19460, "Nissan-Sentra-2022": 18940, "Nissan-Sentra-2021": 19090, "Nissan-Sentra-2020": 17990,
  "Hyundai-Elantra-2024": 22750, "Hyundai-Elantra-2023": 21600, "Hyundai-Elantra-2022": 20350, "Hyundai-Elantra-2021": 19650, "Hyundai-Elantra-2020": 19300, "Hyundai-Elantra-2019": 17985,
  "Hyundai-Tucson-2024": 27700, "Hyundai-Tucson-2023": 26400, "Hyundai-Tucson-2022": 25350, "Hyundai-Tucson-2021": 24950, "Hyundai-Tucson-2020": 23700, "Hyundai-Tucson-2019": 23550,
  "Hyundai-Santa Fe-2024": 33900, "Hyundai-Santa Fe-2023": 32200, "Hyundai-Santa Fe-2022": 30800, "Hyundai-Santa Fe-2021": 28200, "Hyundai-Santa Fe-2020": 26900,
  "Kia-Forte-2024": 19490, "Kia-Forte-2023": 18890, "Kia-Forte-2022": 17890, "Kia-Forte-2021": 17790, "Kia-Forte-2020": 17890, "Kia-Forte-2019": 17690,
  "Kia-Sorento-2024": 31990, "Kia-Sorento-2023": 30990, "Kia-Sorento-2022": 29990, "Kia-Sorento-2021": 29590, "Kia-Sorento-2020": 27060, "Kia-Sorento-2019": 26290,
  "Subaru-Outback-2024": 30090, "Subaru-Outback-2023": 29295, "Subaru-Outback-2022": 28070, "Subaru-Outback-2021": 27655, "Subaru-Outback-2020": 27655, "Subaru-Outback-2019": 26795,
  "Mazda-CX-5-2024": 28250, "Mazda-CX-5-2023": 26700, "Mazda-CX-5-2022": 26100, "Mazda-CX-5-2021": 25370, "Mazda-CX-5-2020": 25190, "Mazda-CX-5-2019": 25345,
  "Jeep-Grand Cherokee-2024": 38995, "Jeep-Grand Cherokee-2023": 37545, "Jeep-Grand Cherokee-2022": 36290, "Jeep-Grand Cherokee-2021": 33090, "Jeep-Grand Cherokee-2020": 33090, "Jeep-Grand Cherokee-2019": 32195,
  "BMW-3 Series-2024": 43800, "BMW-3 Series-2023": 43000, "BMW-3 Series-2022": 41450, "BMW-3 Series-2021": 41250, "BMW-3 Series-2020": 41250, "BMW-3 Series-2019": 40250,
  "Mercedes-Benz-C-Class-2024": 44600, "Mercedes-Benz-C-Class-2023": 43550, "Mercedes-Benz-C-Class-2022": 43050, "Mercedes-Benz-C-Class-2021": 42650, "Mercedes-Benz-C-Class-2020": 42650, "Mercedes-Benz-C-Class-2019": 41400,
  "Tesla-Model 3-2024": 38990, "Tesla-Model 3-2023": 40240, "Tesla-Model 3-2022": 46990, "Tesla-Model 3-2021": 37990, "Tesla-Model 3-2020": 37990, "Tesla-Model 3-2019": 35000,
};

const BRAND_AVERAGES: Record<string, number> = {
  Honda: 28000, Toyota: 29000, Ford: 32000, Chevrolet: 31000,
  BMW: 45000, "Mercedes-Benz": 52000, Audi: 48000, Nissan: 26000,
  Hyundai: 24000, Kia: 23000, Subaru: 29000, Mazda: 27000,
  Volkswagen: 30000, Jeep: 34000, Ram: 36000, GMC: 38000,
  Dodge: 30000, Lexus: 42000, Acura: 37000, Infiniti: 40000,
  Buick: 32000, Cadillac: 46000, Lincoln: 48000, Volvo: 42000,
  Tesla: 45000, Chrysler: 30000,
};

const RELIABLE_BRANDS = ["Honda", "Toyota", "Mazda", "Subaru"];
const LESS_RELIABLE_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Jaguar", "Land Rover"];

function estimateMSRP(make: string, model: string, year: number): number {
  const key = `${make}-${model}-${year}`;
  if (MSRP_DATABASE[key]) return MSRP_DATABASE[key];
  const base = BRAND_AVERAGES[make] ?? 30000;
  return Math.max(base + (year - 2020) * 1000, 15000);
}

function estimateValue(make: string, model: string, year: number, mileage: number) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const baseMSRP = estimateMSRP(make, model, year);

  let depRate = 0;
  if (age >= 1) depRate += 0.20;
  if (age >= 2) depRate += 0.15;
  if (age >= 3) depRate += Math.min(age - 2, 5) * 0.10;
  if (age > 7) depRate += (age - 7) * 0.05;
  const ageDepreciation = baseMSRP * Math.min(depRate, 0.85);

  const expectedMileage = age * 12000;
  const mileageAdjustment = (mileage - expectedMileage) * 0.15;
  const regionalAdjustment = baseMSRP * 0.02;

  const currentValue = Math.max(
    Math.round(baseMSRP - ageDepreciation - mileageAdjustment - regionalAdjustment),
    500,
  );

  const marketTrend: "up" | "down" | "stable" = age <= 3 ? "stable" : age >= 10 ? "down" : "stable";
  const optimalSellWindow = age >= 5 && age <= 8 && mileage < 100000;

  return {
    current_value: currentValue,
    confidence: 85,
    breakdown: {
      base_msrp: Math.round(baseMSRP),
      age_depreciation: Math.round(ageDepreciation),
      mileage_adjustment: Math.round(mileageAdjustment),
      regional_adjustment: Math.round(regionalAdjustment),
    },
    market_trend: marketTrend,
    optimal_sell_window: optimalSellWindow,
  };
}

function analyzeRepairVsReplace(
  vehicleValue: number,
  repairCost: number,
  year: number,
  mileage: number,
  make: string,
) {
  const age = new Date().getFullYear() - year;
  const costRatio = repairCost / vehicleValue;
  const repairPercentage = Math.round(costRatio * 100);

  let threshold = 0.20;
  if (age <= 3) threshold = 0.25;
  if (age >= 9) threshold = 0.15;
  if (mileage > 100000) threshold = 0.12;
  if (age >= 12) threshold = 0.10;
  if (RELIABLE_BRANDS.includes(make)) threshold += 0.03;
  if (LESS_RELIABLE_BRANDS.includes(make) && age > 7) threshold -= 0.03;

  let recommendation: "repair_recommended" | "consider_replacement" | "replace_recommended";
  let reasoning: string;

  if (costRatio < threshold * 0.6) {
    recommendation = "repair_recommended";
    reasoning = `At ${repairPercentage}% of vehicle value, this repair is financially sound and will extend your vehicle's life significantly.`;
  } else if (costRatio < threshold) {
    recommendation = "repair_recommended";
    reasoning = `At ${repairPercentage}% of vehicle value, repair is still the better financial choice, though you should consider your long-term vehicle plans.`;
  } else if (costRatio < threshold * 1.5) {
    recommendation = "consider_replacement";
    reasoning = `At ${repairPercentage}% of vehicle value, you should compare repair costs against upgrading to a newer, more reliable vehicle.`;
  } else {
    recommendation = "replace_recommended";
    reasoning = `At ${repairPercentage}% of vehicle value, replacement would likely provide better long-term value and reliability.`;
  }

  return { repair_percentage: repairPercentage, recommendation, reasoning };
}

/* ── Hash API key ── */
async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── Handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Auth ---
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key. Include x-api-key header." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({
      error: "Rate limit exceeded.", limit_per_minute: keyRecord.rate_limit_per_minute, retry_after_seconds: 60,
    }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } });
  }

  supabase.from("api_rate_limits").insert({ key_hash: keyHash }).then(() => {});
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then(() => {});
  if (Math.random() < 0.05) supabase.rpc("cleanup_old_rate_limits").then(() => {});

  // --- Process ---
  const requestStart = Date.now();
  try {
    const body = await req.json();
    const { vehicle, repair_cost } = body;

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model || !vehicle.mileage) {
      return new Response(JSON.stringify({ error: "Vehicle year, make, model, and mileage are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (vehicle.year < 1990 || vehicle.year > new Date().getFullYear() + 1) {
      return new Response(JSON.stringify({ error: "Invalid vehicle year" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (vehicle.mileage < 0 || vehicle.mileage > 500000) {
      return new Response(JSON.stringify({ error: "Invalid mileage" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valuation = estimateValue(vehicle.make, vehicle.model, vehicle.year, vehicle.mileage);

    let tradeVsRepair = undefined;
    if (repair_cost && repair_cost > 0) {
      tradeVsRepair = analyzeRepairVsReplace(
        valuation.current_value, repair_cost, vehicle.year, vehicle.mileage, vehicle.make,
      );
    }

    const baseUrl = "https://wrenchli.lovable.app";
    const response = {
      current_value: valuation.current_value,
      confidence: valuation.confidence,
      value_breakdown: valuation.breakdown,
      market_analysis: {
        trend: valuation.market_trend,
        optimal_sell_window: valuation.optimal_sell_window,
        trade_vs_repair: tradeVsRepair,
      },
      wrenchli_services: {
        detailed_analysis_url: `${baseUrl}/garage`,
        get_quotes_url: `${baseUrl}/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`,
        garage_management_url: `${baseUrl}/garage`,
      },
    };

    // Log request
    supabase.from("api_request_logs").insert({
      endpoint: "api-vehicle-value",
      key_hash: keyHash,
      diagnosis_title: tradeVsRepair?.recommendation ?? null,
      vehicle_year: String(vehicle.year),
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      zip_code: vehicle.zipCode || null,
      response_status: 200,
      response_time_ms: Date.now() - requestStart,
      cost_low: valuation.current_value,
      cost_high: repair_cost || null,
    }).then(() => {});

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("api-vehicle-value error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
