import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { user_vehicle_id, make, model, year } = await req.json();

    if (!user_vehicle_id || !make || !model || !year) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_vehicle_id, make, model, year" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call NHTSA API
    const nhtsaUrl = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const nhtsaRes = await fetch(nhtsaUrl);

    if (!nhtsaRes.ok) {
      const body = await nhtsaRes.text();
      console.error("[check-recalls] NHTSA API error:", nhtsaRes.status, body);
      return new Response(
        JSON.stringify({ error: "NHTSA API request failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nhtsaData = await nhtsaRes.json();
    const recalls = nhtsaData?.results || [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let newRecalls = 0;

    for (const recall of recalls) {
      const nhtsaId = recall.NHTSACampaignNumber;
      if (!nhtsaId) continue;

      const { data, error } = await supabase
        .from("recall_alerts")
        .upsert(
          {
            vehicle_id: user_vehicle_id,
            nhtsa_id: nhtsaId,
            campaign_number: recall.NHTSACampaignNumber || null,
            component: recall.Component || "Unknown Component",
            summary: recall.Summary || "No details available.",
            consequence: recall.Consequence || "",
            remedy: recall.Remedy || "Contact your dealer.",
            is_read: false,
          },
          {
            onConflict: "vehicle_id,nhtsa_id",
            ignoreDuplicates: false,
          }
        )
        .select("id");

      if (error) {
        console.warn("[check-recalls] upsert error:", error);
      } else if (data && data.length > 0) {
        newRecalls++;
      }
    }

    return new Response(
      JSON.stringify({ recalls_found: recalls.length, new_recalls: newRecalls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[check-recalls] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
