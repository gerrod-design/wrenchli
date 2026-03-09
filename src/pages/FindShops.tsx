import { useState } from "react";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import ShopMap from "@/components/shops/ShopMap";
import ShopList from "@/components/shops/ShopList";
import { type Shop } from "@/components/shops/ShopCard";
import { toast } from "sonner";

const geocodeZipCode = async (zipCode: string): Promise<{ lat: number; lng: number }> => {
  const mockCoordinates: Record<string, { lat: number; lng: number }> = {
    "48201": { lat: 42.3314, lng: -83.0458 },
    "48091": { lat: 42.4897, lng: -83.0148 },
    "48084": { lat: 42.5803, lng: -83.1458 },
    "48009": { lat: 42.5467, lng: -83.2113 },
    "48315": { lat: 42.5803, lng: -83.0302 },
  };
  return mockCoordinates[zipCode] || { lat: 42.3314, lng: -83.0458 };
};

const generateMockShops = (zipCode: string): Shop[] => {
  const baseCoords = { lat: 42.3314, lng: -83.0458 };
  const baseShops = [
    { name: "AutoCare Express", specialties: ["general", "brakes", "oil-change"], price_tier: "budget", rating: 4.2, review_count: 142, latOff: 0.02, lngOff: 0.01 },
    { name: "Precision Motors", specialties: ["european", "diagnostics", "transmission"], price_tier: "premium", rating: 4.8, review_count: 389, latOff: -0.01, lngOff: 0.03 },
    { name: "QuickFix Auto Service", specialties: ["general", "tires", "alignment"], price_tier: "mid", rating: 4.5, review_count: 256, latOff: 0.03, lngOff: -0.02 },
    { name: "Metro Automotive", specialties: ["domestic", "engine", "electrical"], price_tier: "mid", rating: 4.3, review_count: 178, latOff: -0.02, lngOff: -0.01 },
    { name: "Elite Auto Repair", specialties: ["luxury", "bmw", "mercedes"], price_tier: "premium", rating: 4.7, review_count: 298, latOff: 0.01, lngOff: 0.04 },
    { name: "Budget Auto Works", specialties: ["general", "brakes", "suspension"], price_tier: "budget", rating: 4.0, review_count: 97, latOff: -0.03, lngOff: 0.02 },
  ];

  return baseShops.map((s, i) => ({
    id: `shop-${zipCode}-${i}`,
    name: s.name,
    rating: s.rating,
    review_count: s.review_count,
    address: `${1000 + i * 100} Main St, Detroit, MI ${zipCode}`,
    phone: `(313) ${200 + i}-${1000 + i * 111}`,
    distance_miles: 1.5 + i * 0.8,
    specialties: s.specialties,
    price_tier: s.price_tier,
    response_time: i % 2 === 0 ? "within 1 hour" : "within 2 hours",
    availability: (i % 3 === 0 ? "same_day" : i % 3 === 1 ? "next_day" : "within_week") as const,
    wrenchli_verified: i % 2 === 0,
    quote_url: `/get-quote?shop=shop-${zipCode}-${i}`,
    booking_url: i % 3 === 0 ? `/schedule?shop=shop-${zipCode}-${i}` : undefined,
    lat: baseCoords.lat + s.latOff,
    lng: baseCoords.lng + s.lngOff,
  }));
};

export default function FindShops() {
  const [zipCode, setZipCode] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const handleSearch = async () => {
    const zip = zipCode.replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) {
      toast.error("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setLoading(true);
    setSearched(true);
    setSelectedShop(null);
    try {
      const coords = await geocodeZipCode(zip);
      setMapCenter(coords);

      const mockShops = generateMockShops(zip);
      setShops(mockShops);
      toast.success(`Found ${mockShops.length} shops near ${zip}`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search shops. Please try again.");
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Find Auto Repair Shops Near You — Wrenchli"
        description="Search for trusted auto repair shops in your area. Compare prices, read reviews, and book appointments online."
        path="/find-shops"
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 md:py-16">
        <div className="container-wrenchli">
          <SectionReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
                Find Trusted Auto Repair Shops
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Search by ZIP code to discover verified repair shops near you. Compare ratings, prices, and availability.
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="pl-10 h-12 text-base bg-background text-foreground"
                    maxLength={5}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Searching...</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5" />Search</>
                  )}
                </Button>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Results */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli">
          {!searched ? (
            <div className="text-center py-12 max-w-2xl mx-auto">
              <SectionReveal>
                <div className="bg-card border border-border rounded-lg p-8">
                  <MapPin className="h-16 w-16 text-accent mx-auto mb-4" />
                  <h2 className="font-heading text-2xl font-semibold mb-3">Ready to Find Your Shop?</h2>
                  <p className="text-muted-foreground mb-6">
                    Enter your ZIP code above to see trusted auto repair shops in your area.
                  </p>
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    {["Verified shop ratings and reviews", "Transparent pricing tiers", "Quick response times"].map((t) => (
                      <div key={t} className="flex items-center gap-2 justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionReveal>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <SectionReveal delay={0}>
                <div className="sticky top-20">
                  <h2 className="font-heading text-xl font-semibold mb-4">Map View</h2>
                  <div className="h-[500px] lg:h-[600px]">
                    <ShopMap shops={shops} center={mapCenter} selectedShop={selectedShop} onShopClick={setSelectedShop} />
                  </div>
                </div>
              </SectionReveal>
              <SectionReveal delay={100}>
                <ShopList shops={shops} loading={loading} onShopSelect={setSelectedShop} />
              </SectionReveal>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl text-center">
          <SectionReveal>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Don't See Your Favorite Shop?</h2>
            <p className="text-muted-foreground mb-6">
              Know a great repair shop we should add to Wrenchli? Let us know and we'll reach out to them.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <a href="/contact?subject=recommend-shop">Recommend a Shop</a>
            </Button>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
