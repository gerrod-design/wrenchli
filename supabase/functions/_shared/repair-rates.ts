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
 *
 * 2026-11-14 ADDENDUM (founder-approved 2026-11-14): four entries —
 * catalytic_converter, thermostat, radiator, fuel_pump — were re-derived
 * from named parts sources on the channel-spanning basis (price-book
 * methodology Section 3A): the low end is an independent shop (quality
 * aftermarket part at the published markup tier, labor in the independent
 * corridor $100–$132/hr) and the high end is a franchised dealer (OEM part
 * at manufacturer list, labor in the dealer corridor $140–$200/hr). Those
 * entries carry `spanning`, `basisNote`, and `provenance` fields and
 * derive through the spanning path in `rateFigures`. All other entries
 * still use the v1 blended derivation described above. Full derivation
 * record: price-book-parts-rederivation-2026-11-14.md (Wrenchli agent
 * operating cadence goal files).
 * ---------------------------------------------------------------------------
 */

/** Rate table schema/content version. Bump when entries or figures change. */
export const RATE_TABLE_VERSION = "v2";

/** Stable identifier for this rate source, for logging/analytics/provenance tags. */
export const RATE_SOURCE_ID = "wrenchli_editorial_rate_table_v1";

/** Blended independent-shop labor rate used to derive shop labor dollars, in USD/hour. */
export const LABOR_RATE_PER_HOUR = 130;

/** Independent-shop labor corridor, USD/hour. Standing corridors, never blended. */
export const INDEPENDENT_LABOR_RATE_PER_HOUR: [number, number] = [100, 132];

/** Franchised-dealer labor corridor, USD/hour. Standing corridors, never blended. */
export const DEALER_LABOR_RATE_PER_HOUR: [number, number] = [140, 200];

/**
 * Credibility grade of a book entry under the price-data credibility
 * standard (grading record: price-book methodology + benchmark, cadence
 * goal files; counts as graded 2026-11-16: SOUND 11, SUSPECT 18,
 * UNSOUND 0, UNRESOLVED 1). Only SOUND entries may be newly published
 * or served. The field is optional in the type so older construction
 * sites keep compiling; a missing verdict is treated as NOT servable
 * everywhere the gate is applied (fail closed).
 */
export type RepairVerdict = "SOUND" | "SUSPECT" | "UNSOUND" | "UNRESOLVED";

