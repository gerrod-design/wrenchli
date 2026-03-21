import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = checkRateLimit(rateLimitId, RATE_LIMITS.ADMIN);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.ADMIN.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: vehicles, error: vehiclesError } = await supabase
      .from("user_vehicles")
      .select("id, make, model, year, user_id");

    if (vehiclesError) throw vehiclesError;
    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ message: "No vehicles to check", checked: 0 }), {
        headers: { ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    let totalNew = 0;
    const emailAlerts: { userId: string; vehicleName: string; recalls: any[] }[] = [];

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
                ? "urgent" : "high";

            const { error: insertError } = await supabase
              .from("recall_alerts")
              .upsert(
                { vehicle_id: vehicle.id, campaign_number: campaignNumber, component, summary, consequence, remedy, priority },
                { onConflict: "vehicle_id,campaign_number", ignoreDuplicates: true }
              );

            if (!insertError) {
              newRecalls.push({ component, summary, campaignNumber });
            }
          }

          if (newRecalls.length > 0) {
            totalNew += newRecalls.length;
            emailAlerts.push({ userId: vehicle.userId, vehicleName: `${group.year} ${group.make} ${group.model}`, recalls: newRecalls });
          }
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.warn(`Failed to check recalls for ${group.make} ${group.model}:`, err);
      }
    }

    if (emailAlerts.length > 0) {
      const byUser = new Map<string, { vehicleName: string; recalls: any[] }[]>();
      for (const alert of emailAlerts) {
        if (!byUser.has(alert.userId)) byUser.set(alert.userId, []);
        byUser.get(alert.userId)!.push({ vehicleName: alert.vehicleName, recalls: alert.recalls });
      }

      for (const [userId, vehicleAlerts] of byUser) {
        try {
          const { data: prefData } = await supabase
            .from("notification_preferences")
            .select("email_recalls")
            .eq("user_id", userId)
            .maybeSingle();

          const emailEnabled = prefData?.email_recalls ?? true;
          if (!emailEnabled) continue;

          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          const email = userData?.user?.email;
          if (!email) continue;

          const totalRecalls = vehicleAlerts.reduce((sum, v) => sum + v.recalls.length, 0);
          const vehicleSummary = vehicleAlerts
            .map((v) => `• ${v.vehicleName}: ${v.recalls.length} recall(s)`)
            .join("\n");

          console.log(`Would send email to ${email}: ${totalRecalls} new recall(s) found\n${vehicleSummary}`);

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
      JSON.stringify({ message: `Checked ${uniqueVehicles.size} unique vehicle configs, found ${totalNew} new recall alerts`, checked: uniqueVehicles.size, newAlerts: totalNew }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-recalls:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...securityHeaders, "Content-Type": "application/json" },
    });
  }
});
