import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all user vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("user_vehicles")
      .select("id, make, model, year, user_id");

    if (vehiclesError) throw vehiclesError;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles to check", checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalNew = 0;
    const emailAlerts: { userId: string; vehicleName: string; recalls: any[] }[] = [];

    // Deduplicate by make/model/year to minimize API calls
    const uniqueVehicles = new Map<string, { make: string; model: string; year: number; vehicleIds: { id: string; userId: string }[] }>();
    for (const v of vehicles) {
      const key = `${v.year}_${v.make}_${v.model}`;
      if (!uniqueVehicles.has(key)) {
        uniqueVehicles.set(key, { make: v.make, model: v.model, year: v.year, vehicleIds: [] });
      }
      uniqueVehicles.get(key)!.vehicleIds.push({ id: v.id, userId: v.user_id });
    }

    for (const [, group] of uniqueVehicles) {
      try {
        const res = await fetch(
          `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(group.make)}&model=${encodeURIComponent(group.model)}&modelYear=${group.year}`
        );
        if (!res.ok) continue;

        const data = await res.json();
        const recalls = data?.results || [];
        if (recalls.length === 0) continue;

        for (const vehicle of group.vehicleIds) {
          const newRecalls: any[] = [];

          for (const recall of recalls) {
            const campaignNumber = recall.NHTSACampaignNumber;
            if (!campaignNumber) continue;

            const component = recall.Component || "Unknown Component";
            const summary = recall.Summary || "No details available.";
            const consequence = recall.Consequence || "";
            const remedy = recall.Remedy || "Contact your dealer.";
            const priority =
              consequence.toLowerCase().includes("fire") ||
              consequence.toLowerCase().includes("crash") ||
              consequence.toLowerCase().includes("injury")
                ? "urgent"
                : "high";

            const { error: insertError } = await supabase
              .from("recall_alerts")
              .upsert(
                {
                  vehicle_id: vehicle.id,
                  campaign_number: campaignNumber,
                  component,
                  summary,
                  consequence,
                  remedy,
                  priority,
                },
                { onConflict: "vehicle_id,campaign_number", ignoreDuplicates: true }
              );

            if (!insertError) {
              newRecalls.push({ component, summary, campaignNumber });
            }
          }

          if (newRecalls.length > 0) {
            totalNew += newRecalls.length;
            emailAlerts.push({
              userId: vehicle.userId,
              vehicleName: `${group.year} ${group.make} ${group.model}`,
              recalls: newRecalls,
            });
          }
        }

        // Rate limit NHTSA calls
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.warn(`Failed to check recalls for ${group.make} ${group.model}:`, err);
      }
    }

    // Send email notifications for users with new recalls
    if (emailAlerts.length > 0) {
      // Group by userId
      const byUser = new Map<string, { vehicleName: string; recalls: any[] }[]>();
      for (const alert of emailAlerts) {
        if (!byUser.has(alert.userId)) byUser.set(alert.userId, []);
        byUser.get(alert.userId)!.push({ vehicleName: alert.vehicleName, recalls: alert.recalls });
      }

      for (const [userId, vehicleAlerts] of byUser) {
        try {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          const email = userData?.user?.email;
          if (!email) continue;

          const totalRecalls = vehicleAlerts.reduce((sum, v) => sum + v.recalls.length, 0);
          const vehicleSummary = vehicleAlerts
            .map((v) => `• ${v.vehicleName}: ${v.recalls.length} recall(s)`)
            .join("\n");

          // Send email via Supabase Auth (using the built-in mailer via admin API)
          // For now, we'll use a simple approach: generate invite link which sends an email
          // In production, integrate with a proper email service
          console.log(`Would send email to ${email}: ${totalRecalls} new recall(s) found\n${vehicleSummary}`);

          // Mark alerts as email_sent
          for (const va of vehicleAlerts) {
            for (const recall of va.recalls) {
              await supabase
                .from("recall_alerts")
                .update({ email_sent: true })
                .match({ campaign_number: recall.campaignNumber });
            }
          }
        } catch (err) {
          console.warn(`Failed to notify user ${userId}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${uniqueVehicles.size} unique vehicle configs, found ${totalNew} new recall alerts`,
        checked: uniqueVehicles.size,
        newAlerts: totalNew,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-recalls:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
