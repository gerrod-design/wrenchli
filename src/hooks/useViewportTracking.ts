import { useCallback } from "react";
import { trackAdImpression } from "@/lib/analytics";

export const useViewportTracking = () => {
  const trackInView = useCallback((element: HTMLElement, adData: {
    id: string;
    title: string;
    category: string;
    placement: string;
    position: number;
    source: string;
    diagnosis?: string;
    repairCost?: number;
  }) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            trackAdImpression({
              item_id: adData.id,
              item_title: adData.title,
              item_category: adData.category,
              ad_placement: adData.placement,
              ad_position: adData.position,
              ad_source: adData.source,
              repair_diagnosis: adData.diagnosis,
              repair_cost_estimate: adData.repairCost,
            });
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.5, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { trackInView };
};
