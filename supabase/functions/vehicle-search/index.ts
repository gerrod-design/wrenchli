const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchParams {
  zipCode: string;
  maxDistance?: number;
  minYear?: number;
  maxYear?: number;
  maxPrice?: number;
  maxMileage?: number;
  makes?: string[];
}

interface VehicleListing {
  id: string;
  spec: {
    make: string;
    model: string;
    year: number;
    trim?: string;
    bodyStyle?: string;
    engine?: string;
    transmission?: string;
    drivetrain?: string;
    fuelType?: string;
    mpgCity?: number;
    mpgHighway?: number;
  };
  price: number;
  mileage: number;
  location: { city: string; state: string; zipCode: string; distance?: number };
  dealer: { name: string; rating?: number; reviewCount?: number };
  features: string[];
  images: string[];
  badges: string[];
  monthlyPayment?: { amount: number; apr: number; termMonths: number; downPayment: number };
  source: string;
  sourceUrl: string;
  daysOnMarket?: number;
}

/* ─── In-memory cache (per isolate) ─── */

const cache = new Map<string, { listings: VehicleListing[]; ts: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCacheKey(params: SearchParams): string {
  return JSON.stringify({
    z: params.zipCode,
    d: params.maxDistance ?? 50,
    y0: params.minYear,
    y1: params.maxYear,
    p: params.maxPrice,
    m: params.maxMileage,
    mk: params.makes?.sort(),
  });
}

/* ─── MarketCheck API ─── */

async function searchMarketCheck(
  apiKey: string,
  params: SearchParams
): Promise<VehicleListing[]> {
  const url = new URL("https://mc-api.marketcheck.com/v2/search/car/active");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("zip", params.zipCode);
  url.searchParams.set("radius", String(params.maxDistance ?? 50));
  url.searchParams.set("rows", "6");
  url.searchParams.set("car_type", "used");

  if (params.makes?.length) {
    url.searchParams.set("make", params.makes.join(","));
  }
  if (params.minYear) url.searchParams.set("year_range", `${params.minYear}-${params.maxYear ?? 2026}`);
  if (params.maxPrice) url.searchParams.set("price_range", `0-${params.maxPrice}`);
  if (params.maxMileage) url.searchParams.set("miles_range", `0-${params.maxMileage}`);

  console.log("MarketCheck query:", url.toString().replace(apiKey, "***"));

  const resp = await fetch(url.toString());
  const data = await resp.json();

  if (!resp.ok) {
    console.error("MarketCheck error:", JSON.stringify(data));
    return [];
  }

  const results = data?.listings ?? [];
  console.log(`MarketCheck returned ${results.length} listings`);

  return results.map((r: any) => {
    const price = r.price ?? 0;
    const apr = 5.9;
    const termMonths = 60;
    const downPayment = Math.round(price * 0.1);
    const loanAmount = price - downPayment;
    const monthlyRate = apr / 100 / 12;
    const monthlyPayment = loanAmount > 0
      ? Math.round(loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1))
      : 0;

    const badges: string[] = [];
    if (r.is_certified) badges.push("certified");
    if ((r.miles ?? 0) < 40000) badges.push("low-mileage");
    if (r.one_owner) badges.push("one-owner");
    if (r.clean_title) badges.push("accident-free");

    return {
      id: r.id ?? `mc-${r.vin ?? Math.random().toString(36).slice(2)}`,
      spec: {
        make: r.build?.make ?? r.make ?? "",
        model: r.build?.model ?? r.model ?? "",
        year: r.build?.year ?? r.year ?? 0,
        trim: r.build?.trim ?? r.trim,
        bodyStyle: r.build?.body_type ?? r.body_type,
        engine: r.build?.engine ?? r.engine,
        transmission: r.build?.transmission ?? r.transmission,
        drivetrain: r.build?.drivetrain ?? r.drivetrain,
        fuelType: r.build?.fuel_type ?? r.fuel_type,
        mpgCity: r.build?.city_miles,
        mpgHighway: r.build?.highway_miles,
      },
      price,
      mileage: r.miles ?? 0,
      location: {
        city: r.dealer?.city ?? "",
        state: r.dealer?.state ?? "",
        zipCode: r.dealer?.zip ?? params.zipCode,
        distance: r.dist,
      },
      dealer: {
        name: r.dealer?.name ?? "Dealer",
        rating: r.dealer?.rating,
        reviewCount: r.dealer?.review_count,
      },
      features: r.extra?.features ?? [],
      images: r.media?.photo_links?.slice(0, 5) ?? [],
      badges,
      monthlyPayment: price > 0 ? { amount: monthlyPayment, apr, termMonths, downPayment } : undefined,
      source: "marketcheck",
      sourceUrl: r.vdp_url ?? "",
      daysOnMarket: r.dom,
    } as VehicleListing;
  });
}

