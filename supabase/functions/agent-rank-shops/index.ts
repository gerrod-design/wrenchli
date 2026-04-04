import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { zip_code, diagnosis, repair_type, vehicle_make } = await req.json();
    if (!zip_code) {
      return new Response(JSON.stringify({ error: "ZIP code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch shops near ZIP
    const zipPrefix = zip_code.substring(0, 3);
    const shopsResp = await fetch(
      `${SUPABASE_URL}/rest/v1/service_providers?is_active=eq.true&zip_code=like.${zipPrefix}*&limit=20&order=rating.desc`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    );
    const shops = shopsResp.ok ? await shopsResp.json() : [];

    // Fetch outcome data for each shop
    const shopIds = shops.map((s: any) => s.id);
    let outcomesByShop: Record<string, any> = {};

    if (shopIds.length > 0) {
      const outcomesResp = await fetch(
        `${SUPABASE_URL}/rest/v1/repair_outcomes?shop_id=in.(${shopIds.join(",")})&select=shop_id,diagnosis_match,shop_actual_cost,customer_satisfaction,rework_required`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
      );
      if (outcomesResp.ok) {
        const outcomes = await outcomesResp.json();
        for (const o of outcomes) {
          if (!outcomesByShop[o.shop_id]) outcomesByShop[o.shop_id] = [];
          outcomesByShop[o.shop_id].push(o);
        }
      }
    }

    // Score and rank shops
    const rankedShops = shops.map((shop: any) => {
      const outcomes = outcomesByShop[shop.id] || [];
      const totalJobs = outcomes.length;

      // Calculate metrics from outcomes
      const successCount = outcomes.filter((o: any) => o.diagnosis_match === true).length;
      const successRate = totalJobs > 0 ? Math.round((successCount / totalJobs) * 100) : null;

      const satScores = outcomes.filter((o: any) => o.customer_satisfaction).map((o: any) => o.customer_satisfaction);
      const avgSatisfaction = satScores.length > 0
        ? Math.round((satScores.reduce((a: number, b: number) => a + b, 0) / satScores.length) * 10) / 10
        : shop.rating || null;

      const reworkCount = outcomes.filter((o: any) => o.rework_required === true).length;
      const reworkRate = totalJobs > 0 ? Math.round((reworkCount / totalJobs) * 100) : null;

      const costs = outcomes.filter((o: any) => o.shop_actual_cost).map((o: any) => Number(o.shop_actual_cost));
      const avgCost = costs.length > 0
        ? Math.round(costs.reduce((a: number, b: number) => a + b, 0) / costs.length)
        : null;

      // Scoring algorithm: success 40%, price 30%, satisfaction 20%, proximity 10%
      let score = 50; // base
      if (successRate !== null) score += (successRate / 100) * 40;
      else if (shop.rating) score += (shop.rating / 5) * 30; // fallback to rating
      
      if (avgSatisfaction !== null) score += (avgSatisfaction / 5) * 20;
      else if (shop.rating) score += (shop.rating / 5) * 15;

      // Proximity bonus (same ZIP = full points)
      if (shop.zip_code === zip_code) score += 10;
      else if (shop.zip_code?.substring(0, 3) === zipPrefix) score += 5;

      // Penalize high rework rate
      if (reworkRate !== null && reworkRate > 5) score -= (reworkRate - 5) * 2;

      // Partnered bonus
      if (shop.is_partnered) score += 5;

      return {
        id: shop.id,
        name: shop.name,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        zipCode: shop.zip_code,
        phone: shop.phone,
        rating: shop.rating,
        reviewCount: shop.review_count,
        specialties: shop.specialties || [],
        isPartnered: shop.is_partnered,
        isDealer: shop.is_dealer,
        priceTier: shop.price_tier,
        // Performance metrics
        metrics: {
          successRate,
          totalJobs,
          avgSatisfaction,
          avgCost,
          reworkRate,
          turnaroundDays: null, // TODO: calculate from shop_jobs
        },
        // Ranking
        score: Math.round(score * 10) / 10,
        rankingReasons: generateRankingReasons(shop, successRate, avgSatisfaction, avgCost, reworkRate, totalJobs),
      };
    });

    // Sort by score descending
    rankedShops.sort((a: any, b: any) => b.score - a.score);

    // Calculate market average cost from all outcomes
    const allCosts = Object.values(outcomesByShop).flat()
      .filter((o: any) => o.shop_actual_cost)
      .map((o: any) => Number(o.shop_actual_cost));
    const marketAvgCost = allCosts.length > 0
      ? Math.round(allCosts.reduce((a: number, b: number) => a + b, 0) / allCosts.length)
      : null;

    return new Response(JSON.stringify({
      shops: rankedShops.slice(0, 5),
      totalResults: rankedShops.length,
      marketAvgCost,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-rank-shops error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateRankingReasons(
  shop: any, successRate: number | null, avgSatisfaction: number | null,
  avgCost: number | null, reworkRate: number | null, totalJobs: number
): string[] {
  const reasons: string[] = [];

  if (successRate !== null && successRate >= 90) {
    reasons.push(`${successRate}% success rate on repairs (${totalJobs} cases)`);
  } else if (successRate !== null) {
    reasons.push(`${successRate}% success rate tracked`);
  }

  if (avgSatisfaction !== null && avgSatisfaction >= 4.5) {
    reasons.push(`Excellent customer satisfaction (${avgSatisfaction}/5)`);
  } else if (shop.rating && shop.rating >= 4.5) {
    reasons.push(`Highly rated (${shop.rating}/5 from ${shop.review_count || 0} reviews)`);
  }

  if (reworkRate !== null && reworkRate <= 3) {
    reasons.push("Very low rework rate — reliable repairs");
  }

  if (shop.is_partnered) {
    reasons.push("Wrenchli verified partner");
  }

  if (shop.specialties?.length > 0) {
    reasons.push(`Specializes in: ${shop.specialties.slice(0, 3).join(", ")}`);
  }

  if (avgCost !== null) {
    reasons.push(`Average repair cost: $${avgCost}`);
  }

  return reasons.length > 0 ? reasons : ["Nearby shop matching your search criteria"];
}
