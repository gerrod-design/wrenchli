/**
 * Product recommendations mapped to diagnosis categories.
 * Each entry uses real Amazon ASINs with a placeholder affiliate tag.
 *
 * To activate affiliate revenue:
 *   1. Replace YOUR_TAG-20 with your Amazon Associates tag
 *   2. Replace service referral links with your actual partner links
 */

// ── Config ──────────────────────────────────────────────────────────────────
const AFFILIATE_TAG = "wrenchli-20"; // placeholder — swap with real tag

export function buildAmazonLink(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`;
}

export function buildAmazonSearchLink(query: string, vehicleStr?: string): string {
  const full = vehicleStr ? `${query} ${vehicleStr}` : query;
  return `https://www.amazon.com/s?k=${encodeURIComponent(full)}&tag=${AFFILIATE_TAG}`;
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface ProductRecommendation {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  rating: number;
  reviewCount: number;
  brand: string;
  asin: string;
  link: string;
  badge?: string;
  prime?: boolean;
  category: "part" | "tool" | "supply";
  imageUrl?: string;
}

export interface ServiceRecommendation {
  id: string;
  company: string;
  service: string;
  description: string;
  price: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  cta: string;
  link: string;
}

export interface RecommendationSet {
  products: ProductRecommendation[];
  services: ServiceRecommendation[];
  diyEstimate?: { timeRange: string; totalPartsRange: string };
  source: "local" | "ai";
}

// ── Diagnosis keyword → category mapping ────────────────────────────────────
type DiagnosisCategory =
  | "brakes"
  | "engine_misfire"
  | "cooling"
  | "battery_electrical"
  | "oil_change"
  | "hvac"
  | "tire"
  | "transmission"
  | "fuel_system"
  | "emissions"
  | "evap"
  | "noise"
  | "general";

function classifyDiagnosis(diagnosis: string, code?: string): DiagnosisCategory {
  const d = diagnosis.toLowerCase();
  const c = (code || "").toUpperCase();

  if (d.includes("brake") || d.includes("rotor") || d.includes("caliper")) return "brakes";
  if (d.includes("misfire") || d.includes("spark plug") || d.includes("ignition") || c.match(/^P030[0-8]$/)) return "engine_misfire";
  if (d.includes("overheat") || d.includes("coolant") || d.includes("thermostat") || d.includes("radiator") || c === "P0128" || c === "P0217") return "cooling";
  if (d.includes("battery") || d.includes("alternator") || d.includes("starting") || d.includes("voltage") || c === "P0562") return "battery_electrical";
  if (d.includes("oil") || d.includes("oil change") || d.includes("oil filter")) return "oil_change";
  if (d.includes("hvac") || d.includes("air condition") || d.includes("a/c") || d.includes("cabin filter") || d.includes("heater")) return "hvac";
  if (d.includes("tire") || d.includes("tyre") || d.includes("flat") || d.includes("tread")) return "tire";
  if (d.includes("transmission") || c === "P0700" || c === "P0730") return "transmission";
  if (d.includes("lean") || d.includes("fuel pump") || d.includes("fuel filter") || d.includes("maf") || c === "P0171" || c === "P0174" || c === "P0230") return "fuel_system";
  if (d.includes("catalytic") || d.includes("egr") || d.includes("catalyst") || c === "P0420" || c === "P0401") return "emissions";
  if (d.includes("evap") || c.match(/^P04[4-5]\d$/)) return "evap";
  if (d.includes("noise") || d.includes("squeal") || d.includes("rattle") || d.includes("vibration")) return "noise";
  return "general";
}

// ── Product catalog by category ─────────────────────────────────────────────
const productCatalog: Record<DiagnosisCategory, ProductRecommendation[]> = {
  brakes: [
    {
      id: "brake-pads-bosch",
      title: "Bosch BC905 QuietCast Ceramic Brake Pad Set",
      description: "Premium ceramic pads — low dust, quiet braking, OE-quality fit",
      price: "$32.99",
      originalPrice: "$44.99",
      rating: 4.6,
      reviewCount: 14289,
      brand: "Bosch",
      asin: "B001GXQWJI",
      link: buildAmazonLink("B001GXQWJI"),
      badge: "Best Seller",
      prime: true,
      category: "part",
    },
    {
      id: "brake-caliper-tool",
      title: "OEMTOOLS 27045 Disc Brake Pad and Caliper Service Tool Kit",
      description: "18-piece universal brake caliper compression tool kit",
      price: "$29.99",
      rating: 4.5,
      reviewCount: 8742,
      brand: "OEMTOOLS",
      asin: "B00E3HFBXC",
      link: buildAmazonLink("B00E3HFBXC"),
      prime: true,
      category: "tool",
    },
    {
      id: "brake-cleaner",
      title: "CRC Brakleen Brake Parts Cleaner, 19 oz (12-Pack)",
      description: "Non-flammable, quick-dry formula removes brake fluid and grease",
      price: "$11.48",
      rating: 4.8,
      reviewCount: 22410,
      brand: "CRC",
      asin: "B000LDGGKE",
      link: buildAmazonLink("B000LDGGKE"),
      badge: "Amazon Choice",
      prime: true,
      category: "supply",
    },
  ],

  engine_misfire: [
    {
      id: "spark-plugs-ngk",
      title: "NGK 6619 Iridium IX Spark Plug (Set of 4)",
      description: "OEM-quality iridium plugs — improved ignitability and throttle response",
      price: "$27.56",
      originalPrice: "$35.96",
      rating: 4.7,
      reviewCount: 31482,
      brand: "NGK",
      asin: "B005JRAUYA",
      link: buildAmazonLink("B005JRAUYA"),
      badge: "Best Seller",
      prime: true,
      category: "part",
    },
    {
      id: "ignition-coil-delphi",
      title: "Delphi GN10328 Ignition Coil",
      description: "Direct-fit ignition coil for reliable spark delivery",
      price: "$24.99",
      rating: 4.4,
      reviewCount: 5129,
      brand: "Delphi",
      asin: "B000C9TUXY",
      link: buildAmazonLink("B000C9TUXY"),
      prime: true,
      category: "part",
    },
    {
      id: "spark-plug-socket",
      title: "EPAuto Spark Plug Socket Set (5/8\" & 13/16\")",
      description: "Magnetic retention, swivel head — fits most vehicles",
      price: "$12.97",
      rating: 4.6,
      reviewCount: 9843,
      brand: "EPAuto",
      asin: "B0BFR9W2RQ",
      link: buildAmazonLink("B0BFR9W2RQ"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
  ],

  cooling: [
    {
      id: "thermostat-stant",
      title: "Stant 45359 SuperStat Thermostat",
      description: "195°F, premium stainless steel — fits most domestic and import vehicles",
      price: "$11.99",
      rating: 4.5,
      reviewCount: 6832,
      brand: "Stant",
      asin: "B000C9SDBM",
      link: buildAmazonLink("B000C9SDBM"),
      prime: true,
      category: "part",
    },
    {
      id: "coolant-zerex",
      title: "Zerex G-05 Antifreeze/Coolant (1 Gallon)",
      description: "Phosphate-free, long-life formula — compatible with most vehicles",
      price: "$18.97",
      rating: 4.7,
      reviewCount: 11240,
      brand: "Zerex",
      asin: "B005JHFCDO",
      link: buildAmazonLink("B005JHFCDO"),
      badge: "Best Seller",
      prime: true,
      category: "supply",
    },
    {
      id: "coolant-funnel",
      title: "Lisle 24680 Spill-Free Funnel",
      description: "No-spill coolant fill system with universal adapter kit",
      price: "$38.99",
      rating: 4.6,
      reviewCount: 7654,
      brand: "Lisle",
      asin: "B009JXKEGI",
      link: buildAmazonLink("B009JXKEGI"),
      prime: true,
      category: "tool",
    },
  ],

  battery_electrical: [
    {
      id: "battery-terminal-cleaner",
      title: "CRC Battery Cleaner with Acid Indicator",
      description: "Neutralizes acid and removes corrosion on contact",
      price: "$6.49",
      rating: 4.7,
      reviewCount: 8912,
      brand: "CRC",
      asin: "B000CIMNHK",
      link: buildAmazonLink("B000CIMNHK"),
      badge: "Amazon Choice",
      prime: true,
      category: "supply",
    },
    {
      id: "battery-tester",
      title: "TOPDON BT100 12V Battery Tester",
      description: "100-2000 CCA — tests battery, starter, and charging system",
      price: "$29.99",
      rating: 4.4,
      reviewCount: 4328,
      brand: "TOPDON",
      asin: "B0C6JJJ55S",
      link: buildAmazonLink("B0C6JJJ55S"),
      prime: true,
      category: "tool",
    },
    {
      id: "jump-starter",
      title: "NOCO Boost Plus GB40 Jump Starter",
      description: "1000A 12V portable lithium jump starter — up to 6L gas / 3L diesel",
      price: "$99.95",
      rating: 4.7,
      reviewCount: 98420,
      brand: "NOCO",
      asin: "B015TKUPIC",
      link: buildAmazonLink("B015TKUPIC"),
      badge: "Best Seller",
      prime: true,
      category: "tool",
    },
  ],

  oil_change: [
    {
      id: "oil-mobil1",
      title: "Mobil 1 Advanced Full Synthetic 5W-30 (5 Qt)",
      description: "Outstanding engine protection, improved fuel economy",
      price: "$27.97",
      originalPrice: "$33.97",
      rating: 4.8,
      reviewCount: 45230,
      brand: "Mobil 1",
      asin: "B00I4E91GI",
      link: buildAmazonLink("B00I4E91GI"),
      badge: "Best Seller",
      prime: true,
      category: "supply",
    },
    {
      id: "oil-filter-fram",
      title: "FRAM Extra Guard Oil Filter",
      description: "SureGrip textured surface for easy removal — 95% dirt trapping efficiency",
      price: "$6.97",
      rating: 4.6,
      reviewCount: 18940,
      brand: "FRAM",
      asin: "B000C2WH3A",
      link: buildAmazonLink("B000C2WH3A"),
      badge: "Amazon Choice",
      prime: true,
      category: "part",
    },
    {
      id: "oil-drain-pan",
      title: "Hopkins FloTool 42003MI Drain Container (16 Qt)",
      description: "Wide catch area, built-in pour spout, anti-splash",
      price: "$12.97",
      rating: 4.5,
      reviewCount: 11283,
      brand: "FloTool",
      asin: "B000BQW5LK",
      link: buildAmazonLink("B000BQW5LK"),
      prime: true,
      category: "tool",
    },
  ],

  hvac: [
    {
      id: "cabin-filter-epauto",
      title: "EPAuto CP285 Premium Cabin Air Filter",
      description: "Activated carbon for odor control — fits most vehicles",
      price: "$10.49",
      rating: 4.5,
      reviewCount: 34120,
      brand: "EPAuto",
      asin: "B01C6L3XTA",
      link: buildAmazonLink("B01C6L3XTA"),
      badge: "Amazon Choice",
      prime: true,
      category: "part",
    },
    {
      id: "ac-recharge-acpro",
      title: "A/C Pro ACP-100 Refrigerant Recharge Kit",
      description: "R-134a with built-in gauge and hose — easy DIY AC recharge",
      price: "$39.99",
      rating: 4.3,
      reviewCount: 15680,
      brand: "A/C Pro",
      asin: "B008K2RPTE",
      link: buildAmazonLink("B008K2RPTE"),
      badge: "Best Seller",
      prime: true,
      category: "supply",
    },
    {
      id: "ac-leak-detector",
      title: "InterDynamics Leak Detection Kit with UV Dye",
      description: "Find AC leaks with UV dye and flashlight — no special tools needed",
      price: "$14.97",
      rating: 4.2,
      reviewCount: 3241,
      brand: "InterDynamics",
      asin: "B009YQ7GQ8",
      link: buildAmazonLink("B009YQ7GQ8"),
      prime: true,
      category: "tool",
    },
  ],

  tire: [
    {
      id: "tire-plug-kit",
      title: "Boulder Tools Heavy Duty Tire Repair Kit (56-Piece)",
      description: "Universal flat tire puncture repair — plugs, tools, and case included",
      price: "$16.99",
      rating: 4.5,
      reviewCount: 19432,
      brand: "Boulder Tools",
      asin: "B01LWUQT6V",
      link: buildAmazonLink("B01LWUQT6V"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
    {
      id: "tire-inflator",
      title: "AstroAI Portable Air Compressor Tire Inflator",
      description: "150 PSI, 12V DC — digital display, auto shut-off",
      price: "$29.99",
      rating: 4.5,
      reviewCount: 62310,
      brand: "AstroAI",
      asin: "B01L9WSTEG",
      link: buildAmazonLink("B01L9WSTEG"),
      badge: "Best Seller",
      prime: true,
      category: "tool",
    },
    {
      id: "tire-gauge",
      title: "JACO ElitePro Digital Tire Pressure Gauge",
      description: "100 PSI — backlit display, nozzle extension, batteries included",
      price: "$14.95",
      rating: 4.7,
      reviewCount: 28940,
      brand: "JACO",
      asin: "B00S1LD4RM",
      link: buildAmazonLink("B00S1LD4RM"),
      prime: true,
      category: "supply",
    },
  ],

  transmission: [
    {
      id: "trans-fluid-valvoline",
      title: "Valvoline MaxLife Multi-Vehicle ATF (1 Gallon)",
      description: "Full synthetic transmission fluid — compatible with most vehicles",
      price: "$24.97",
      rating: 4.7,
      reviewCount: 12430,
      brand: "Valvoline",
      asin: "B002RKF7P6",
      link: buildAmazonLink("B002RKF7P6"),
      badge: "Best Seller",
      prime: true,
      category: "supply",
    },
    {
      id: "trans-funnel",
      title: "ARES Automatic Transmission Fluid Refill Kit",
      description: "Universal — 8 adapters for easy fill without removing dipstick tube",
      price: "$29.99",
      rating: 4.4,
      reviewCount: 4210,
      brand: "ARES",
      asin: "B07YRQJFQL",
      link: buildAmazonLink("B07YRQJFQL"),
      prime: true,
      category: "tool",
    },
    {
      id: "obd2-scanner",
      title: "FOXWELL NT301 OBD2 Scanner",
      description: "Read/clear transmission and engine codes — live data display",
      price: "$49.99",
      rating: 4.5,
      reviewCount: 18930,
      brand: "FOXWELL",
      asin: "B00UGW7928",
      link: buildAmazonLink("B00UGW7928"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
  ],

  fuel_system: [
    {
      id: "maf-cleaner-crc",
      title: "CRC MAF Sensor Cleaner (11 oz)",
      description: "Safe for all MAF sensors — evaporates instantly, no residue",
      price: "$9.49",
      rating: 4.7,
      reviewCount: 24180,
      brand: "CRC",
      asin: "B000J19SSG",
      link: buildAmazonLink("B000J19SSG"),
      badge: "Amazon Choice",
      prime: true,
      category: "supply",
    },
    {
      id: "fuel-injector-cleaner",
      title: "Chevron Techron Concentrate Plus Fuel System Cleaner",
      description: "Deep cleans entire fuel system — restores lost power",
      price: "$12.47",
      rating: 4.7,
      reviewCount: 35620,
      brand: "Chevron",
      asin: "B000JFHYU0",
      link: buildAmazonLink("B000JFHYU0"),
      badge: "Best Seller",
      prime: true,
      category: "supply",
    },
    {
      id: "vacuum-hose-kit",
      title: "Dorman 47411 Vacuum Hose Kit (5 sizes)",
      description: "Silicone vacuum hose assortment — replaces cracked or brittle hoses",
      price: "$14.99",
      rating: 4.3,
      reviewCount: 3210,
      brand: "Dorman",
      asin: "B0076DGP26",
      link: buildAmazonLink("B0076DGP26"),
      prime: true,
      category: "part",
    },
  ],

  emissions: [
    {
      id: "o2-sensor-denso",
      title: "Denso 234-4209 Oxygen Sensor",
      description: "OE-quality downstream O2 sensor — wide vehicle compatibility",
      price: "$34.99",
      rating: 4.4,
      reviewCount: 7832,
      brand: "Denso",
      asin: "B000C2SAGO",
      link: buildAmazonLink("B000C2SAGO"),
      prime: true,
      category: "part",
    },
    {
      id: "o2-sensor-socket",
      title: "OEMTOOLS 27201 Offset Oxygen Sensor Socket",
      description: "7/8\" and 22mm — offset design for tight spaces",
      price: "$14.97",
      rating: 4.5,
      reviewCount: 6120,
      brand: "OEMTOOLS",
      asin: "B000E86DZW",
      link: buildAmazonLink("B000E86DZW"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
    {
      id: "penetrating-oil-pb",
      title: "PB B'laster Penetrating Catalyst (11 oz)",
      description: "Breaks loose rusted bolts and exhaust hardware",
      price: "$6.98",
      rating: 4.7,
      reviewCount: 42310,
      brand: "PB Blaster",
      asin: "B000I2079E",
      link: buildAmazonLink("B000I2079E"),
      prime: true,
      category: "supply",
    },
  ],

  evap: [
    {
      id: "gas-cap-stant",
      title: "Stant 10838 OE Replacement Fuel Cap",
      description: "OE-equivalent gas cap — solves most EVAP leak codes",
      price: "$9.99",
      rating: 4.4,
      reviewCount: 14280,
      brand: "Stant",
      asin: "B000C9QFPQ",
      link: buildAmazonLink("B000C9QFPQ"),
      badge: "Amazon Choice",
      prime: true,
      category: "part",
    },
    {
      id: "smoke-machine",
      title: "AUTOOL SDT-206 Smoke Leak Detector",
      description: "EVAP smoke machine — find vacuum and EVAP leaks fast",
      price: "$89.99",
      rating: 4.3,
      reviewCount: 2140,
      brand: "AUTOOL",
      asin: "B08X2JHM2C",
      link: buildAmazonLink("B08X2JHM2C"),
      prime: true,
      category: "tool",
    },
    {
      id: "obd2-basic",
      title: "BAFX Products Bluetooth OBD2 Scanner",
      description: "Read and clear EVAP codes from your phone",
      price: "$21.99",
      rating: 4.4,
      reviewCount: 38920,
      brand: "BAFX",
      asin: "B005NLQAHS",
      link: buildAmazonLink("B005NLQAHS"),
      badge: "Best Seller",
      prime: true,
      category: "tool",
    },
  ],

  noise: [
    {
      id: "serpentine-belt-gates",
      title: "Gates K060841 Micro-V Serpentine Belt",
      description: "OE-quality belt — reduces squealing and slippage",
      price: "$22.99",
      rating: 4.6,
      reviewCount: 8940,
      brand: "Gates",
      asin: "B000C2SIFM",
      link: buildAmazonLink("B000C2SIFM"),
      prime: true,
      category: "part",
    },
    {
      id: "mechanics-stethoscope",
      title: "Lisle 52500 Mechanic's Stethoscope",
      description: "Pinpoint engine noises — isolate bearings, valves, and accessories",
      price: "$10.49",
      rating: 4.4,
      reviewCount: 4320,
      brand: "Lisle",
      asin: "B0002STSD4",
      link: buildAmazonLink("B0002STSD4"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
    {
      id: "belt-tensioner",
      title: "Dayco 89370 Automatic Belt Tensioner",
      description: "Maintains proper belt tension — eliminates squealing",
      price: "$34.99",
      rating: 4.5,
      reviewCount: 3120,
      brand: "Dayco",
      asin: "B001A3NFSO",
      link: buildAmazonLink("B001A3NFSO"),
      prime: true,
      category: "part",
    },
  ],

  general: [
    {
      id: "obd2-foxwell",
      title: "FOXWELL NT301 OBD2 Scanner",
      description: "Read/clear all engine codes — live data, freeze frame, I/M readiness",
      price: "$49.99",
      rating: 4.5,
      reviewCount: 18930,
      brand: "FOXWELL",
      asin: "B00UGW7928",
      link: buildAmazonLink("B00UGW7928"),
      badge: "Amazon Choice",
      prime: true,
      category: "tool",
    },
    {
      id: "tool-set-dewalt",
      title: "DEWALT Mechanics Tool Set (168-Piece)",
      description: "Chrome vanadium steel — SAE and metric sockets, wrenches, hex keys",
      price: "$119.00",
      originalPrice: "$149.00",
      rating: 4.8,
      reviewCount: 23410,
      brand: "DEWALT",
      asin: "B00IOCIWSY",
      link: buildAmazonLink("B00IOCIWSY"),
      badge: "Best Seller",
      prime: true,
      category: "tool",
    },
    {
      id: "creeper",
      title: "Pro-LifT C-2036D Foldable Creeper (36\")",
      description: "Padded headrest, six casters — folds flat for storage",
      price: "$39.99",
      rating: 4.5,
      reviewCount: 8930,
      brand: "Pro-LifT",
      asin: "B002TLUQM8",
      link: buildAmazonLink("B002TLUQM8"),
      prime: true,
      category: "tool",
    },
  ],
};

// ── DIY time estimates by category ──────────────────────────────────────────
const diyEstimates: Partial<Record<DiagnosisCategory, { timeRange: string; totalPartsRange: string }>> = {
  brakes: { timeRange: "1.5–3 hours", totalPartsRange: "$45–$80" },
  engine_misfire: { timeRange: "30 min–2 hours", totalPartsRange: "$30–$100" },
  cooling: { timeRange: "1–2.5 hours", totalPartsRange: "$30–$70" },
  battery_electrical: { timeRange: "15–45 min", totalPartsRange: "$7–$40" },
  oil_change: { timeRange: "30–60 min", totalPartsRange: "$35–$60" },
  hvac: { timeRange: "15 min–1 hour", totalPartsRange: "$10–$50" },
  tire: { timeRange: "15–45 min", totalPartsRange: "$15–$50" },
  transmission: { timeRange: "1–3 hours", totalPartsRange: "$25–$70" },
  fuel_system: { timeRange: "30 min–2 hours", totalPartsRange: "$10–$35" },
  emissions: { timeRange: "1–3 hours", totalPartsRange: "$35–$90" },
  evap: { timeRange: "15 min–2 hours", totalPartsRange: "$10–$30" },
  noise: { timeRange: "30 min–2 hours", totalPartsRange: "$15–$60" },
  general: { timeRange: "varies", totalPartsRange: "varies" },
};

// ── Static service recommendations ──────────────────────────────────────────
const defaultServices: ServiceRecommendation[] = [
  {
    id: "insurance-progressive",
    company: "Progressive",
    service: "Auto Insurance",
    description: "Compare rates from multiple carriers in minutes",
    price: "Free Quote",
    rating: 4.2,
    reviewCount: 12847,
    badge: "Local Agent",
    cta: "Get Free Quote",
    link: "https://www.progressive.com/auto/",
  },
  {
    id: "warranty-endurance",
    company: "Endurance",
    service: "Extended Warranty",
    description: "Cover unexpected repairs — plans from $79/month",
    price: "From $79/mo",
    rating: 4.3,
    reviewCount: 9234,
    badge: "Top Rated",
    cta: "Get Coverage",
    link: "https://www.endurancewarranty.com/",
  },
  {
    id: "refinance-capitalone",
    company: "Capital One Auto",
    service: "Auto Refinancing",
    description: "Lower your monthly car payment — pre-qualify with no credit impact",
    price: "Rates from 4.49%",
    rating: 4.5,
    reviewCount: 15632,
    cta: "Check Rates",
    link: "https://www.capitalone.com/auto-refinance/",
  },
];

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get local product recommendations for a diagnosis.
 * Returns undefined if no local match → caller should fall back to AI.
 */
export function getLocalRecommendations(
  diagnosis: string,
  code?: string
): RecommendationSet | undefined {
  const category = classifyDiagnosis(diagnosis, code);
  // "general" means no specific match — let AI handle it
  if (category === "general") return undefined;
  const products = productCatalog[category];
  if (!products || products.length === 0) return undefined;

  return {
    products,
    services: defaultServices,
    diyEstimate: diyEstimates[category],
    source: "local",
  };
}

/**
 * Always returns the default service recommendations (static partner links).
 */
export function getServiceRecommendations(): ServiceRecommendation[] {
  return defaultServices;
}

export { classifyDiagnosis };
export type { DiagnosisCategory };
