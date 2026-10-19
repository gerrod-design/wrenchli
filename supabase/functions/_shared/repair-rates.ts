/**
 * repair-rates.ts
 * ---------------------------------------------------------------------------
 * Shared repair-rate reference table for Wrenchli's assessment pipelines.
 *
 * PURPOSE
 * Three edge functions (diagnose, diagnose-vehicle, estimate-repair) each
 * independently asked an LLM to invent cost ranges for the same common
 * repairs, producing quotes that disagreed by as much as ~48% across
 * surfaces. This module pins commonly-seen repairs to ONE deterministic
 * table. Callers match a model-produced repair/cause title against this
 * table with `findRepairRate`; on a match, ALL cost figures shown to the
 * user for that repair should be replaced with figures derived from this
 * table via `rateFigures`, so the same repair always quotes the same range
 * no matter which pipeline produced it.
 *
 * PROVENANCE
 *   basis:     "Wrenchli editorial estimate"
 *   compiled:  "2026-10-19"
 *   method:    Typical U.S. independent-shop parts price ranges, plus
 *              published book labor hours, multiplied by a blended
 *              independent-shop labor rate of $130/hour. Labor dollar
 *              figures are rounded to the nearest $5 at each end of the
 *              range.
 *
 * THESE ARE NOT LIVE MARKET DATA. They are NOT sourced from a parts/labor
 * pricing feed, a dealer network, or real-time quotes. They are editorial
 * planning estimates compiled by Wrenchli to give users a reasonable,
 * consistent ballpark. They are NOT vehicle-specific in v1 (no trim,
 * engine, drivetrain, or regional labor-rate variation yet) and must not
 * be presented to users as a quote, bid, or guaranteed price.
 * ---------------------------------------------------------------------------
 */

/** Rate table schema/content version. Bump when entries or figures change. */
export const RATE_TABLE_VERSION = "v1";

/** Stable identifier for this rate source, for logging/analytics/provenance tags. */
export const RATE_SOURCE_ID = "wrenchli_editorial_rate_table_v1";

/** Blended independent-shop labor rate used to derive shop labor dollars, in USD/hour. */
export const LABOR_RATE_PER_HOUR = 130;

export interface RepairRateEntry {
  id: string;
  label: string;
  /** Regexes tested in order against a repair/cause title; first entry with any match wins. */
  match: RegExp[];
  /** DIY parts cost range in USD, or null if DIY is not applicable/recommended. */
  diyParts: [number, number] | null;
  /** Shop (professional install) parts cost range in USD. */
  shopParts: [number, number];
  /** Book labor hours range used for the shop install. */
  laborHours: [number, number];
  /** Human-readable DIY time estimate, or null if DIY is not applicable. */
  diyTime: string | null;
  /** Human-readable shop time estimate. */
  shopTime: string;
}

/** Fully derived dollar figures for one rate-table entry (see rateFigures). */
export interface RateFigures {
  diyParts: [number, number] | null;
  shopParts: [number, number];
  shopLabor: [number, number];
  shopTotal: [number, number];
  laborHours: [number, number];
}

