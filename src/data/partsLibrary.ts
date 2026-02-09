export interface PartEntry {
  name: string;
  estimatedPrice: string;
  required: boolean;
  note?: string;
  searchQuery: string;
}

export interface PartsInfo {
  parts: PartEntry[];
  tools: string[];
  proTip?: string;
}

/**
 * Maps diagnosis titles (lowercased) to parts/tools info.
 * Vehicle year/make/model is appended to search queries at runtime.
 */
const partsMap: Record<string, PartsInfo> = {
  "worn brake pads": {
    parts: [
      { name: "Front Brake Pads (set)", estimatedPrice: "$25–$55", required: true, searchQuery: "front+brake+pads" },
      { name: "Brake Rotors (pair — if worn or warped)", estimatedPrice: "$40–$80 each", required: false, note: "Check rotor thickness and surface during pad removal", searchQuery: "front+brake+rotors" },
      { name: "Brake Caliper Grease / Brake Cleaner", estimatedPrice: "$5–$12", required: true, searchQuery: "brake+caliper+grease+brake+cleaner" },
    ],
    tools: ["Lug wrench or impact wrench", "Floor jack and jack stands", "Socket set (typically 14mm–19mm for caliper bolts)", "C-clamp or brake piston tool", "Wire brush (for cleaning bracket)"],
    proTip: "Many auto parts stores offer free loaner tools for brake jobs. Ask at the counter!",
  },
  "check engine light (multiple possible causes)": {
    parts: [
      { name: "OBD2 Scanner", estimatedPrice: "$15–$35", required: true, searchQuery: "obd2+scanner+bluetooth" },
      { name: "Gas Cap (replacement)", estimatedPrice: "$5–$15", required: false, note: "Try tightening or replacing gas cap first — it's the cheapest fix", searchQuery: "gas+cap" },
    ],
    tools: ["OBD2 scanner (or visit auto parts store for free scan)"],
    proTip: "AutoZone, O'Reilly, and Advance Auto will scan your check engine light for free — no purchase required!",
  },
  "engine overheating": {
    parts: [
      { name: "Thermostat", estimatedPrice: "$10–$25", required: true, searchQuery: "engine+thermostat" },
      { name: "Coolant / Antifreeze (1 gallon)", estimatedPrice: "$10–$20", required: true, searchQuery: "coolant+antifreeze" },
      { name: "Radiator Hose", estimatedPrice: "$15–$40", required: false, note: "Inspect hoses for cracks, bulges, or soft spots", searchQuery: "radiator+hose" },
    ],
    tools: ["Socket set", "Drain pan", "Pliers or hose clamp tool", "Funnel for coolant fill"],
    proTip: "Never open a radiator cap on a hot engine! Let it cool completely first — pressurized coolant can cause severe burns.",
  },
  "vehicle vibration": {
    parts: [
      { name: "Wheel Balance Service", estimatedPrice: "$15–$25 per wheel", required: true, searchQuery: "tire+balancing+service" },
      { name: "Tire (if worn or damaged)", estimatedPrice: "$80–$200 each", required: false, note: "Check tread depth with a penny test", searchQuery: "tire" },
    ],
    tools: ["Tire pressure gauge", "Lug wrench"],
    proTip: "Most tire shops will balance your wheels for free if you purchased the tires from them.",
  },
  "battery or starting system issue": {
    parts: [
      { name: "Car Battery", estimatedPrice: "$80–$200", required: true, searchQuery: "car+battery" },
      { name: "Battery Terminal Cleaner / Anti-Corrosion Kit", estimatedPrice: "$5–$10", required: true, searchQuery: "battery+terminal+cleaner" },
      { name: "Battery Cables (if corroded)", estimatedPrice: "$15–$40", required: false, note: "Check for green/white corrosion buildup", searchQuery: "battery+cables" },
    ],
    tools: ["Wrench set (typically 10mm for terminals)", "Wire brush or terminal cleaner", "Battery load tester (optional)"],
    proTip: "Most auto parts stores will test your battery for free and install a new one if you buy it there!",
  },
  "oil system warning": {
    parts: [
      { name: "Motor Oil (5 quarts)", estimatedPrice: "$20–$40", required: true, searchQuery: "motor+oil+full+synthetic" },
      { name: "Oil Filter", estimatedPrice: "$5–$15", required: true, searchQuery: "oil+filter" },
      { name: "Drain Plug Gasket", estimatedPrice: "$2–$5", required: true, searchQuery: "oil+drain+plug+gasket" },
    ],
    tools: ["Oil filter wrench", "Socket set or wrench for drain plug", "Drain pan", "Funnel", "Jack and jack stands (if needed for clearance)"],
    proTip: "Check your owner's manual for the correct oil weight (e.g., 5W-30) and capacity before buying.",
  },
  "hvac / air conditioning issue": {
    parts: [
      { name: "Cabin Air Filter", estimatedPrice: "$10–$20", required: true, searchQuery: "cabin+air+filter" },
      { name: "AC Refrigerant Recharge Kit", estimatedPrice: "$25–$45", required: false, note: "Only if AC is blowing warm — do not overcharge", searchQuery: "ac+refrigerant+recharge+kit+r134a" },
    ],
    tools: ["Screwdriver or trim removal tool (for cabin filter access)", "AC gauge (included in recharge kit)"],
    proTip: "Replacing your cabin air filter is usually a 5-minute job — check your owner's manual or YouTube for your specific model.",
  },
  "tire pressure / tire damage": {
    parts: [
      { name: "Tire Repair Kit (plug kit)", estimatedPrice: "$8–$15", required: false, note: "For nail/screw punctures in the tread area only", searchQuery: "tire+repair+plug+kit" },
      { name: "Valve Stem Cores", estimatedPrice: "$3–$8", required: false, searchQuery: "tire+valve+stem+core+tool" },
      { name: "Portable Tire Inflator", estimatedPrice: "$25–$50", required: false, searchQuery: "portable+tire+inflator+12v" },
    ],
    tools: ["Tire pressure gauge", "Valve core tool"],
    proTip: "Check tire pressure when tires are cold (before driving) for the most accurate reading. The correct PSI is on the driver's door jamb sticker.",
  },
  "transmission issue": {
    parts: [
      { name: "Transmission Fluid", estimatedPrice: "$8–$20 per quart", required: true, searchQuery: "transmission+fluid" },
      { name: "Transmission Filter Kit", estimatedPrice: "$15–$40", required: false, note: "Recommended during a full fluid change", searchQuery: "transmission+filter+kit" },
    ],
    tools: ["Socket set", "Drain pan", "Funnel with long neck", "Torque wrench"],
    proTip: "Always use the exact transmission fluid type specified in your owner's manual — using the wrong type can cause serious damage.",
  },
  "unusual noise (multiple possible causes)": {
    parts: [
      { name: "Serpentine Belt", estimatedPrice: "$15–$35", required: false, note: "If squealing at startup", searchQuery: "serpentine+belt" },
      { name: "Exhaust Clamp / Heat Shield Hardware", estimatedPrice: "$5–$15", required: false, note: "If rattling from underneath", searchQuery: "exhaust+clamp+heat+shield" },
    ],
    tools: ["Stethoscope or long screwdriver (for sound isolation)", "Socket set", "Belt tension tool"],
    proTip: "A mechanic's stethoscope ($10) or even a long screwdriver held to your ear can help pinpoint exactly where a noise is coming from.",
  },
  // DTC-specific entries
  "catalyst system efficiency below threshold (bank 1)": {
    parts: [
      { name: "Downstream Oxygen Sensor", estimatedPrice: "$30–$80", required: false, note: "Test O2 sensor readings before replacing catalytic converter", searchQuery: "downstream+oxygen+sensor" },
      { name: "Catalytic Converter", estimatedPrice: "$150–$500+ (aftermarket)", required: false, note: "Only if confirmed failed — check local emissions laws", searchQuery: "catalytic+converter" },
    ],
    tools: ["O2 sensor socket", "Penetrating oil (for rusted bolts)", "Jack and jack stands"],
    proTip: "Before replacing an expensive catalytic converter, have a shop verify the O2 sensors are reading correctly — a $50 sensor swap could save you $1,000+.",
  },
  "system too lean (bank 1)": {
    parts: [
      { name: "MAF Sensor Cleaner", estimatedPrice: "$8–$15", required: true, searchQuery: "maf+sensor+cleaner" },
      { name: "Vacuum Hose Kit", estimatedPrice: "$10–$25", required: false, note: "Inspect all vacuum hoses for cracks", searchQuery: "vacuum+hose+kit" },
      { name: "Fuel Filter", estimatedPrice: "$10–$30", required: false, searchQuery: "fuel+filter" },
    ],
    tools: ["Screwdriver set", "Smoke machine (for vacuum leak detection — advanced)", "MAF sensor cleaner spray"],
    proTip: "Cleaning your MAF sensor is often the cheapest fix — just spray the sensor element with MAF-specific cleaner (never use carb cleaner!) and let it air dry.",
  },
  "random/multiple cylinder misfire detected": {
    parts: [
      { name: "Spark Plugs (full set)", estimatedPrice: "$20–$60", required: true, searchQuery: "spark+plugs" },
      { name: "Ignition Coils (set or individual)", estimatedPrice: "$15–$50 each", required: false, note: "Swap coils between cylinders to confirm which is failing", searchQuery: "ignition+coil" },
    ],
    tools: ["Spark plug socket (5/8\" or 16mm)", "Torque wrench", "Gap gauge", "Dielectric grease"],
    proTip: "When replacing one ignition coil, consider replacing all of them if they're original and the vehicle has over 100k miles.",
  },
};

/**
 * Look up parts info for a given diagnosis title.
 * Falls back to undefined if no match found.
 */
export function getPartsForDiagnosis(diagnosisTitle: string): PartsInfo | undefined {
  return partsMap[diagnosisTitle.toLowerCase()];
}

/**
 * Build a retailer search URL with vehicle context appended.
 */
export function buildRetailerUrl(
  retailer: "autozone" | "oreilly" | "amazon",
  searchQuery: string,
  vehicle: string
): string {
  const vehicleQuery = vehicle.replace(/\s+/g, "+");
  const fullQuery = `${searchQuery}+${vehicleQuery}`;

  switch (retailer) {
    case "autozone":
      return `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(fullQuery.replace(/\+/g, " "))}`;
    case "oreilly":
      return `https://www.oreillyauto.com/shop/b/${fullQuery}`;
    case "amazon":
      return `https://www.amazon.com/s?k=${fullQuery}`;
  }
}
