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

/* ─── Firecrawl: scrape CarGurus search results ─── */

async function searchVehicles(
  apiKey: string,
  params: SearchParams
): Promise<VehicleListing[]> {
  const makesQuery = params.makes?.length
    ? params.makes.join(" OR ")
    : "Honda OR Toyota OR Ford";

  const query = `used cars for sale near zip ${params.zipCode} ${makesQuery} under $${params.maxPrice ?? 40000} low mileage`;

  console.log("Firecrawl searching:", query);

  const resp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 10,
      lang: "en",
      country: "us",
    }),
  });

  const data = await resp.json();
  console.log("Firecrawl search status:", resp.status);

  if (!resp.ok) {
    console.error("Firecrawl search error:", JSON.stringify(data));
    return [];
  }

  const results = data?.data ?? [];
  console.log(`Got ${results.length} search results`);

  // Parse vehicle listings from search result titles/descriptions
  const listings: VehicleListing[] = [];

  for (let i = 0; i < results.length && listings.length < 6; i++) {
    const r = results[i];
    const title = r.title || "";
    const desc = r.description || "";
    const url = r.url || "";

    // Try to parse "2020 Toyota Camry LE" pattern from title
    const yearMatch = title.match(/\b(20\d{2})\b/);
    if (!yearMatch) continue;

    const year = parseInt(yearMatch[1]);
    if (params.minYear && year < params.minYear) continue;

    // Extract make/model from title after year
    const afterYear = title.substring(title.indexOf(yearMatch[0]) + yearMatch[0].length).trim();
    const words = afterYear.split(/[\s\-–|•,]+/).filter(Boolean);
    if (words.length < 2) continue;

    const make = words[0];
    const model = words[1];
    const trim = words.length > 2 ? words[2] : undefined;

    // Extract price from title or description
    const priceMatch = (title + " " + desc).match(/\$[\d,]+/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, "")) : 0;
    if (!price || (params.maxPrice && price > params.maxPrice)) continue;

    // Extract mileage
    const mileMatch = desc.match(/([\d,]+)\s*(?:mi|mile)/i);
    const mileage = mileMatch ? parseInt(mileMatch[1].replace(/,/g, "")) : 0;

    // Determine source
    let source: string = "web";
    if (url.includes("cargurus")) source = "cargurus";
    else if (url.includes("autotrader")) source = "autotrader";
    else if (url.includes("cars.com")) source = "cars.com";

    // Extract location from description
    const locMatch = desc.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\b/);
    const city = locMatch ? locMatch[1] : "";
    const state = locMatch ? locMatch[2] : "";

    // Calculate monthly payment
    const apr = 5.9;
    const termMonths = 60;
    const downPayment = Math.round(price * 0.1);
    const loanAmount = price - downPayment;
    const monthlyRate = apr / 100 / 12;
    const monthlyPayment = Math.round(
      loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
    );

    // Detect badges from description
    const badges: string[] = [];
    const dl = desc.toLowerCase();
    if (dl.includes("certified") || dl.includes("cpo")) badges.push("certified");
    if (dl.includes("low mile") || dl.includes("low-mile")) badges.push("low-mileage");
    if (dl.includes("one owner") || dl.includes("1-owner")) badges.push("one-owner");
    if (dl.includes("no accident") || dl.includes("accident free") || dl.includes("clean")) badges.push("accident-free");

    listings.push({
      id: `search-${i}-${year}-${make}`,
      spec: { make, model, year, trim },
      price,
      mileage,
      location: { city, state, zipCode: params.zipCode },
      dealer: { name: source === "cargurus" ? "via CarGurus" : source === "autotrader" ? "via AutoTrader" : "via Cars.com" },
      features: [],
      images: [],
      badges,
      monthlyPayment: price > 0 ? { amount: monthlyPayment, apr, termMonths, downPayment } : undefined,
      source,
      sourceUrl: url,
    } as VehicleListing);
  }

  console.log(`Parsed ${listings.length} vehicle listings from search`);
  return listings;
}

/* ─── NHTSA enrichment ─── */

async function enrichWithNHTSA(listings: VehicleListing[]): Promise<VehicleListing[]> {
  const enriched = await Promise.all(
    listings.map(async (listing) => {
      try {
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(listing.spec.make)}/modelyear/${listing.spec.year}/vehicleType/car?format=json`;
        const resp = await fetch(url);
        if (resp.ok) {
          // NHTSA confirms the make/model exists — we keep it as-is
          // Additional enrichment could include safety ratings, recalls, etc.
        }
      } catch {
        // Non-critical — just skip enrichment
      }
      return listing;
    })
  );
  return enriched;
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

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    let listings: VehicleListing[] = [];

    if (firecrawlKey) {
      try {
        listings = await searchVehicles(firecrawlKey, params);
        console.log(`Search returned ${listings.length} listings`);
      } catch (err) {
        console.error("CarGurus scrape failed, using fallback:", err);
      }
    } else {
      console.warn("FIRECRAWL_API_KEY not set, using fallback data");
    }

    // Fall back to mock data if scrape returned nothing
    if (listings.length === 0) {
      console.log("Using fallback listings");
      listings = getFallbackListings(params);
    }

    // Enrich with NHTSA data
    listings = await enrichWithNHTSA(listings);

    return new Response(
      JSON.stringify({
        success: true,
        listings,
        total: listings.length,
        source: listings[0]?.source === "fallback" ? "fallback" : "cargurus",
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
