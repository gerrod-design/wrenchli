import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import {
  DIYSectionSkeleton,
  VehicleSectionSkeleton,
  ServiceSectionSkeleton,
} from "@/components/EnhancedLoading";
import {
  getLocalRecommendations,
  getServiceRecommendations,
  buildAmazonSearchLink,
  type ProductRecommendation,
  type RecommendationSet,
} from "@/data/adRecommendations";

import DIYProductCard from "./advertising/DIYProductCard";
import DIYProductSection from "./advertising/DIYProductSection";
import VehicleReplacementSection from "./advertising/VehicleReplacementSection";
import ServiceAdSection from "./advertising/ServiceAdSection";
import type { TrackingContext } from "./advertising/types";

const RECOMMEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommend-products`;

/* ── Hook ── */

function useProductRecommendations(
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

/* ── DIY visibility logic ── */

function showDIY(repairCost: number, diyFeasibility?: string): boolean {
  const thresholds: Record<string, number> = {
    easy: 5000,
    moderate: 3000,
    advanced: 1500,
  };
  const maxCost = thresholds[diyFeasibility || ""] ?? 2000;
  return repairCost < maxCost;
}

/* ── Main component ── */

const ContextualAdvertising = ({
  diagnosis,
  diagnosisCode,
  vehicleInfo,
  repairCost,
  repairRecommendation,
  diyFeasibility,
  placement = "full",
}: {
  diagnosis: string;
  diagnosisCode?: string;
  vehicleInfo: any;
  repairCost: number;
  repairRecommendation: "repair" | "replace" | "consider_both";
  diyFeasibility?: "easy" | "moderate" | "advanced" | string;
  placement?: "full" | "sidebar" | "footer";
}) => {
  const { data, loading } = useProductRecommendations(diagnosis, diagnosisCode, vehicleInfo);

  if (loading) {
    if (placement === "sidebar") {
      return <ServiceSectionSkeleton layout="horizontal" />;
    }
    return (
      <div className="space-y-6">
        {showDIY(repairCost, diyFeasibility) && <DIYSectionSkeleton />}
        {(repairRecommendation === "replace" || repairRecommendation === "consider_both") && (
          <VehicleSectionSkeleton />
        )}
        <ServiceSectionSkeleton layout="grid" />
      </div>
    );
  }

  if (!data) return null;

  const { products, services, diyEstimate, source } = data;

  const trackCtx: TrackingContext = {
    diagnosis_title: diagnosis,
    diagnosis_code: diagnosisCode,
    vehicle_year: vehicleInfo?.year?.toString(),
    vehicle_make: vehicleInfo?.make,
    vehicle_model: vehicleInfo?.model,
    source,
    placement,
  };

  if (placement === "sidebar") {
    return (
      <div className="space-y-4">
        <ServiceAdSection services={services} layout="horizontal" trackCtx={trackCtx} />
        {products.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Featured Product</span>
            </div>
            <DIYProductCard
              product={products[0]}
              onTrack={(p) =>
                trackAdClick({
                  ...trackCtx,
                  click_type: "product",
                  item_id: p.id,
                  item_title: p.title,
                  item_brand: p.brand,
                  item_category: p.category,
                  item_price: p.price,
                })
              }
            />
          </div>
        )}
      </div>
    );
  }

  if (placement === "footer") {
    return (
      <div className="bg-muted/30 rounded-2xl p-6 border border-border">
        <h3 className="font-heading text-lg font-bold mb-4">
          More Options For Your {vehicleInfo?.year} {vehicleInfo?.make} {vehicleInfo?.model}
        </h3>
        <ServiceAdSection services={services} layout="grid" trackCtx={trackCtx} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showDIY(repairCost, diyFeasibility) && products.length > 0 && (
        <DIYProductSection
          products={products}
          diyEstimate={diyEstimate}
          source={source}
          vehicleInfo={vehicleInfo}
          trackCtx={trackCtx}
        />
      )}
      {(repairRecommendation === "replace" || repairRecommendation === "consider_both") && (
        <VehicleReplacementSection currentVehicle={vehicleInfo} repairCost={repairCost} trackCtx={trackCtx} />
      )}
      <ServiceAdSection services={services} layout="grid" trackCtx={trackCtx} />
    </div>
  );
};

export default ContextualAdvertising;
