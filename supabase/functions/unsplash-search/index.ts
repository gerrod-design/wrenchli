import { pickBestPhoto, getVehicleBodyClass } from "./scoring.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";


Deno.serve(async (req) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    const body = await req.json();
    const { query } = body;
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queryTokens = query.trim().split(/\s+/);
    const make = typeof body.make === "string" && body.make ? body.make : queryTokens[0] ?? "";
    const model = typeof body.model === "string" && body.model ? body.model : queryTokens[1] ?? "";
    const trim = typeof body.trim === "string" ? body.trim : null;
    const bodyType = typeof body.bodyType === "string" ? body.bodyType : null;

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) {
      return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Widen the candidate pool: try a few query variants (the raw query, the
    // make+model, and a body-style variant like "SUV" or "Gran Coupe") so the
    // body-class gate in scoring.ts has a better chance of finding a matching photo.
    // Results from all variants are merged and de-duplicated before scoring.
    const queries: string[] = [query];

    const makeModel = `${make} ${model}`.trim();
    if (makeModel && !queries.includes(makeModel)) {
      queries.push(makeModel);
    }

    const bodyClass = getVehicleBodyClass({ make, model, trim, bodyType });
    let bodyStyleQuery = "";
    if (bodyClass === "gran-coupe") {
      bodyStyleQuery = `${make} ${model} Gran Coupe`.trim();
    } else if (bodyClass === "suv") {
      bodyStyleQuery = `${make} ${model} SUV`.trim();
    }
    if (bodyStyleQuery && !queries.includes(bodyStyleQuery)) {
      queries.push(bodyStyleQuery);
    }

    const variants = queries.slice(0, 3);

    let lastErrorStatus: number | null = null;
    let lastErrorText = "";
    let anySuccess = false;
    const mergedResults: any[] = [];
    const seenKeys = new Set<string>();

    for (const variantQuery of variants) {
      const params = new URLSearchParams({
        query: variantQuery,
        per_page: "30",
        orientation: "landscape",
        content_filter: "high",
      });

      try {
        const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
          headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });

        if (!res.ok) {
          lastErrorStatus = res.status;
          lastErrorText = await res.text();
          continue;
        }

        anySuccess = true;
        const data = await res.json();
        for (const result of data.results ?? []) {
          const key = result?.id ?? result?.urls?.regular;
          if (key && seenKeys.has(key)) continue;
          if (key) seenKeys.add(key);
          mergedResults.push(result);
        }
      } catch (err) {
        lastErrorText = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    if (!anySuccess) {
      console.error("Unsplash API error:", lastErrorStatus, lastErrorText);
      return new Response(JSON.stringify({ error: "Unsplash API error", url: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photo = pickBestPhoto(mergedResults, { make, model, trim, bodyType });

    if (!photo) {
      return new Response(JSON.stringify({ url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use regular size (1080w) for good quality without huge payloads
    const url = photo.urls?.regular || photo.urls?.small || null;
    const photographer = photo.user?.name || null;
    const photographerUrl = photo.user?.links?.html || null;

    return new Response(
      JSON.stringify({ url, photographer, photographerUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("unsplash-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
