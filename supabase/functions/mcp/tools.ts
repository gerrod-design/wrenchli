// The two Decision 1 tools: repair price check and trouble-code lookup.
//
// Pure module (no I/O, no Deno APIs): builders take validated arguments
// and return the structured answer plus the facts the protocol layer
// logs (which repair or code, whether a figure was served). Prices come
// ONLY from the shared price book, and only when the book entry's
// verdict is SOUND (repair-rates.ts) — the gate is absolute. Trouble
// code meanings come from the shared DTC library; the library's
// per-code display cost strings are never served here.

import {
  findRepairRate,
  formatMoneyRange,
  isServableRate,
  rateFigures,
  REPAIR_RATES,
  RATE_TABLE_VERSION,
  type RepairRateEntry,
} from "../_shared/repair-rates.ts";
import {
  getDtcEntry,
  getDtcRepairId,
  isValidDtcPattern,
} from "../_shared/dtc-codes.ts";
import { emptyValueContext, type ValueContext } from "../_shared/value-slot.ts";

export const PRICE_TOOL_NAME = "check_repair_price";
export const DTC_TOOL_NAME = "lookup_trouble_code";

export const PRICE_TOOL = {
  name: PRICE_TOOL_NAME,
  description:
    "Look up Wrenchli's published price range for a specific car repair. " +
    "Returns the range a driver should expect, with the basis it rests on: " +
    "the low end is a competent independent shop on quality aftermarket " +
    "parts, the high end a franchised dealership on factory parts. Only " +
    "ranges that pass Wrenchli's credibility grading are served; for a " +
    "repair whose range has not passed yet, the tool says so plainly " +
    "instead of returning a number. A free Wrenchli API key is required " +
    "(instant and free; see the developer documentation).",
  inputSchema: {
    type: "object",
    properties: {
      repair: {
        type: "string",
        description:
          "The repair to price, by name (e.g. \"alternator replacement\", " +
          "\"brake pads and rotors\") or by Wrenchli price book id " +
          "(e.g. \"alternator\"). Free text is matched to the price book.",
      },
      vehicle: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Model year, e.g. 2020." },
          make: { type: "string", description: "Manufacturer, e.g. Toyota." },
          model: { type: "string", description: "Model, e.g. Camry." },
          engine: { type: "string", description: "Engine, where known (optional)." },
        },
        required: ["year", "make", "model"],
        additionalProperties: false,
        description:
          "The vehicle the repair is for (optional). Published ranges are " +
          "compiled for typical vehicles and are not specific to one " +
          "vehicle; the vehicle is carried as context.",
      },
    },
    required: ["repair"],
    additionalProperties: false,
  },
};

export const DTC_TOOL = {
  name: DTC_TOOL_NAME,
  description:
    "Look up what a vehicle trouble code (DTC, e.g. P0420) means in " +
    "plain language: what the code is reporting, the common causes, and " +
    "how urgent it is. Where the code maps to a repair in Wrenchli's " +
    "price book, the published price range is included under the same " +
    "credibility grading as the price check tool; where it has not " +
    "passed grading, the meaning is returned with no price. Meanings " +
    "are Wrenchli's own educational content and are always free. A free " +
    "Wrenchli API key is required (instant and free).",
  inputSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "The trouble code, e.g. \"P0420\".",
      },
      vehicle: {
        type: "object",
        properties: {
          year: { type: "integer", description: "Model year, e.g. 2020." },
          make: { type: "string", description: "Manufacturer, e.g. Toyota." },
          model: { type: "string", description: "Model, e.g. Camry." },
        },
        required: ["year", "make", "model"],
        additionalProperties: false,
        description: "The vehicle the code was read from (optional context).",
      },
    },
    required: ["code"],
    additionalProperties: false,
  },
};

export interface VehicleContext {
  year: number;
  make: string;
  model: string;
  engine?: string;
}

export interface PriceCheckArguments {
  repair: string;
  vehicle?: VehicleContext;
}

export interface DtcLookupArguments {
  code: string;
  vehicle?: Omit<VehicleContext, "engine">;
}

const FRAMING =
  "Published Wrenchli price book range. The low end is a competent " +
  "independent shop on quality aftermarket parts; the high end is a " +
  "franchised dealership on factory (OEM) parts. Labor corridors: " +
  "independent shops $100-$132 per hour, dealerships $140-$200 per hour.";

const DEFAULT_PROVENANCE =
  "Wrenchli editorial estimate (price book compiled 2026-10-19), read " +
  "as a channel-spanning range under the price book methodology.";

