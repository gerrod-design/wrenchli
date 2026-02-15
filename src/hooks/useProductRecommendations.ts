import { useState, useEffect } from "react";
import {
  getLocalRecommendations,
  getServiceRecommendations,
  buildAmazonSearchLink,
  type ProductRecommendation,
  type RecommendationSet,
} from "@/data/adRecommendations";

const RECOMMEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-products`;

export function useProductRecommendations(
  diagnosis: string,
  code: string | undefined,
  vehicleInfo: any
): { data: RecommendationSet | null; loading: boolean } {
  const [data, setData] = useState<RecommendationSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const local = getLocalRecommendations(diagnosis, code);
    if (local) {
      setData(local);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const resp = await fetch(RECOMMEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            diagnosis_title: diagnosis,
            diagnosis_code: code,
            vehicle_year: vehicleInfo?.year,
            vehicle_make: vehicleInfo?.make,
            vehicle_model: vehicleInfo?.model,
            vehicle_trim: vehicleInfo?.trim,
          }),
        });

        if (!resp.ok) throw new Error("AI recommendation failed");

        const ai = await resp.json();
        if (!cancelled) {
          const vehicleStr = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model]
            .filter(Boolean)
            .join(" ");

          const products: ProductRecommendation[] = (ai.products || []).map(
            (p: any, i: number) => ({
              id: `ai-${i}`,
              title: p.title,
              description: p.description,
              price: p.price,
              rating: p.rating || 4.4,
              reviewCount: p.review_count || 1000,
              brand: p.brand,
              asin: "",
              link: buildAmazonSearchLink(p.search_query, vehicleStr),
              category: p.category || "part",
              prime: true,
            })
          );

          setData({
            products,
            services: getServiceRecommendations(),
            diyEstimate: ai.diy_time_range
              ? { timeRange: ai.diy_time_range, totalPartsRange: ai.total_parts_range }
              : undefined,
            source: "ai",
          });
        }
      } catch (e) {
        console.error("AI product recommendation error:", e);
        if (!cancelled) {
          setData({
            products: getLocalRecommendations("general")?.products || [],
            services: getServiceRecommendations(),
            source: "local",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [diagnosis, code, vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model]);

  return { data, loading };
}
