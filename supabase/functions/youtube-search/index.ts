import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";
const CACHE_TTL_HOURS = 24;

function hashQuery(query: string): string {
  // Simple deterministic hash for cache key
  let hash = 0;
  const normalized = query.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `yt_${hash.toString(36)}`;
}

serve(async (req) => {
  const corsRes = handleCorsOptions(req);
  if (corsRes) return corsRes;

  const origin = req.headers.get("Origin");
  const headers = { ...getCorsHeaders(origin), "Content-Type": "application/json" };

  try {
    const { query, max_results = 4 } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return new Response(JSON.stringify({ error: "A search query of at least 3 characters is required." }), { status: 400, headers });
    }

    const clampedMax = Math.min(Math.max(Number(max_results) || 4, 1), 10);
    const queryHash = hashQuery(query);

    // ── Check cache first ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: cached } = await supabase
      .from("youtube_search_cache")
      .select("results")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.results) {
      console.log("YouTube cache HIT:", queryHash);
      const cachedVideos = cached.results as unknown[];
      // Return up to the requested number from cache
      return new Response(JSON.stringify({ videos: cachedVideos.slice(0, clampedMax), cached: true }), { status: 200, headers });
    }

    // ── Cache miss — call YouTube API ──
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "YouTube API key not configured." }), { status: 500, headers });
    }

    console.log("YouTube cache MISS:", queryHash, "— calling API");

    const params = new URLSearchParams({
      part: "snippet",
      q: query.trim(),
      type: "video",
      maxResults: String(clampedMax),
      order: "relevance",
      videoDuration: "medium",
      safeSearch: "strict",
      key: apiKey,
    });

    const resp = await fetch(`${YOUTUBE_API_URL}?${params}`);
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("YouTube API error:", resp.status, errBody);
      return new Response(JSON.stringify({ error: "YouTube search failed.", detail: resp.status }), { status: 502, headers });
    }

    const data = await resp.json();

    const videos = (data.items ?? []).map((item: any) => ({
      video_id: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
      channel: item.snippet?.channelTitle,
      published_at: item.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    }));

    // ── Store in cache (fire-and-forget) ──
    if (videos.length > 0) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
      supabase
        .from("youtube_search_cache")
        .upsert(
          {
            query_hash: queryHash,
            search_query: query.trim(),
            results: videos,
            expires_at: expiresAt,
          },
          { onConflict: "query_hash" }
        )
        .then(({ error }) => {
          if (error) console.error("Cache write error:", error.message);
          else console.log("Cached YouTube results for:", queryHash);
        });
    }

    return new Response(JSON.stringify({ videos, cached: false }), { status: 200, headers });
  } catch (err) {
    console.error("youtube-search error:", err);
    return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500, headers });
  }
});