const NOT_A_QUOTE =
  "A published range is planning information, not a quote, bid, or " +
  "guaranteed price; a shop prices the actual job after a hands-on look.";

export interface PriceBlock {
  published: true;
  range_usd: { low: number; high: number };
  range_formatted: string;
  parts_usd: { low: number; high: number };
  labor_usd: { low: number; high: number };
  labor_hours: { low: number; high: number };
  basis: {
    framing: string;
    scope_note: string | null;
    provenance: string;
    book_version: string;
  };
  value_context: ValueContext;
  note: string;
}

function buildPriceBlock(entry: RepairRateEntry): PriceBlock {
  const figures = rateFigures(entry);
  const range = { low: figures.shopTotal[0], high: figures.shopTotal[1] };
  return {
    published: true,
    range_usd: range,
    range_formatted: formatMoneyRange(figures.shopTotal),
    parts_usd: { low: figures.shopParts[0], high: figures.shopParts[1] },
    labor_usd: { low: figures.shopLabor[0], high: figures.shopLabor[1] },
    labor_hours: { low: figures.laborHours[0], high: figures.laborHours[1] },
    basis: {
      framing: FRAMING,
      scope_note: entry.basisNote ?? null,
      provenance: entry.provenance ?? DEFAULT_PROVENANCE,
      book_version: RATE_TABLE_VERSION,
    },
    value_context: emptyValueContext(range),
    note: NOT_A_QUOTE,
  };
}

function notPublishedMessage(entry: RepairRateEntry): string {
  return (
    `Wrenchli's price book has an entry for ${entry.label}, but its range ` +
    "is not published yet: every figure we serve has to pass our " +
    "credibility grading, and this one has not passed yet. We would " +
    "rather tell you that than hand you a number we cannot stand behind."
  );
}

export interface PriceCheckOutcome {
  result: Record<string, unknown>;
  repairId: string | null;
  servedFigure: boolean;
  rangeUsd: { low: number; high: number } | null;
}

function matchRepair(repairText: string): RepairRateEntry | null {
  const normalized = repairText.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const byId = REPAIR_RATES.find((e) => e.id === normalized);
  if (byId) return byId;
  const byLabel = REPAIR_RATES.find(
    (e) => e.label.toLowerCase() === repairText.trim().toLowerCase(),
  );
  if (byLabel) return byLabel;
  return findRepairRate(repairText);
}

export function buildPriceCheck(args: PriceCheckArguments): PriceCheckOutcome {
  const entry = matchRepair(args.repair);
  if (!entry) {
    return {
      result: {
        tool: PRICE_TOOL_NAME,
        published: false,
        repair_matched: null,
        message:
          "We do not publish a range for that repair yet. The price book " +
          "covers a growing list of common repairs, and we only serve " +
          "figures that pass our credibility grading.",
        value_context: emptyValueContext(null),
      },
      repairId: null,
      servedFigure: false,
      rangeUsd: null,
    };
  }
  if (!isServableRate(entry)) {
    return {
      result: {
        tool: PRICE_TOOL_NAME,
        published: false,
        repair_matched: { id: entry.id, label: entry.label },
        message: notPublishedMessage(entry),
        value_context: emptyValueContext(null),
      },
      repairId: entry.id,
      servedFigure: false,
      rangeUsd: null,
    };
  }
  const block = buildPriceBlock(entry);
  return {
    result: {
      tool: PRICE_TOOL_NAME,
      repair: { id: entry.id, label: entry.label },
      vehicle_context: args.vehicle ?? null,
      ...block,
    },
    repairId: entry.id,
    servedFigure: true,
    rangeUsd: block.range_usd,
  };
}

const URGENCY_NOTES: Record<string, string> = {
  low:
    "Not urgent for most drivers: plan to have it looked at when " +
    "convenient, and pay attention to any change in how the vehicle runs.",
  medium:
    "Worth scheduling a look soon. Most drivers can keep driving gently " +
    "in the meantime; if the vehicle starts running worse, move it up.",
  high:
    "Have this looked at right away. If the vehicle feels unsafe to " +
    "drive, do not drive it; have it towed to a shop instead.",
};

export interface DtcLookupOutcome {
  result: Record<string, unknown>;
  dtcCode: string;
  repairId: string | null;
  servedFigure: boolean;
  rangeUsd: { low: number; high: number } | null;
}

