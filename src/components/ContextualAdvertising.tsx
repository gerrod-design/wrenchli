import { useEffect } from "react";
import { Package } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import { trackEvent, ABTester } from "@/lib/analytics";
import { showDIY } from "@/lib/diyVisibility";
import {
  DIYSectionSkeleton,
  VehicleSectionSkeleton,
  ServiceSectionSkeleton,
} from "@/components/EnhancedLoading";
import { useProductRecommendations } from "@/hooks/useProductRecommendations";

import DIYProductCard from "./advertising/DIYProductCard";
import DIYProductSection from "./advertising/DIYProductSection";
import VehicleListingsSection from "./advertising/RealVehicleListings";
import ServiceAdSection from "./advertising/ServiceAdSection";
import type { TrackingContext } from "./advertising/types";

const ContextualAdvertising = ({
  diagnosis,
  diagnosisCode,
  vehicleInfo,
  repairCost,
  repairRecommendation,
  diyFeasibility,
  placement = "full",
  userZipCode,
}: {
  diagnosis: string;
  diagnosisCode?: string;
  vehicleInfo: any;
  repairCost: number;
  repairRecommendation: "repair" | "replace" | "consider_both";
  diyFeasibility?: "easy" | "moderate" | "advanced" | string;
  placement?: "full" | "sidebar" | "footer";
  userZipCode?: string;
}) => {
  const { data, loading } = useProductRecommendations(diagnosis, diagnosisCode, vehicleInfo);

  // Track section impression when loaded
  useEffect(() => {
    if (!loading && data) {
      trackEvent({
        event_type: "ad_impression",
        category: "navigation",
        action: "section_view",
        label: "contextual_advertising",
        repair_diagnosis: diagnosis,
        repair_cost_estimate: repairCost,
        ad_placement: placement,
      });
    }
  }, [loading, data, diagnosis, repairCost, placement]);

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
        <VehicleListingsSection
          userZipCode={userZipCode || ""}
          repairCost={repairCost}
          currentVehicle={vehicleInfo}
          trackCtx={trackCtx}
        />
      )}
      <ServiceAdSection services={services} layout="grid" trackCtx={trackCtx} />
    </div>
  );
};

export default ContextualAdvertising;
