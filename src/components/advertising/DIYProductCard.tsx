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
  <Card className="hover:shadow-md transition-shadow duration-200 p-3" role="article" aria-label={`Product: ${product.title}`}>
    <CardContent className="p-0">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center" aria-hidden="true">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          {product.badge && (
            <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-accent text-accent-foreground">
              {product.badge}
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.title}</h4>
          <div className="flex items-center gap-1 mb-1" role="img" aria-label={`Rated ${product.rating} out of 5 stars, ${product.reviewCount.toLocaleString()} reviews`}>
            <div className="flex items-center" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? "text-ad-star fill-current" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm" aria-label={`Price: ${product.price}`}>{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through" aria-label={`Original price: ${product.originalPrice}`}>{product.originalPrice}</span>
            )}
            {product.prime && <Badge className="text-xs bg-primary text-primary-foreground px-1 py-0">Prime</Badge>}
          </div>
          <Button size="sm" className="w-full text-xs" asChild>
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrack?.(product)}
              aria-label={`View ${product.title} on Amazon (opens in new tab)`}
            >
              <ShoppingCart className="h-3 w-3 mr-1" aria-hidden="true" /> View on Amazon
            </a>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default DIYProductCard;