export function buildDtcLookup(args: DtcLookupArguments): DtcLookupOutcome {
  const code = args.code.trim().toUpperCase();
  const entry = getDtcEntry(code);
  if (!entry) {
    return {
      result: {
        tool: DTC_TOOL_NAME,
        found: false,
        code,
        message:
          "That code is not in our trouble-code library yet. The library " +
          "covers the codes drivers ask about most, and it grows from " +
          "our own published code pages.",
      },
      dtcCode: code,
      repairId: null,
      servedFigure: false,
      rangeUsd: null,
    };
  }

  const repairId = getDtcRepairId(code);
  const repairEntry = repairId
    ? REPAIR_RATES.find((e) => e.id === repairId) ?? null
    : null;

  let price: unknown = null;
  let servedFigure = false;
  let rangeUsd: { low: number; high: number } | null = null;
  if (repairEntry) {
    if (isServableRate(repairEntry)) {
      const block = buildPriceBlock(repairEntry);
      price = { repair: { id: repairEntry.id, label: repairEntry.label }, ...block };
      servedFigure = true;
      rangeUsd = block.range_usd;
    } else {
      price = {
        repair: { id: repairEntry.id, label: repairEntry.label },
        published: false,
        note:
          "No price is published for the repair this code points to yet, " +
          "so none is shown here; the meaning above stands on its own.",
      };
    }
  }

  return {
    result: {
      tool: DTC_TOOL_NAME,
      found: true,
      code: entry.code,
      name: entry.name,
      meaning: entry.description,
      common_causes: entry.commonCauses,
      causes_note:
        "Common causes, most frequently reported first. Treat this as a " +
        "list of possibilities to discuss with a technician, not a " +
        "verdict on your vehicle: the same code can have different " +
        "causes on different vehicles.",
      urgency: entry.urgency,
      urgency_note: URGENCY_NOTES[entry.urgency],
      diy_feasibility: entry.diyFeasibility,
      vehicle_context: args.vehicle ?? null,
      price,
    },
    dtcCode: entry.code,
    repairId,
    servedFigure,
    rangeUsd,
  };
}

// Argument validation (mirrors the assessment validator's style).
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateVehicle(
  vehicle: unknown,
  allowEngine: boolean,
): { ok: true; value?: VehicleContext } | { ok: false; message: string } {
  if (vehicle === undefined) return { ok: true, value: undefined };
  if (!isObject(vehicle)) {
    return { ok: false, message: "'vehicle' must be an object with year, make, and model when provided." };
  }
  const { year, make, model, engine } = vehicle;
  if (typeof year !== "number" || !Number.isInteger(year) || year < 1900 || year > 2100) {
    return { ok: false, message: "'vehicle.year' must be an integer model year (1900-2100)." };
  }
  if (typeof make !== "string" || make.trim().length === 0 || make.length > 100) {
    return { ok: false, message: "'vehicle.make' must be a non-empty string (max 100 characters)." };
  }
  if (typeof model !== "string" || model.trim().length === 0 || model.length > 100) {
    return { ok: false, message: "'vehicle.model' must be a non-empty string (max 100 characters)." };
  }
  if (engine !== undefined && (!allowEngine || typeof engine !== "string" || engine.length > 100)) {
    return { ok: false, message: "'vehicle.engine' must be a string of at most 100 characters when provided." };
  }
  return {
    ok: true,
    value: {
      year,
      make,
      model,
      ...(allowEngine && typeof engine === "string" ? { engine } : {}),
    },
  };
}

export function validatePriceCheckArguments(
  args: unknown,
): { ok: true; value: PriceCheckArguments } | { ok: false; message: string } {
  if (!isObject(args)) {
    return { ok: false, message: "Arguments must be an object with a 'repair'." };
  }
  const { repair, vehicle } = args;
  if (typeof repair !== "string" || repair.trim().length === 0 || repair.length > 200) {
    return { ok: false, message: "'repair' is required and must be a non-empty string (max 200 characters)." };
  }
  const v = validateVehicle(vehicle, true);
  if (!v.ok) return v;
  return { ok: true, value: { repair, ...(v.value ? { vehicle: v.value } : {}) } };
}

export function validateDtcLookupArguments(
  args: unknown,
): { ok: true; value: DtcLookupArguments } | { ok: false; message: string } {
  if (!isObject(args)) {
    return { ok: false, message: "Arguments must be an object with a 'code'." };
  }
  const { code, vehicle } = args;
  if (typeof code !== "string" || !isValidDtcPattern(code.trim())) {
    return { ok: false, message: "'code' is required and must look like a trouble code (e.g. P0420)." };
  }
  const v = validateVehicle(vehicle, false);
  if (!v.ok) return v;
  return { ok: true, value: { code, ...(v.value ? { vehicle: v.value } : {}) } };
}
