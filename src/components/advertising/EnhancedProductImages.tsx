import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Package, Loader2 } from "lucide-react";
import productImageMap from "@/data/productImageMap";

export interface ProductImageData {
  url: string;
  alt: string;
}

export interface EnhancedProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewCount: number;
  brand: string;
  link: string;
  category: string;
  prime?: boolean;
  badge?: string;
  images?: ProductImageData[];
  imageUrl?: string;
  asin?: string;
}

export const getAmazonImageUrl = (asin: string, size: "small" | "medium" | "large" = "medium"): string => {
  const sizeMap = { small: "SL160", medium: "SL300", large: "SL500" };
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.${sizeMap[size]}.jpg`;
};

export const resolveProductImages = (product: EnhancedProduct): ProductImageData[] => {
  if (product.images && product.images.length > 0) return product.images;

  // Prefer local curated image from the image map
  const localImage = productImageMap[product.id];
  if (localImage) {
    return [{ url: localImage, alt: `${product.brand} ${product.title}` }];
  }

  // Then try explicit imageUrl on the product
  if (product.imageUrl) {
    return [{ url: product.imageUrl, alt: `${product.brand} ${product.title}` }];
  }

  // Fall back to ASIN-based Amazon image
  if (product.asin) {
    return [{ url: getAmazonImageUrl(product.asin, "medium"), alt: `${product.brand} ${product.title}` }];
  }

  return [];
};

const ProductImageDisplay = ({
  product,
  size = "medium",
  className = "",
}: {
  product: EnhancedProduct;
  size?: "small" | "medium" | "large";
  className?: string;
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [images, setImages] = useState<ProductImageData[]>([]);

  const sizeClasses = { small: "w-12 h-12", medium: "w-16 h-16", large: "w-24 h-24" };

  useEffect(() => {
    const resolved = resolveProductImages(product);
    setImages(resolved);
    setState(resolved.length > 0 ? "loading" : "error");
    setCurrentIdx(0);
  }, [product.id, product.asin]);

  if (state === "error" || images.length === 0) {
    return (
      <div
        className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center ${className}`}
        aria-hidden="true"
      >
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  const current = images[currentIdx];

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {state === "loading" && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        src={current.url}
        alt={current.alt}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
        onLoad={() => setState("loaded")}
        onError={() => {
          if (currentIdx < images.length - 1) {
            setCurrentIdx((p) => p + 1);
            setState("loading");
          } else {
            setState("error");
          }
        }}
      />
      {product.badge && (
        <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0.5 bg-accent text-accent-foreground">
          {product.badge}
        </Badge>
      )}
      {images.length > 1 && state === "loaded" && (
        <div className="absolute bottom-0 right-0 bg-foreground/50 text-background text-xs px-1 rounded-tl">
          {currentIdx + 1}/{images.length}
        </div>
      )}
    </div>
  );
};

export default ProductImageDisplay;
