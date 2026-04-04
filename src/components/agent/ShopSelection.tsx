import { useState } from "react";
import { MapPin, Star, Shield, TrendingUp, ChevronRight, Award, Clock, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RankedShop } from "./types";

interface ShopSelectionProps {
  shops: RankedShop[];
  marketAvgCost: number | null;
  diagnosis: string;
  onSelectShop: (shop: RankedShop) => void;
  onBack: () => void;
}

export default function ShopSelection({ shops, marketAvgCost, diagnosis, onSelectShop, onBack }: ShopSelectionProps) {
  const [expandedShop, setExpandedShop] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
          <MapPin className="h-4 w-4" />
          Step 3 of 5: Select a Shop
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground">
          Top Ranked Shops
        </h2>
        <p className="text-muted-foreground mt-2">
          Ranked by success rate, price, satisfaction, and proximity.
          <br />
          <span className="text-xs">Every ranking factor is visible — no hidden algorithms.</span>
        </p>
      </div>

      <div className="space-y-4">
        {shops.map((shop, index) => (
          <div
            key={shop.id}
            className={cn(
              "bg-card rounded-2xl border shadow-sm transition-all overflow-hidden",
              index === 0 ? "border-accent ring-1 ring-accent/20" : "border-border"
            )}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold">
                        <Award className="h-3 w-3" />
                        #1 RANKED
                      </span>
                    )}
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        #{index + 1}
                      </span>
                    )}
                    {shop.isPartnered && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{shop.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {shop.address}{shop.city ? `, ${shop.city}` : ""}{shop.state ? `, ${shop.state}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {shop.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-foreground">{shop.rating}</span>
                      {shop.reviewCount && (
                        <span className="text-xs text-muted-foreground">({shop.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <TrendingUp className="h-3 w-3" />
                    Success Rate
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {shop.metrics.successRate !== null ? `${shop.metrics.successRate}%` : "New"}
                  </div>
                  {shop.metrics.totalJobs > 0 && (
                    <span className="text-[10px] text-muted-foreground">{shop.metrics.totalJobs} jobs</span>
                  )}
                </div>
                <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <DollarSign className="h-3 w-3" />
                    Avg Cost
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {shop.metrics.avgCost !== null ? `$${shop.metrics.avgCost}` : "—"}
                  </div>
                  {marketAvgCost && shop.metrics.avgCost !== null && (
                    <span className={cn(
                      "text-[10px]",
                      shop.metrics.avgCost <= marketAvgCost ? "text-accent" : "text-amber-500"
                    )}>
                      {shop.metrics.avgCost <= marketAvgCost ? "≤" : ">"} market avg
                    </span>
                  )}
                </div>
                <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                    <Star className="h-3 w-3" />
                    Satisfaction
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {shop.metrics.avgSatisfaction !== null ? `${shop.metrics.avgSatisfaction}/5` : "—"}
                  </div>
                </div>
              </div>

              {/* Why ranked */}
              <button
                onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}
                className="text-xs text-accent hover:underline mb-3 flex items-center gap-1"
              >
                Why ranked #{index + 1}?
                <ChevronRight className={cn("h-3 w-3 transition-transform", expandedShop === shop.id && "rotate-90")} />
              </button>

              {expandedShop === shop.id && (
                <div className="bg-accent/5 rounded-xl p-3 mb-3 space-y-1.5">
                  <p className="text-xs font-medium text-accent">Ranking Factors:</p>
                  {shop.rankingReasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                      <CheckCircle className="h-3 w-3 text-accent shrink-0" />
                      {reason}
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Score: {shop.score}/100 • Weights: Success 40%, Price 30%, Satisfaction 20%, Proximity 10%
                  </p>
                </div>
              )}

              {/* Select button */}
              <Button
                onClick={() => onSelectShop(shop)}
                className={cn(
                  "w-full font-bold",
                  index === 0
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                )}
              >
                Select This Shop
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {shops.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No shops found in your area yet.</p>
            <p className="text-sm mt-1">We're expanding our network. Try a broader search or check back soon.</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            ← Back to diagnosis
          </Button>
        </div>
      </div>
    </div>
  );
}
