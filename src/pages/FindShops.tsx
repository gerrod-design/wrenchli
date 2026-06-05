import { useState } from "react";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Loader2, LocateFixed } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShopMap from "@/components/shops/ShopMap";
import ShopList from "@/components/shops/ShopList";
import { type ShopFilter } from "@/components/shops/ShopList";
import { type Shop } from "@/components/shops/ShopCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WaitlistForm from "@/components/WaitlistForm";
import { BellRing } from "lucide-react";

const SERVICE_TYPES = [
  { value: "general", label: "All Services" },
  { value: "brakes", label: "Brakes" },
  { value: "engine", label: "Engine" },
  { value: "transmission", label: "Transmission" },
  { value: "electrical", label: "Electrical" },
  { value: "oil_change", label: "Oil Change" },
  { value: "tires", label: "Tires" },
  { value: "european", label: "European / Luxury" },
  { value: "domestic", label: "Domestic" },
  { value: "ac_service", label: "A/C Service" },
];

const PRICE_TIERS = [
  { value: "all", label: "Any Price" },
  { value: "budget", label: "$ — Budget" },
  { value: "mid", label: "$$ — Mid-Range" },
  { value: "premium", label: "$$$ — Premium" },
];

const VEHICLE_MAKES = [
  { value: "any", label: "Any Vehicle" },
  { value: "BMW", label: "BMW" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Audi", label: "Audi" },
  { value: "Lexus", label: "Lexus" },
  { value: "Ford", label: "Ford" },
  { value: "Chevrolet", label: "Chevrolet" },
  { value: "Toyota", label: "Toyota" },
  { value: "Honda", label: "Honda" },
  { value: "Volkswagen", label: "Volkswagen" },
];

export default function FindShops() {
  const [zipCode, setZipCode] = useState("");
  const [serviceType, setServiceType] = useState("general");
  const [priceTier, setPriceTier] = useState("all");
  const [vehicleMake, setVehicleMake] = useState("any");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopFilter, setShopFilter] = useState<ShopFilter>("all");

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const zip = data?.address?.postcode?.slice(0, 5);
          if (zip) {
            setZipCode(zip);
            toast.success(`Located ZIP: ${zip}`);
          } else {
            toast.error("Could not determine your ZIP code.");
          }
        } catch {
          toast.error("Failed to look up your location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Location access denied. Please enter your ZIP manually.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

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
      const { data, error } = await supabase.functions.invoke("find-shops", {
        body: {
          location: zip,
          service_type: serviceType,
          price_range: priceTier === "all" ? null : priceTier,
          vehicle_make: vehicleMake === "any" ? null : vehicleMake,
        },
      });

      if (error) throw error;

      const providers: Shop[] = (data.providers || []).map((p: any) => ({
        ...p,
        price_tier: p.price_tier as Shop["price_tier"],
        availability: p.availability as Shop["availability"],
      }));

      setShops(providers);
      if (data.center) setMapCenter(data.center);
      toast.success(`Found ${providers.length} shops near ${zip} (${data.city || "Metro Area"})`);
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
              {/* Search Bar */}
              <div className="flex flex-col gap-3 max-w-lg mx-auto">
                <div className="flex gap-2">
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleLocateMe}
                          disabled={locating}
                          className="h-12 px-3 bg-background text-foreground border-border hover:bg-muted"
                        >
                          {locating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <LocateFixed className="h-5 w-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detect my ZIP code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                {/* Filters */}
                <div className="grid grid-cols-3 gap-3">
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="h-10 bg-background text-foreground border-border">
                      <SelectValue placeholder="Service Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priceTier} onValueChange={setPriceTier}>
                    <SelectTrigger className="h-10 bg-background text-foreground border-border">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_TIERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={vehicleMake} onValueChange={setVehicleMake}>
                    <SelectTrigger className="h-10 bg-background text-foreground border-border">
                      <SelectValue placeholder="Vehicle Make" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_MAKES.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <ShopList shops={shops} loading={loading} onShopSelect={setSelectedShop} searchedZip={searched ? zipCode : undefined} filter={shopFilter} onFilterChange={setShopFilter} />
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
