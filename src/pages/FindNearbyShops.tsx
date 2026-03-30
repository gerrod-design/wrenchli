import { useState } from "react";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Loader2, Star, Phone, ExternalLink, ChevronLeft, ChevronRight, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YelpReview {
  text: string;
  rating: number;
  user_name: string;
  time_created: string;
}

interface YelpShop {
  id: string;
  name: string;
  url: string;
  image_url: string;
  photos: string[];
  rating: number;
  review_count: number;
  price: string | null;
  phone: string | null;
  address: string;
  coordinates: { latitude: number; longitude: number } | null;
  categories: string[];
  distance_miles: number | null;
  is_closed: boolean;
  reviews: YelpReview[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= Math.round(rating)
              ? "fill-accent text-accent"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const display = photos.slice(0, 3);
  if (!display.length) {
    return (
      <div className="w-full aspect-[16/10] rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
        No photos available
      </div>
    );
  }
  return (
    <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden group">
      <img
        src={display[idx]}
        alt={`${name} photo ${idx + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {display.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + display.length) % display.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % display.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {display.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-accent" : "bg-background/60"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShopCard({ shop }: { shop: YelpShop }) {
  const firstReview = shop.reviews[0];
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/60">
      <CardContent className="p-0">
        <PhotoCarousel photos={shop.photos} name={shop.name} />
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <a
                href={shop.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold font-heading text-foreground hover:text-accent transition-colors inline-flex items-center gap-1.5"
              >
                {shop.name}
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              </a>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StarRating rating={shop.rating} />
                <span className="text-sm text-muted-foreground">
                  {shop.rating} ({shop.review_count} reviews)
                </span>
                {shop.price && (
                  <Badge variant="secondary" className="text-xs">{shop.price}</Badge>
                )}
              </div>
            </div>
            {shop.is_closed && (
              <Badge variant="destructive" className="text-xs shrink-0">Closed</Badge>
            )}
          </div>

          {/* Categories */}
          {shop.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {shop.categories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
              ))}
            </div>
          )}

          {/* Address & Phone */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
              <span>{shop.address}</span>
            </div>
            {shop.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <a href={`tel:${shop.phone}`} className="hover:text-foreground transition-colors">
                  {shop.phone}
                </a>
              </div>
            )}
            {shop.distance_miles != null && (
              <p className="text-xs text-muted-foreground/70 ml-6">
                ~{shop.distance_miles} miles away
              </p>
            )}
          </div>

          {/* Review excerpt */}
          {firstReview && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium">{firstReview.user_name}</span>
                <StarRating rating={firstReview.rating} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                "{firstReview.text}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button asChild variant="default" size="sm" className="flex-1">
              <a href={shop.url} target="_blank" rel="noopener noreferrer">
                View on Yelp
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a href={`/contact?shop=${encodeURIComponent(shop.name)}&source=yelp`}>
                Report Outcome
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const RADIUS_OPTIONS = [
  { value: "1609", label: "1 mile" },
  { value: "4828", label: "3 miles" },
  { value: "8047", label: "5 miles" },
  { value: "16093", label: "10 miles" },
  { value: "40000", label: "25 miles" },
];

export default function FindNearbyShops() {
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("8047");
  const [shops, setShops] = useState<YelpShop[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const loc = location.trim();
    if (!loc) {
      toast.error("Please enter a location.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("yelp-search", {
        body: { location: loc, radius: Number(radius), limit: 10 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setShops(data.shops || []);
      setTotal(data.total || 0);
      if (!data.shops?.length) {
        toast.info("No auto repair shops found. Try a different location or wider radius.");
      }
    } catch (err: any) {
      console.error("[FindNearbyShops]", err);
      toast.error(err.message || "Search failed. Please try again.");
      setShops([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <SEO
        title="Find Nearby Auto Repair Shops"
        description="Search for top-rated auto repair shops near you. See ratings, reviews, photos, and contact info powered by Yelp."
        path="/find-nearby-shops"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
            Find Nearby Auto Repair Shops
          </h1>
          <p className="text-primary-foreground/70 text-base md:text-lg">
            Search top-rated shops by location. See real ratings, photos, and reviews from Yelp.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="container mx-auto px-4 -mt-6 relative z-10 max-w-3xl">
        <div className="bg-card rounded-xl shadow-lg border border-border/60 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder='City, State or ZIP (e.g. "Detroit, MI")'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find Shops
            </Button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 mt-8 max-w-5xl">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-muted-foreground">Searching Yelp for auto repair shops…</p>
          </div>
        )}

        {!loading && searched && shops.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No shops found for this location.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try a different city or increase the search radius.</p>
          </div>
        )}

        {!loading && shops.length > 0 && (
          <SectionReveal>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {shops.length} of {total.toLocaleString()} results
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </SectionReveal>
        )}
      </section>

      {/* Yelp Attribution */}
      {searched && (
        <div className="container mx-auto px-4 mt-12 text-center">
          <p className="text-xs text-muted-foreground/50 flex items-center justify-center gap-1.5">
            Powered by
            <a
              href="https://www.yelp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors"
            >
              <img
                src="https://s3-media0.fl.yelpcdn.com/assets/public/cookbook.yji-0a2bf0e8a63f67d3274c.svg"
                alt="Yelp"
                className="h-4"
              />
              Yelp
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