export interface RepairRateEntry {
  id: string;
  /** Credibility grade (see RepairVerdict). Absent = not servable. */
  verdict?: RepairVerdict;
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
  /**
   * Channel-spanning derivation (methodology Section 3A) for entries
   * re-derived on that basis. When present, `rateFigures` derives the
   * entry's figures from the two channel ends instead of the v1 blended
   * derivation: the low end is an independent shop (quality aftermarket
   * part at the published markup tier, labor at the independent corridor
   * floor) and the high end is a franchised dealer (OEM part at
   * manufacturer list, labor at the dealer corridor ceiling). For such
   * entries the legacy `shopParts` field carries the cross-channel span
   * [independentParts low, dealerParts] for readers that do not call
   * `rateFigures`.
   */
  spanning?: {
    /** Shop-charged parts range at the independent end, in USD. */
    independentParts: [number, number];
    /** OEM part at manufacturer list price at the dealer end, in USD. No markup step. */
    dealerParts: number;
  };
  /** Basis note that must travel with this entry's figures wherever they are published. */
  basisNote?: string;
  /** Per-entry provenance: the named sources behind the figures and the date they were checked. */
  provenance?: string;
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "UNRESOLVED",
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
    verdict: "SOUND",
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
    verdict: "SOUND",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SOUND",
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
    verdict: "SUSPECT",
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
    verdict: "SOUND",
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
    verdict: "SUSPECT",
    label: "Catalytic Converter Replacement",
    match: [/\bcatalytic\s*converters?\b/i, /\bcat\s*converter\b/i, /\bcatalytic\b/i],
    diyParts: [340, 387],
    shopParts: [495, 1075],
    laborHours: [1.5, 3.0],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
    spanning: { independentParts: [495, 620], dealerParts: 1075 },
    basisNote:
      "Single converter unit. A job that replaces both converter units, or fits a CARB-compliant unit, prices above the top of this range.",
    provenance:
      "Re-derived 2026-11-14 from named sources (founder-approved 2026-11-14): PartsGeek (Evan Fischer direct-fit Federal $339.98–$386.98 street; MagnaFlow OEM-grade $812.99); OEM list via Longo Toyota / Toyota OEM Parts Online (OE 17141F0010 $1,047.90 + manifold gasket $26.10, carried as $1,075). Independent parts = street price x published markup tier (45–60% on $200–$500 parts). Labor 1.5–3.0h (book; ConsumerAffairs ~1–3h). Representative vehicle: 2019 Toyota Camry 2.5L.",
  },
  {
    id: "water_pump",
    verdict: "SUSPECT",
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
    verdict: "SOUND",
    label: "Thermostat Replacement",
    match: [/\bthermostats?\b/i],
    diyParts: [36, 62],
    shopParts: [60, 137],
    laborHours: [1.0, 2.0],
    diyTime: "1–2 hours",
    shopTime: "1–2 hours",
    spanning: { independentParts: [60, 120], dealerParts: 137 },
    basisNote:
      "The service part is the thermostat housing assembly (thermostat integrated), not a bare thermostat.",
    provenance:
      "Re-derived 2026-11-14 from named sources (founder-approved 2026-11-14): PartsGeek (Replacement $35.95 / Aisin $51.97 / NTC-TAMA $61.97 housing assemblies, street); AutoZone (Duralast housing assemblies $31.99–$63.99); Cars245 (genuine Toyota 16031-25010 at $137.38 retail, carried as $137). Independent parts = street price x published markup tier (65–90% under $200). Labor 1.0–2.0h (book; AutoZone 1–2h). Representative vehicle: 2019 Toyota Camry 2.5L.",
  },
  {
    id: "serpentine_belt",
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SOUND",
    label: "Fuel Pump Replacement",
    match: [/\bfuel\s*pumps?\b/i],
    diyParts: [187, 277],
    shopParts: [400, 724],
    laborHours: [2.0, 4.0],
    diyTime: "3–5 hours",
    shopTime: "3–5 hours",
    spanning: { independentParts: [400, 445], dealerParts: 724 },
    basisNote:
      "Prices the in-tank pump module assembly (pump, sending unit, screen, tank seal), not a bare pump.",
    provenance:
      "Re-derived 2026-11-14 from named sources (founder-approved 2026-11-14): PartsGeek (Delphi module $277 street); Advance Auto Parts (module assemblies from $452.99 retail counter); Toyota OEM Parts Online (OE 77020-06520 MSRP $723.54, carried as $724). Independent parts = street price x published markup tier (45–60% on $200–$500 parts). Labor 2.0–4.0h (book; AAA 2–4h). Dealer end corroborated by the RepairPal / KBB / AAA estimator convergence ($1,116–$1,513). Representative vehicle: 2019 Toyota Camry 2.5L.",
  },
  {
    id: "radiator",
    verdict: "SUSPECT",
    label: "Radiator Replacement",
    match: [/\bradiator\b(?!\s*hose)/i],
    diyParts: [77, 211],
    shopParts: [155, 395],
    laborHours: [2.0, 3.5],
    diyTime: "2–4 hours",
    shopTime: "2–4 hours",
    spanning: { independentParts: [155, 155], dealerParts: 395 },
    basisNote:
      "Parts figures include a coolant allowance ($30 independent / $40 dealer). The 3.5h labor top exceeds the Tier 1 public figure (2–3h for most cars) and is retained from the book, flagged.",
    provenance:
      "Re-derived 2026-11-14 from named sources (founder-approved 2026-11-14): PartsGeek (CSF $76.97 / TRQ $91.95 street); Go-Parts (OE-style $210.95 street); AutoPartsPrime (genuine Toyota 16400-25130 MSRP $355.93). Independent parts = CSF street price x published markup tier (65–90% on $50–$200) + $30 coolant allowance (single anchor, carried as a point figure); dealer parts = OEM list + $40 coolant allowance. Labor 2.0–3.5h (book). Grade SUSPECT under the credibility standard (sole published estimator irreconcilable): held from new publication; see the benchmark record. Representative vehicle: 2019 Toyota Camry 2.5L.",
  },
  {
    id: "ac_compressor",
    verdict: "SOUND",
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
    verdict: "SOUND",
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
    verdict: "SOUND",
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
    verdict: "SOUND",
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
    verdict: "SUSPECT",
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
    verdict: "SOUND",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
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
    verdict: "SUSPECT",
    label: "Oil Change (Oil & Filter)",
    match: [/\boil\s*change\b/i, /\boil\s*&\s*filter\b/i, /\boil\s*and\s*filter\b/i],
    diyParts: [35, 75],
    shopParts: [35, 75],
    laborHours: [0.3, 0.5],
    diyTime: "30–45 minutes",
    shopTime: "30–60 minutes",
  },
];

