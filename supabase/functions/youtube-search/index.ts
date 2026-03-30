import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

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

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "YouTube API key not configured." }), { status: 500, headers });
    }

    const clampedMax = Math.min(Math.max(Number(max_results) || 4, 1), 10);

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

    return new Response(JSON.stringify({ videos }), { status: 200, headers });
  } catch (err) {
    console.error("youtube-search error:", err);
    return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500, headers });
  }
});
