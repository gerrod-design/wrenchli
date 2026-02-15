import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ShoppingCart, Package } from "lucide-react";
import type { ProductRecommendation } from "@/data/adRecommendations";

const DIYProductCard = ({
  product,
  onTrack,
}: {
  product: ProductRecommendation;
  onTrack?: (p: ProductRecommendation) => void;
}) => (
  <Card className="hover:shadow-md transition-shadow duration-200 p-3">
    <CardContent className="p-0">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          {product.badge && (
            <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-orange-500 text-white">
              {product.badge}
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.title}</h4>
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm">{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">{product.originalPrice}</span>
            )}
            {product.prime && <Badge className="text-xs bg-blue-600 text-white px-1 py-0">Prime</Badge>}
          </div>
          <Button size="sm" className="w-full text-xs" asChild>
            <a href={product.link} target="_blank" rel="noopener noreferrer" onClick={() => onTrack?.(product)}>
              <ShoppingCart className="h-3 w-3 mr-1" /> View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DIYProductCard;
