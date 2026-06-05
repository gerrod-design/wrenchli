import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const YELP_API_KEY = Deno.env.get("YELP_API_KEY");

    if (!YELP_API_KEY) {
      throw new Error("YELP_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find top 10 unserved ZIPs from the last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: logs, error: logsErr } = await supabase
      .from("shop_search_logs")
      .select("zip_code")
      .eq("results_count", 0)
      .gte("searched_at", since.toISOString())
      .limit(1000);

    if (logsErr) throw new Error(`Failed to fetch logs: ${logsErr.message}`);

    // Count by ZIP
    const counts: Record<string, number> = {};
    (logs || []).forEach((l: { zip_code: string }) => {
      counts[l.zip_code] = (counts[l.zip_code] || 0) + 1;
    });

    const topZips = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([zip, count]) => ({ zip, count }));

    if (topZips.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unserved ZIPs found", ingested: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. For each ZIP, call the ingest-yelp-shops function
    const results: { zip: string; searches: number; shops_added: number; error?: string }[] = [];

    for (const { zip, count } of topZips) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ingest-yelp-shops`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "x-internal-secret": internalSecret,
          },
          body: JSON.stringify({ zip_code: zip }),
        });


        const data = await res.json();
        results.push({
          zip,
          searches: count,
          shops_added: data.upserted || 0,
          ...(res.ok ? {} : { error: data.error || "Unknown" }),
        });
      } catch (err: unknown) {
        results.push({
          zip,
          searches: count,
          shops_added: 0,
          error: err instanceof Error ? err.message : "fetch failed",
        });
      }
    }

    const totalAdded = results.reduce((s, r) => s + r.shops_added, 0);

    console.log(`Auto-fill complete: ${totalAdded} shops added across ${topZips.length} ZIPs`);

    return new Response(
      JSON.stringify({
        message: `Processed ${topZips.length} unserved ZIPs, added ${totalAdded} shops`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-fill error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
