import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, DollarSign, ExternalLink } from "lucide-react";
import { trackAdClick } from "@/lib/adClickTracker";
import { buildAmazonSearchLink, type ProductRecommendation } from "@/data/adRecommendations";
import DIYProductCard from "./DIYProductCard";
import type { TrackingContext } from "./types";

const DIYProductSection = ({
  products,
  diyEstimate,
  source,
  vehicleInfo,
  trackCtx,
}: {
  products: ProductRecommendation[];
  diyEstimate?: { timeRange: string; totalPartsRange: string };
  source: "local" | "ai";
  vehicleInfo: any;
  trackCtx: TrackingContext;
}) => {
  const vehicleStr = [vehicleInfo?.year, vehicleInfo?.make, vehicleInfo?.model].filter(Boolean).join(" ");

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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <Wrench className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-heading text-lg font-bold text-blue-900">DIY Repair Option</h3>
          <p className="text-sm text-blue-700">Save money by fixing it yourself with these parts</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-800 border-green-300">Save 60-70%</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {products.map((p) => (
          <DIYProductCard key={p.id} product={p} onTrack={handleProductClick} />
        ))}
      </div>
      {diyEstimate && (
        <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-blue-700">
              <Clock className="h-4 w-4 text-blue-600" />
              {diyEstimate.timeRange}
            </span>
            <span className="flex items-center gap-1 text-green-700">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total parts: {diyEstimate.totalPartsRange}
            </span>
          </div>
          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100" asChild>
            <a
              href={buildAmazonSearchLink("auto repair parts", vehicleStr)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBrowseAll}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Browse All Parts
            </a>
          </Button>
        </div>
      )}
      {source === "ai" && (
        <p className="mt-2 text-xs text-blue-600/60 text-center">
          Recommendations powered by AI — verify fitment for your specific vehicle
        </p>
      )}
    </div>
  );
};

export default DIYProductSection;
