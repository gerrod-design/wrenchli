import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { getSecurityHeaders } from "../_shared/security-headers.ts";

const YELP_API_BASE = "https://api.yelp.com/v3";

Deno.serve(async (req) => {
  const corsRes = handleCorsOptions(req);
  if (corsRes) return corsRes;

  const origin = req.headers.get("Origin");
  const headers = {
    ...getCorsHeaders(origin),
    ...getSecurityHeaders(),
    "Content-Type": "application/json",
  };

  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit(ip, RATE_LIMITS.STANDARD, "yelp-search");
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers,
      });
    }

    const body = await req.json();
    const location = (body.location || "").trim();
    const radius = Math.min(Math.max(Number(body.radius) || 8047, 1609), 40000); // 1-25 miles in meters, default ~5mi
    const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 20);

    if (!location) {
      return new Response(JSON.stringify({ error: "Location is required" }), {
        status: 400,
        headers,
      });
    }

    const YELP_API_KEY = Deno.env.get("YELP_API_KEY");
    if (!YELP_API_KEY) {
      return new Response(JSON.stringify({ error: "Yelp API not configured" }), {
        status: 500,
        headers,
      });
    }

    // Step 1: Search businesses
    const searchParams = new URLSearchParams({
      term: "auto repair",
      location,
      radius: String(radius),
      limit: String(limit),
      sort_by: "rating",
      categories: "autorepair,tires,oilchange,transmissionrepair,brakes",
    });

    const searchRes = await fetch(`${YELP_API_BASE}/businesses/search?${searchParams}`, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("[yelp-search] Yelp search failed:", searchRes.status, errText);
      return new Response(JSON.stringify({ error: "Failed to search Yelp. Please try a different location." }), {
        status: 502,
        headers,
      });
    }

    const searchData = await searchRes.json();
    const businesses = searchData.businesses || [];

    // Step 2: Fetch reviews for each business (top 3 per business from Yelp)
    const shopsWithReviews = await Promise.all(
      businesses.map(async (biz: any) => {
        let reviews: any[] = [];
        try {
          const revRes = await fetch(`${YELP_API_BASE}/businesses/${biz.id}/reviews?limit=3&sort_by=yelp_sort`, {
            headers: { Authorization: `Bearer ${YELP_API_KEY}` },
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            reviews = (revData.reviews || []).map((r: any) => ({
              text: r.text,
              rating: r.rating,
              user_name: r.user?.name || "Anonymous",
              time_created: r.time_created,
            }));
          }
        } catch {
          // Non-critical, skip reviews
        }

        return {
          id: biz.id,
          name: biz.name,
          url: biz.url,
          image_url: biz.image_url,
          photos: biz.photos || (biz.image_url ? [biz.image_url] : []),
          rating: biz.rating,
          review_count: biz.review_count,
          price: biz.price || null,
          phone: biz.display_phone || biz.phone || null,
          address: [
            biz.location?.address1,
            biz.location?.city,
            biz.location?.state,
            biz.location?.zip_code,
          ].filter(Boolean).join(", "),
          coordinates: biz.coordinates || null,
          categories: (biz.categories || []).map((c: any) => c.title),
          distance_miles: biz.distance ? +(biz.distance / 1609.34).toFixed(1) : null,
          is_closed: biz.is_closed || false,
          hours: null, // Yelp search endpoint doesn't return hours
          reviews,
        };
      })
    );

    return new Response(
      JSON.stringify({
        total: searchData.total || 0,
        shops: shopsWithReviews,
        location,
        region: searchData.region || null,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("[yelp-search] error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers,
    });
  }
});
