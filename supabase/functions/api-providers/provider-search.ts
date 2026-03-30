import { type ServiceProvider } from "./types.ts";
import { getProvidersDatabase } from "./providers-database.ts";

/* ── Location Mapping ── */
const locationMap: Record<string, string> = {
  warren: "Warren",
  "48091": "Warren",
  birmingham: "Birmingham",
  "48009": "Birmingham",
  troy: "Troy",
  "48084": "Troy",
  sterling: "Sterling Heights",
  "48315": "Sterling Heights",
  "ann arbor": "Ann Arbor",
  "48104": "Ann Arbor",
  dearborn: "Dearborn",
  "48124": "Dearborn",
  livonia: "Livonia",
  "48150": "Livonia",
  detroit: "Detroit",
  "48201": "Detroit",
  "48202": "Detroit",
  "48203": "Detroit",
  "48204": "Detroit",
  "48205": "Detroit",
  "48206": "Detroit",
  "48207": "Detroit",
  "48208": "Detroit",
  "48209": "Detroit",
  "48210": "Detroit",
  "48211": "Detroit",
  "48212": "Detroit",
  "48213": "Detroit",
  "48214": "Detroit",
  "48215": "Detroit",
  "48216": "Detroit",
  "48217": "Detroit",
  "48219": "Detroit",
  "48221": "Detroit",
  "48223": "Detroit",
  "48224": "Detroit",
  "48226": "Detroit",
  "48227": "Detroit",
  "48228": "Detroit",
  "48234": "Detroit",
  "48235": "Detroit",
  "48238": "Detroit",
  southfield: "Southfield",
  "48075": "Southfield",
  "royal oak": "Royal Oak",
  "48067": "Royal Oak",
  farmington: "Farmington Hills",
  "48334": "Farmington Hills",
  novi: "Novi",
  "48375": "Novi",
  canton: "Canton",
  "48187": "Canton",
  // Ohio
  columbus: "Columbus",
  "43215": "Columbus",
  "43201": "Columbus",
  "43202": "Columbus",
  "43204": "Columbus",
  toledo: "Toledo",
  "43604": "Toledo",
  "43606": "Toledo",
  "43612": "Toledo",
  dublin: "Dublin",
  "43017": "Dublin",
  westerville: "Westerville",
  "43081": "Westerville",
  "bowling green": "Bowling Green",
  "43402": "Bowling Green",
  perrysburg: "Perrysburg",
  "43551": "Perrysburg",
};

const LUXURY_BRANDS = ["BMW", "Mercedes-Benz", "Audi", "Lexus"];

/* ── Location Filter ── */
function filterByLocation(
  providers: ServiceProvider[],
  location: string,
): ServiceProvider[] {
  const loc = location.toLowerCase();
  for (const [key, city] of Object.entries(locationMap)) {
    if (loc.includes(key)) {
      return providers.filter((p) => p.address.includes(city));
    }
  }
  return providers;
}

/* ── Provider Search ── */
export function findServiceProviders(params: {
  location: string;
  service_type: string;
  radius_miles: number;
  price_range: string | null;
  vehicle_make: string | null;
}): ServiceProvider[] {
  let results = filterByLocation(getProvidersDatabase(), params.location);

  if (params.price_range) {
    results = results.filter((p) => p.price_tier === params.price_range);
  }

  if (params.service_type && params.service_type !== "general") {
    results = results.filter(
      (p) =>
        p.specialties.includes(params.service_type) ||
        p.specialties.includes("general"),
    );
  }

  if (params.vehicle_make && LUXURY_BRANDS.includes(params.vehicle_make)) {
    results.sort((a, b) => {
      const aSpec = a.specialties.includes("european") || a.specialties.includes("luxury");
      const bSpec = b.specialties.includes("european") || b.specialties.includes("luxury");
      if (aSpec && !bSpec) return -1;
      if (!aSpec && bSpec) return 1;
      return b.rating - a.rating;
    });
  } else {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results.slice(0, 8);
}
