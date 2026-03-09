import ShopCard, { type Shop } from "./ShopCard";
import { Loader2 } from "lucide-react";

interface ShopListProps {
  shops: Shop[];
  loading?: boolean;
  onShopSelect?: (shop: Shop) => void;
}

export default function ShopList({ shops, loading, onShopSelect }: ShopListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No shops found in this area.</p>
        <p className="text-sm text-muted-foreground mt-2">Try searching a different ZIP code.</p>
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
