import ShopCard, { type Shop } from "./ShopCard";
import { Loader2, MapPinOff, MessageSquarePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ShopListProps {
  shops: Shop[];
  loading?: boolean;
  onShopSelect?: (shop: Shop) => void;
  searchedZip?: string;
}

export default function ShopList({ shops, loading, onShopSelect, searchedZip }: ShopListProps) {
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
          <Link to="/for-shops">
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold">
          {shops.length} {shops.length === 1 ? "Shop" : "Shops"} Found
        </h2>
      </div>
      <div className="grid gap-4 md:gap-5">
        {shops.map((shop) => (
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
