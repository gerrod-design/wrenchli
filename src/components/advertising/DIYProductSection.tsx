import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, DollarSign, ExternalLink, MapPin } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import { buildAmazonSearchLink, type ProductRecommendation } from "@/data/adRecommendations";
import DIYProductCard from "./DIYProductCard";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import { getRepairTimeEstimate } from "@/lib/repairTimeEstimate";
import type { TrackingContext } from "./types";

const DIYProductSection = ({
  products,
  diyEstimate,
  source,
  vehicleInfo,
  trackCtx,
  diyDifficulty,
}: {
  products: ProductRecommendation[];
  diyEstimate?: { timeRange: string; totalPartsRange: string };
  source: "local" | "ai";
  vehicleInfo: any;
  trackCtx: TrackingContext;
  diyDifficulty?: string;
}) => {
  const vehicleStr = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model].filter(Boolean).join(" ");
  const timeEstimate = diyDifficulty ? getRepairTimeEstimate(diyDifficulty) : diyEstimate?.timeRange;

  const handleProductClick = (p: ProductRecommendation) =>
    trackAdClick({
      ...trackCtx,
      click_type: "product",
      item_id: p.id,
      item_title: p.title,
      item_brand: p.brand,
      item_category: p.category,
      item_price: p.price,
    });

  const handleBrowseAll = () => trackAdClick({ ...trackCtx, click_type: "browse_parts" });

  return (
    <section
      aria-labelledby="diy-section-heading"
      className="bg-gradient-to-r from-ad-info-bg to-ad-info-bg-end rounded-2xl p-6 border border-ad-info-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <Wrench className="h-5 w-5 text-ad-info-icon" aria-hidden="true" />
        <div>
          <h3 id="diy-section-heading" className="font-heading text-lg font-bold text-ad-info-heading">DIY Repair Option</h3>
          <p className="text-sm text-ad-info-text">Save money by fixing it yourself with these parts</p>
          {timeEstimate && (
            <p className="text-xs text-muted-foreground mt-0.5">Estimated time: {timeEstimate}</p>
          )}
        </div>
        <Badge className="ml-auto bg-ad-badge-savings text-ad-badge-savings-text border-ad-badge-savings-border" aria-label="Potential savings: 60 to 70 percent">Save 60-70%</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3" role="list" aria-label="Recommended DIY products">
        {products.map((p) => (
          <div key={p.id} role="listitem">
            <DIYProductCard product={p} onTrack={handleProductClick} />
          </div>
        ))}
      </div>
      {diyEstimate && (
        <div className="mt-4 pt-4 border-t border-ad-info-border flex items-center justify-between text-sm" aria-label="DIY estimate details">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-ad-info-text">
              <Clock className="h-4 w-4 text-ad-info-icon" aria-hidden="true" />
              <span aria-label={`Estimated time: ${diyEstimate.timeRange}`}>{diyEstimate.timeRange}</span>
            </span>
            <span className="flex items-center gap-1 text-ad-success-text">
              <DollarSign className="h-4 w-4 text-ad-success-icon" aria-hidden="true" />
              <span aria-label={`Total parts cost: ${diyEstimate.totalPartsRange}`}>Total parts: {diyEstimate.totalPartsRange}</span>
            </span>
          </div>
        </div>
      )}

      {/* Parts ordering section */}
      <div className="mt-4 pt-4 border-t border-ad-info-border space-y-3">
        <p className="text-xs font-semibold text-ad-info-heading">Get the parts you need:</p>
        <Button variant="default" size="sm" className="w-full sm:w-auto" asChild>
          <a
            href={buildAmazonSearchLink("auto repair parts", vehicleStr)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBrowseAll}
            aria-label="Browse all parts on Amazon (opens in new tab)"
          >
            <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" /> Amazon — Order online (2-3 days)
          </a>
        </Button>

        <p className="text-xs text-muted-foreground">Need it today? Pick up locally:</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="border-ad-info-border text-ad-info-text hover:bg-ad-info-bg" asChild>
            <a
              href={`https://www.autozone.com/searchresult?searchtext=${encodeURIComponent(vehicleStr + " auto repair parts")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdClick({ ...trackCtx, click_type: "browse_parts", destination: "autozone" })}
            >
            </a>
          </Button>
          <Button variant="outline" size="sm" className="border-ad-info-border text-ad-info-text hover:bg-ad-info-bg" asChild>
            <a
              href={`https://www.oreillyauto.com/search?q=${encodeURIComponent(vehicleStr + " auto repair parts")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAdClick({ ...trackCtx, click_type: "browse_parts", destination: "orielly" })}
              aria-label="Search O'Reilly Auto Parts for same-day pickup (opens in new tab)"
            >
              <MapPin className="h-3 w-3 mr-1" aria-hidden="true" /> O'Reilly — Same-day pickup
            </a>
          </Button>
        </div>
      </div>
      <AffiliateDisclosure />
      {source === "ai" && (
        <p className="mt-2 text-xs text-ad-info-subtle text-center" role="note">
          Recommendations powered by AI — verify fitment for your specific vehicle
        </p>
      )}
    </section>
  );
};

export default DIYProductSection;
