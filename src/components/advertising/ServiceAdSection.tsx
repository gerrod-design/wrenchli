import { Shield, TrendingUp } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import type { ServiceRecommendation } from "@/data/adRecommendations";
import ServiceAdCard from "./ServiceAdCard";
import type { TrackingContext } from "./types";

const ServiceAdSection = ({
  services,
  layout = "horizontal",
  trackCtx,
}: {
  services: ServiceRecommendation[];
  layout?: "horizontal" | "grid";
  trackCtx?: TrackingContext;
}) => {
  const makeOnTrack = (s: ServiceRecommendation) =>
    trackCtx
      ? () =>
          trackAdClick({
            ...trackCtx,
            click_type: "service",
            item_id: s.id,
            item_title: s.company,
            item_price: s.price,
          })
      : undefined;

  if (layout === "horizontal") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recommended Services</span>
        </div>
        {services.map((s) => (
          <ServiceAdCard key={s.id} service={s} layout="horizontal" onTrack={makeOnTrack(s)} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-heading text-lg font-bold">Protect Your Investment</h3>
          <p className="text-sm text-muted-foreground">Services to keep your vehicle running smoothly</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((s) => (
          <ServiceAdCard key={s.id} service={s} onTrack={makeOnTrack(s)} />
        ))}
      </div>
    </div>
  );
};

export default ServiceAdSection;