/**
 * The publication gate (Decision 1, absolute): an entry's figures may
 * be served only when its recorded verdict is SOUND. The served set is
 * read from this field at call time, so a re-grade widens or narrows
 * coverage with no code change.
 */
export function isServableRate(entry: RepairRateEntry): boolean {
  return entry.verdict === "SOUND";
}

/** Entries whose figures may be served today (verdict SOUND). */
export function servableRates(): RepairRateEntry[] {
  return REPAIR_RATES.filter(isServableRate);
}

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
  if (entry.spanning) {
    // Channel-spanning derivation (methodology Section 3A): parts and
    // labor figures are the cross-channel spans; totals are the corner
    // sums (independent low + dealer high), rounded to the nearest $5.
    const spanningParts: [number, number] = [
      entry.spanning.independentParts[0],
      entry.spanning.dealerParts,
    ];
    const spanningLabor: [number, number] = [
      Math.round((entry.laborHours[0] * INDEPENDENT_LABOR_RATE_PER_HOUR[0]) / 5) * 5,
      Math.round((entry.laborHours[1] * DEALER_LABOR_RATE_PER_HOUR[1]) / 5) * 5,
    ];
    const spanningTotal: [number, number] = [
      Math.round((spanningParts[0] + spanningLabor[0]) / 5) * 5,
      Math.round((spanningParts[1] + spanningLabor[1]) / 5) * 5,
    ];
    return {
      diyParts: entry.diyParts ? [entry.diyParts[0], entry.diyParts[1]] : null,
      shopParts: spanningParts,
      shopLabor: spanningLabor,
      shopTotal: spanningTotal,
      laborHours: [entry.laborHours[0], entry.laborHours[1]],
    };
  }

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

/**
 * R-68 (book-only pricing): every priced result carries an explicit
 * price_status so no surface has to guess where a number came from.
 *   "book"        — figures were taken from this table (rate_source set).
 *   "not_in_book" — the repair matched no entry; NO price may be shown.
 * On a miss, pipelines must withhold the model's invented figures rather
 * than pass them through (the pre-R-68 "no match, no pin" precedent let
 * invented numbers render as if they were book prices).
 */
export type PriceStatus = "book" | "not_in_book";
export const PRICE_STATUS_BOOK: PriceStatus = "book";
export const PRICE_STATUS_NOT_IN_BOOK: PriceStatus = "not_in_book";

/** Plain-language honest state shown wherever a price block would go. */
export const NOT_IN_BOOK_MESSAGE =
  "This repair isn't in our price book yet, so we won't guess a price. A shop can price it after a hands-on look.";

/** String cost fields carried by a diagnose-style result object. */
export interface DiagnosisCostFields {
  diy_cost: string;
  shop_parts_cost: string;
  shop_labor_cost: string;
  shop_cost: string;
  diy_time?: string;
  shop_time?: string;
  rate_source?: string | null;
  price_status?: PriceStatus;
}

/**
 * Pin a diagnose-style result to the book, or strip its prices honestly.
 * On a match, ALL cost figures are replaced with book figures and the
 * result is stamped with rate_source + price_status "book". On a miss,
 * every cost figure is blanked and the result is stamped
 * price_status "not_in_book" with rate_source null, so renderers show
 * NOT_IN_BOOK_MESSAGE instead of a guessed price. The assessment itself
 * (title, causes, urgency, DIY guidance) is never touched.
 */
export function pinDiagnosisCosts<T extends DiagnosisCostFields>(
  diagnosis: T,
  entry: RepairRateEntry | null,
): T {
  if (entry) {
    const figures = rateFigures(entry);
    diagnosis.shop_parts_cost = formatMoneyRange(figures.shopParts);
    diagnosis.shop_labor_cost = formatMoneyRange(figures.shopLabor);
    diagnosis.shop_cost = formatMoneyRange(figures.shopTotal);
    if (figures.diyParts) {
      diagnosis.diy_cost = formatMoneyRange(figures.diyParts);
    }
    if (entry.diyTime) {
      diagnosis.diy_time = entry.diyTime;
    }
    diagnosis.shop_time = entry.shopTime;
    diagnosis.rate_source = RATE_SOURCE_ID;
    diagnosis.price_status = PRICE_STATUS_BOOK;
  } else {
    diagnosis.diy_cost = "";
    diagnosis.shop_parts_cost = "";
    diagnosis.shop_labor_cost = "";
    diagnosis.shop_cost = "";
    diagnosis.rate_source = null;
    diagnosis.price_status = PRICE_STATUS_NOT_IN_BOOK;
  }
  return diagnosis;
}
