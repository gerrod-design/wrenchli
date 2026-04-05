import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const corsHeaders = getCorsHeaders(null);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CSV export fallback for shops without API-enabled SMS systems

interface ExportRequest {
  session_id: string;
  format?: "generic" | "mitchell1" | "rowriter";
}

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { session_id, format = "generic" }: ExportRequest = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: diagnosis } = await supabase
      .from("diagnosis_records")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!diagnosis) {
      return new Response(JSON.stringify({ error: "No assessment found for this session" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let csv: string;

    if (format === "mitchell1") {
      csv = toCSV(
        ["CustomerName", "VehicleYear", "VehicleMake", "VehicleModel", "VIN", "Complaint", "EstLow", "EstHigh", "Notes"],
        [[
          "Wrenchli Customer", diagnosis.vehicle_year || "", diagnosis.vehicle_make || "",
          diagnosis.vehicle_model || "", diagnosis.vin || "", diagnosis.symptoms || "",
          diagnosis.cost_estimate_low?.toString() || "", diagnosis.cost_estimate_high?.toString() || "",
          `Wrenchli Assessment: ${diagnosis.primary_diagnosis} (${diagnosis.primary_confidence}% confidence)`,
        ]]
      );
    } else if (format === "rowriter") {
      csv = toCSV(
        ["Year", "Make", "Model", "VIN", "Description", "LaborEst", "PartsEst"],
        [[
          diagnosis.vehicle_year || "", diagnosis.vehicle_make || "",
          diagnosis.vehicle_model || "", diagnosis.vin || "",
          `${diagnosis.symptoms} — Likely: ${diagnosis.primary_diagnosis}`,
          "", diagnosis.cost_estimate_low?.toString() || "",
        ]]
      );
    } else {
      csv = toCSV(
        ["Vehicle Year", "Vehicle Make", "Vehicle Model", "VIN", "Symptoms", "Likely Issue", "Confidence", "Est Cost Low", "Est Cost High", "Source"],
        [[
          diagnosis.vehicle_year || "", diagnosis.vehicle_make || "",
          diagnosis.vehicle_model || "", diagnosis.vin || "",
          diagnosis.symptoms || "", diagnosis.primary_diagnosis || "",
          `${diagnosis.primary_confidence}%`,
          diagnosis.cost_estimate_low?.toString() || "", diagnosis.cost_estimate_high?.toString() || "",
          "Wrenchli Symptom Assessment",
        ]]
      );
    }

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wrenchli-intake-${session_id.slice(0, 8)}.csv"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
