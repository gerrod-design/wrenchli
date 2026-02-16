import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiagnoseRequest {
  symptoms: string[];
  vehicle: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
  };
  location?: string;
}

/**
 * Basic pattern-matching for fast local diagnosis.
 * Falls back to the AI-powered /diagnose function for richer results.
 */
function analyzeSymptoms(symptoms: string[], vehicle: { year: number; make: string; model: string }) {
  const text = symptoms.join(" ").toLowerCase();

  if (text.includes("grinding") || text.includes("brake")) {
    return {
      issue: "Brake System Issue",
      description:
        "Grinding noises typically indicate worn brake pads that need replacement. This can damage rotors if not addressed promptly.",
      urgency: "high" as const,
      cost_estimate: { min: 200, max: 600 },
      action: "Schedule brake inspection within 48 hours",
      safety: "Avoid heavy braking and increase following distance",
      diy_possible: false,
    };
  }

  if (text.includes("check engine") || text.includes("engine light")) {
    return {
      issue: "Engine Diagnostic Needed",
      description:
        "Check engine light indicates a system malfunction. Could range from a loose gas cap to serious engine issues.",
      urgency: "medium" as const,
      cost_estimate: { min: 100, max: 800 },
      action: "Get diagnostic scan to identify specific issue",
      safety: "Safe to drive short distances, avoid hard acceleration",
      diy_possible: true,
    };
  }

  if (text.includes("oil") || text.includes("leak")) {
    return {
      issue: "Oil System Issue",
      description:
        "Oil leaks can lead to engine damage if oil levels drop too low. Check oil level immediately.",
      urgency: "medium" as const,
      cost_estimate: { min: 50, max: 300 },
      action: "Check oil level and look for leak source",
      safety: "Check oil level before driving",
      diy_possible: true,
    };
  }

  if (text.includes("overheat") || text.includes("temperature") || text.includes("coolant") || text.includes("steam")) {
    return {
      issue: "Engine Overheating",
      description:
        "Your engine is running hotter than it should. This can cause permanent engine damage if not addressed immediately.",
      urgency: "high" as const,
      cost_estimate: { min: 150, max: 800 },
      action: "Pull over safely and turn off the engine. Do not drive until resolved.",
      safety: "Do NOT open the radiator cap while hot. Let engine cool completely.",
      diy_possible: false,
    };
  }

  if (text.includes("noise") || text.includes("sound") || text.includes("rattle") || text.includes("knock")) {
    return {
      issue: "Mechanical Issue — Diagnosis Needed",
      description:
        "Unusual noises can indicate various mechanical issues. Professional diagnosis recommended to identify the source.",
      urgency: "medium" as const,
      cost_estimate: { min: 100, max: 500 },
      action: "Schedule professional inspection",
      safety: "Monitor for changes in noise intensity",
      diy_possible: false,
    };
  }

  if (text.includes("battery") || text.includes("won't start") || text.includes("click") || text.includes("crank")) {
    return {
      issue: "Battery or Starting System Issue",
      description:
        "If your vehicle won't start or you hear clicking, the most common cause is a dead or weak battery.",
      urgency: "high" as const,
      cost_estimate: { min: 100, max: 500 },
      action: "Test battery voltage or jump-start the vehicle",
      safety: "Ensure the vehicle is in park and on a level surface before jump-starting",
      diy_possible: true,
    };
  }

  if (text.includes("transmission") || text.includes("shifting") || text.includes("slipping")) {
    return {
      issue: "Transmission Issue",
      description:
        "Transmission problems can range from low fluid to serious internal damage. Address promptly to prevent costly repairs.",
      urgency: "high" as const,
      cost_estimate: { min: 150, max: 3000 },
      action: "Check transmission fluid level and schedule inspection",
      safety: "Avoid aggressive driving and heavy loads",
      diy_possible: false,
    };
  }

  return {
    issue: "Professional Diagnosis Recommended",
    description:
      "Multiple symptoms or unclear issue. A professional diagnostic scan will identify the specific problem.",
    urgency: "medium" as const,
    cost_estimate: { min: 100, max: 400 },
    action: "Schedule diagnostic appointment with local mechanic",
    safety: "Safe to drive short distances unless symptoms worsen",
    diy_possible: false,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: DiagnoseRequest = await req.json();

    const { symptoms, vehicle, location } = body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return new Response(JSON.stringify({ error: "Symptoms are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      return new Response(
        JSON.stringify({ error: "Vehicle year, make, and model are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagnosis = analyzeSymptoms(symptoms, vehicle);

    const baseUrl = "https://wrenchli.lovable.app";

    const response = {
      diagnosis: {
        probable_issue: diagnosis.issue,
        description: diagnosis.description,
        urgency: diagnosis.urgency,
        cost_estimate: diagnosis.cost_estimate,
      },
      recommendations: {
        immediate_action: diagnosis.action,
        safety_advice: diagnosis.safety,
        diy_feasible: diagnosis.diy_possible,
      },
      wrenchli_services: {
        get_quotes_url: `${baseUrl}/vehicle-insights?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&symptom=${encodeURIComponent(symptoms.join(", "))}`,
        find_shops_url: `${baseUrl}/for-shops`,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("api-diagnose error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