export const REPAIR_RATES: RepairRateEntry[] = [
  {
    id: "brake_pads_and_rotors",
    label: "Brake Pads & Rotors Replacement",
    match: [/(?=.*\bpads?\b)(?=.*\b(?:rotors?|discs?)\b)/i],
    diyParts: [160, 420],
    shopParts: [160, 420],
    laborHours: [1.5, 2.5],
    diyTime: "2–3 hours",
    shopTime: "2–3 hours",
  },
  {
    id: "brake_pads",
    label: "Brake Pads Replacement",
    match: [/\bpads?\b/i],
    diyParts: [50, 130],
    shopParts: [50, 130],
    laborHours: [0.8, 1.5],
    diyTime: "1–2 hours",
    shopTime: "1–2 hours",
  },
  {
    id: "brake_rotors",
    label: "Brake Rotors Replacement",
    match: [/\brotors?\b/i, /\bdiscs?\b/i],
    diyParts: [110, 300],
    shopParts: [110, 300],
    laborHours: [1.0, 2.0],
    diyTime: "1.5–2.5 hours",
    shopTime: "1.5–2.5 hours",
  },
  {
    id: "brake_caliper",
    label: "Brake Caliper Replacement",
    match: [/\bcalipers?\b/i],
    diyParts: [90, 250],
    shopParts: [90, 250],
    laborHours: [1.0, 2.0],
    diyTime: "1.5–2.5 hours",
    shopTime: "1.5–2.5 hours",
  },
  {
    id: "alternator",
    label: "Alternator Replacement",
    match: [/\balternators?\b/i],
    diyParts: [250, 550],
    shopParts: [250, 550],
    laborHours: [1.5, 3.0],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "starter",
    label: "Starter Motor Replacement",
    match: [/\bstarters?\b/i],
    diyParts: [200, 450],
    shopParts: [200, 450],
    laborHours: [1.5, 3.0],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "battery_terminals",
    label: "Battery Terminals / Cables Service",
    match: [/battery terminals?/i, /battery cables?/i, /corroded terminals?/i, /terminal corrosion/i, /battery connection/i],
    diyParts: [15, 60],
    shopParts: [15, 60],
    laborHours: [0.3, 0.8],
    diyTime: "30-60 minutes",
    shopTime: "30 minutes - 1 hour",
  },
  {
    id: "battery",
    label: "Battery Replacement",
    match: [/batter/i],
    diyParts: [120, 260],
    shopParts: [120, 260],
    laborHours: [0.3, 0.7],
    diyTime: "20–45 minutes",
    shopTime: "30–60 minutes",
  },
  {
    id: "spark_plugs",
    label: "Spark Plugs Replacement",
    match: [/\bspark\s*plugs?\b/i],
    diyParts: [50, 200],
    shopParts: [50, 200],
    laborHours: [0.8, 2.0],
    diyTime: "1–2 hours",
    shopTime: "1–2 hours",
  },
  {
    id: "ignition_coil",
    label: "Ignition Coil Replacement",
    match: [/\bignition\s*coils?\b/i, /\bcoil\s*packs?\b/i, /\bcoils?\b/i],
    diyParts: [70, 250],
    shopParts: [70, 250],
    laborHours: [0.5, 1.5],
    diyTime: "30–90 minutes",
    shopTime: "1–2 hours",
  },
  {
    id: "oxygen_sensor",
    label: "Oxygen (O2) Sensor Replacement",
    match: [/\boxygen\s*sensors?\b/i, /\bo2\s*sensors?\b/i, /\bo2\b/i],
    diyParts: [80, 250],
    shopParts: [80, 250],
    laborHours: [0.5, 1.2],
    diyTime: "30–60 minutes",
    shopTime: "1–2 hours",
  },
  {
    id: "catalytic_converter",
    label: "Catalytic Converter Replacement",
    match: [/\bcatalytic\s*converters?\b/i, /\bcat\s*converter\b/i, /\bcatalytic\b/i],
    diyParts: [400, 1200],
    shopParts: [400, 1200],
    laborHours: [1.5, 3.0],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "water_pump",
    label: "Water Pump Replacement",
    match: [/\bwater\s*pumps?\b/i],
    diyParts: [80, 250],
    shopParts: [80, 250],
    laborHours: [2.5, 4.5],
    diyTime: "3–6 hours",
    shopTime: "3–6 hours",
  },
  {
    id: "thermostat",
    label: "Thermostat Replacement",
    match: [/\bthermostats?\b/i],
    diyParts: [25, 80],
    shopParts: [25, 80],
    laborHours: [1.0, 2.0],
    diyTime: "1–2 hours",
    shopTime: "1–2 hours",
  },
  {
    id: "serpentine_belt",
    label: "Serpentine / Drive Belt Replacement",
    match: [/\bserpentine\s*belts?\b/i, /\bdrive\s*belts?\b/i],
    diyParts: [25, 70],
    shopParts: [25, 70],
    laborHours: [0.4, 1.0],
    diyTime: "30–60 minutes",
    shopTime: "30–60 minutes",
  },
  {
    id: "wheel_bearing",
    label: "Wheel Bearing / Hub Assembly Replacement",
    match: [/\bwheel\s*bearings?\b/i, /\bhub\s*assembl(?:y|ies)\b/i],
    diyParts: [120, 300],
    shopParts: [120, 300],
    laborHours: [1.2, 2.2],
    diyTime: "2–3 hours",
    shopTime: "2–3 hours",
  },
  {
    id: "struts",
    label: "Struts Replacement (pair)",
    match: [/\bstruts?\b/i],
    diyParts: [250, 600],
    shopParts: [250, 600],
    laborHours: [2.0, 3.5],
    diyTime: "3–5 hours",
    shopTime: "3–5 hours",
  },
  {
    id: "shocks",
    label: "Shock Absorbers Replacement (pair)",
    match: [/\bshocks?\b/i, /\bshock\s*absorbers?\b/i],
    diyParts: [150, 400],
    shopParts: [150, 400],
    laborHours: [1.5, 3.0],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "control_arm",
    label: "Control Arm / Ball Joint Replacement",
    match: [/\bcontrol\s*arms?\b/i, /\bball\s*joints?\b/i],
    diyParts: [120, 300],
    shopParts: [120, 300],
    laborHours: [1.5, 2.5],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "fuel_pump",
    label: "Fuel Pump Replacement",
    match: [/\bfuel\s*pumps?\b/i],
    diyParts: [200, 500],
    shopParts: [200, 500],
    laborHours: [2.0, 4.0],
    diyTime: "3–5 hours",
    shopTime: "3–5 hours",
  },
  {
    id: "radiator",
    label: "Radiator Replacement",
    match: [/\bradiator\b(?!\s*hose)/i],
    diyParts: [150, 350],
    shopParts: [150, 350],
    laborHours: [2.0, 3.5],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
  },
  {
    id: "ac_compressor",
    label: "A/C Compressor Replacement",
    match: [
      /\ba\/?c\s*compressors?\b/i,
      /\bair\s*condition(?:er|ing)\s*compressors?\b/i,
      /\bcompressors?\b/i,
    ],
    diyParts: [300, 700],
    shopParts: [300, 700],
    laborHours: [2.5, 4.5],
    diyTime: "4–6 hours",
    shopTime: "4–6 hours",
  },
  {
    id: "timing_belt",
    label: "Timing Belt Replacement",
    match: [/\btiming\s*belts?\b/i],
    diyParts: [150, 350],
    shopParts: [150, 350],
    laborHours: [4.0, 7.0],
    diyTime: "5–8 hours",
    shopTime: "5–8 hours",
  },
  {
    id: "mass_airflow_sensor",
    label: "Mass Airflow (MAF) Sensor Replacement",
    match: [/\bmass\s*air\s*flow\s*sensors?\b/i, /\bmaf\s*sensors?\b/i, /\bmaf\b/i],
    diyParts: [80, 250],
    shopParts: [80, 250],
    laborHours: [0.3, 0.8],
    diyTime: "15–30 minutes",
    shopTime: "30–60 minutes",
  },
  {
    id: "transmission_fluid_service",
    label: "Transmission Fluid / Filter Service",
    match: [/(?=.*\btransmission\b)(?=.*\b(?:fluid|filter|service)\b)/i],
    diyParts: [60, 150],
    shopParts: [60, 150],
    laborHours: [0.8, 1.5],
    diyTime: "1–2 hours",
    shopTime: "1–2 hours",
  },
  {
    id: "engine_air_filter",
    label: "Engine Air Filter Replacement",
    match: [/\bengine\s*air\s*filters?\b/i, /(?<!cabin\s)\bair\s*filters?\b/i],
    diyParts: [15, 45],
    shopParts: [15, 45],
    laborHours: [0.1, 0.3],
    diyTime: "5–15 minutes",
    shopTime: "15–30 minutes",
  },
  {
    id: "cabin_air_filter",
    label: "Cabin Air Filter Replacement",
    match: [/\bcabin\s*air\s*filters?\b/i, /\bcabin\s*filters?\b/i],
    diyParts: [15, 50],
    shopParts: [15, 50],
    laborHours: [0.2, 0.5],
    diyTime: "10–20 minutes",
    shopTime: "15–30 minutes",
  },
  {
    id: "wiper_blades",
    label: "Wiper Blades Replacement",
    match: [/\bwiper\s*blades?\b/i, /\bwindshield\s*wipers?\b/i],
    diyParts: [20, 60],
    shopParts: [20, 60],
    laborHours: [0.1, 0.2],
    diyTime: "5–10 minutes",
    shopTime: "10–20 minutes",
  },
  {
    id: "headlight_bulb",
    label: "Headlight Bulb Replacement",
    match: [/\bheadlights?\s*bulbs?\b/i, /\bheadlamps?\s*bulbs?\b/i, /\bbulbs?\b/i],
    diyParts: [15, 120],
    shopParts: [15, 120],
    laborHours: [0.2, 0.6],
    diyTime: "10–30 minutes",
    shopTime: "20–45 minutes",
  },
  {
    id: "oil_change",
    label: "Oil Change (Oil & Filter)",
    match: [/\boil\s*change\b/i, /\boil\s*&\s*filter\b/i, /\boil\s*and\s*filter\b/i],
    diyParts: [35, 75],
    shopParts: [35, 75],
    laborHours: [0.3, 0.5],
    diyTime: "30–45 minutes",
    shopTime: "30–60 minutes",
  },
];

export function findRepairRate(text: string): RepairRateEntry | null {
  if (!text || !text.trim()) {
    return null;
  }

  for (const entry of REPAIR_RATES) {
    if (entry.match.some((regex) => regex.test(text))) {
      return entry;
    }
  }

  return null;
}

export function rateFigures(entry: RepairRateEntry): RateFigures {
  const shopLabor: [number, number] = [
    Math.round((entry.laborHours[0] * LABOR_RATE_PER_HOUR) / 5) * 5,
    Math.round((entry.laborHours[1] * LABOR_RATE_PER_HOUR) / 5) * 5,
  ];

  const shopTotal: [number, number] = [
    entry.shopParts[0] + shopLabor[0],
    entry.shopParts[1] + shopLabor[1],
  ];

  return {
    diyParts: entry.diyParts ? [entry.diyParts[0], entry.diyParts[1]] : null,
    shopParts: [entry.shopParts[0], entry.shopParts[1]],
    shopLabor,
    shopTotal,
    laborHours: [entry.laborHours[0], entry.laborHours[1]],
  };
}

export function formatMoneyRange(range: [number, number]): string {
  const [low, high] = range;
  return `$${low.toLocaleString("en-US")}–$${high.toLocaleString("en-US")}`;
}