/* ─── Fallback mock data ─── */

function getFallbackListings(params: SearchParams): VehicleListing[] {
  const listings: VehicleListing[] = [
    {
      id: "fb-1",
      spec: { make: "Honda", model: "Accord", year: 2019, trim: "LX", bodyStyle: "Sedan", engine: "1.5L Turbo I4", transmission: "CVT", drivetrain: "FWD", fuelType: "Gasoline", mpgCity: 30, mpgHighway: 38 },
      price: 22995, mileage: 45000,
      location: { city: "Detroit", state: "MI", zipCode: params.zipCode },
      dealer: { name: "Metro Honda", rating: 4.2, reviewCount: 847 },
      features: ["Backup Camera", "Bluetooth", "Honda Sensing", "Keyless Entry"],
      images: [], badges: ["certified", "one-owner"],
      monthlyPayment: { amount: 389, apr: 4.9, termMonths: 60, downPayment: 2000 },
      source: "fallback", sourceUrl: "https://www.autotrader.com/cars-for-sale/certified/honda/accord",
      daysOnMarket: 12,
    },
    {
      id: "fb-2",
      spec: { make: "Toyota", model: "Camry", year: 2020, trim: "LE", bodyStyle: "Sedan", engine: "2.5L I4", transmission: "Automatic", drivetrain: "FWD", fuelType: "Gasoline", mpgCity: 28, mpgHighway: 39 },
      price: 24450, mileage: 32000,
      location: { city: "Dearborn", state: "MI", zipCode: params.zipCode },
      dealer: { name: "Toyota of Dearborn", rating: 4.5, reviewCount: 1203 },
      features: ["Apple CarPlay", "Lane Assist", "Auto Emergency Braking"],
      images: [], badges: ["low-mileage", "warranty"],
      monthlyPayment: { amount: 425, apr: 3.9, termMonths: 60, downPayment: 2500 },
      source: "fallback", sourceUrl: "https://www.cars.com/vehicledetail/detail/456789",
      daysOnMarket: 8,
    },
    {
      id: "fb-3",
      spec: { make: "Ford", model: "Escape", year: 2018, trim: "SE", bodyStyle: "SUV", engine: "1.5L Turbo I4", transmission: "Automatic", drivetrain: "AWD", fuelType: "Gasoline", mpgCity: 23, mpgHighway: 30 },
      price: 19999, mileage: 52000,
      location: { city: "Southfield", state: "MI", zipCode: params.zipCode },
      dealer: { name: "Bill Brown Ford", rating: 3.9, reviewCount: 543 },
      features: ["AWD", "Heated Seats", "Sync 3", "Roof Rails"],
      images: [], badges: ["accident-free"],
      monthlyPayment: { amount: 349, apr: 5.9, termMonths: 60, downPayment: 1500 },
      source: "fallback", sourceUrl: "https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action",
      daysOnMarket: 23,
    },
  ];

  return listings.filter((l) => {
    if (params.maxPrice && l.price > params.maxPrice) return false;
    if (params.maxMileage && l.mileage > params.maxMileage) return false;
    if (params.minYear && l.spec.year < params.minYear) return false;
    if (params.makes?.length && !params.makes.includes(l.spec.make)) return false;
    return true;
  });
}

/* ─── Main handler ─── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SearchParams = await req.json();

    if (!params.zipCode) {
      return new Response(
        JSON.stringify({ success: false, error: "zipCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = getCacheKey(params);
    const cached = cache.get(cacheKey);
    let listings: VehicleListing[];
    let fromCache = false;

    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log("Cache hit for", params.zipCode);
      listings = cached.listings;
      fromCache = true;
    } else {
      listings = [];
      const marketCheckKey = Deno.env.get("MARKETCHECK_API_KEY");

      if (marketCheckKey) {
        try {
          listings = await searchMarketCheck(marketCheckKey, params);
        } catch (err) {
          console.error("MarketCheck search failed, using fallback:", err);
        }
      } else {
        console.warn("MARKETCHECK_API_KEY not set, using fallback data");
      }

      if (listings.length === 0) {
        console.log("Using fallback listings");
        listings = getFallbackListings(params);
      }

      // Cache results (evict old entries if cache grows too large)
      if (cache.size > 50) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
        if (oldest) cache.delete(oldest[0]);
      }
      cache.set(cacheKey, { listings, ts: Date.now() });
    }

    return new Response(
      JSON.stringify({
        success: true,
        listings,
        total: listings.length,
        source: listings[0]?.source === "fallback" ? "fallback" : "marketcheck",
        cached: fromCache,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Vehicle search error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
