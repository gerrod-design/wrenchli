import ShopCard, { type Shop } from "./ShopCard";
import { Loader2, MapPinOff, MessageSquarePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Building2, Wrench, LayoutGrid } from "lucide-react";

export type ShopFilter = "all" | "shops" | "dealers";

interface ShopListProps {
  shops: Shop[];
  loading?: boolean;
  onShopSelect?: (shop: Shop) => void;
  searchedZip?: string;
  filter?: ShopFilter;
  onFilterChange?: (filter: ShopFilter) => void;
}

export default function ShopList({ shops, loading, onShopSelect, searchedZip, filter = "all", onFilterChange }: ShopListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MapPinOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-heading font-semibold mb-2">
          No Shops Found{searchedZip ? ` Near ${searchedZip}` : ""}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          We're currently expanding our verified shop network across Michigan and Ohio.
          Your area may not have coverage yet — but you can help us grow!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          <Link to="/contact?subject=recommend-shop">
            <Button variant="default" className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Recommend a Shop
            </Button>
          </Link>
          <Link to="/vehicle-insights">
            <Button variant="outline" className="gap-2">
              Get a Quote Instead
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
          <p className="text-sm font-medium mb-1">Currently Serving</p>
          <p className="text-xs text-muted-foreground">
            Metro Detroit • Ann Arbor • Grand Rapids • Flint • Lansing • Kalamazoo (MI)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Columbus • Cleveland • Cincinnati • Dayton • Akron • Toledo (OH)
          </p>
        </div>
      </div>
    );
  }

  const repairShops = shops.filter((s) => !s.is_dealer);
  const dealers = shops.filter((s) => s.is_dealer);

  const filteredShops = filter === "shops" ? repairShops
    : filter === "dealers" ? dealers
    : shops;

  return (
    <div className="space-y-4">
      {/* FTC Material Connection Disclosure */}
      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
        Wrenchli has a business relationship with the shops shown below. Partner shops have agreed to Wrenchli's transparency standards. This does not affect the content of your symptom assessment.
      </p>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-xl font-semibold">
          {filteredShops.length} {filteredShops.length === 1 ? "Result" : "Results"} Found
          {dealers.length > 0 && filter === "all" && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({repairShops.length} shops · {dealers.length} dealers)
            </span>
          )}
        </h2>
        {onFilterChange && dealers.length > 0 && (
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && onFilterChange(v as ShopFilter)}
            className="bg-muted rounded-lg p-0.5"
          >
            <ToggleGroupItem value="all" aria-label="Show all" className="gap-1.5 text-xs px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
              <LayoutGrid className="h-3.5 w-3.5" />
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="shops" aria-label="Shops only" className="gap-1.5 text-xs px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
              <Wrench className="h-3.5 w-3.5" />
              Shops
            </ToggleGroupItem>
            <ToggleGroupItem value="dealers" aria-label="Dealers only" className="gap-1.5 text-xs px-3 h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
              <Building2 className="h-3.5 w-3.5" />
              Dealers
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      <div className="grid gap-4 md:gap-5">
        {filteredShops.map((shop) => (
          <div
            key={shop.id}
            onClick={() => onShopSelect?.(shop)}
            className={onShopSelect ? "cursor-pointer" : ""}
          >
            <ShopCard shop={shop} />
          </div>
        ))}
      </div>
    </div>
  );
}
