/**
 * Scan report text parser — pure module, no I/O, no Deno globals.
 *
 * Input is the TEXT extracted from a scan-tool PDF export (extraction
 * happens in index.ts). Output is a structured, honest read of that text:
 *
 *  - RepairSolutions2 exports are parsed against their documented layout
 *    (Report ID header, vehicle bar with last-6 VIN + odometer, per-system
 *    code sections).
 *  - Any other tool's text gets a generic fallback: code-shaped tokens
 *    (letter + digits OBD codes) are pulled with their line as the
 *    description and the result is labeled "partial" (best-effort).
 *  - Text that yields nothing recognizable is "unparsed" with ZERO codes.
 *    This parser never invents a code, a vehicle, or a reading.
 *
 * Layout assumptions are numbered in BUILD-REPORT.md (gate verifies them
 * against a real export before ship). The matching below is deliberately
 * tolerant of whitespace, ordering, and capitalization variation.
 */

export type ScanReportParseStatus = "parsed" | "partial" | "unparsed";

export interface ParsedScanCode {
  code: string;
  system: string;
  description: string;
  /** "stored" | "pending" | "permanent" | "intermittent" | "history" | null */
  status: string | null;
}

export interface ParsedScanReport {
  sourceTool: string;
  reportId: string | null;
  scannedAt: string | null;
  vehicleLabel: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  /** Last-6 VIN characters as printed on the report (uppercase alphanumerics). */
  vinFragment: string | null;
  odometer: number | null;
  odometerUnit: "mi" | "km" | null;
  codes: ParsedScanCode[];
  /** True when the report explicitly states a section (or the whole
   *  report) reported no codes. A parsed report may legitimately have
   *  zero codes. */
  noCodesReported: boolean;
  parseStatus: ScanReportParseStatus;
  parserVersion: number;
}

export const SCAN_REPORT_PARSER_VERSION = 1;

export const SOURCE_TOOL_INNOVA = "Innova RepairSolutions2";
export const SOURCE_TOOL_BLUEDRIVER = "BlueDriver";
export const SOURCE_TOOL_UNKNOWN = "Unknown scan tool";

const UNSPECIFIED_SYSTEM = "Unspecified system";

/** Fresh instances per call: matchAll mutates lastIndex on shared /g
 *  regexes, so these are built inside codesInLine instead of module scope. */
const OBD_CODE_SOURCE = "\\b([PBCU][0-9][0-9A-F]{3})\\b";
/** Manufacturer module codes as printed by RS2 all-system scans: exactly
 *  six hex characters, at least one digit (e.g. 03178A, 804081, B7F500). */
const MODULE_CODE_SOURCE = "\\b([0-9A-F]{6})\\b";

const STATUS_WORDS: Array<{ re: RegExp; value: string }> = [
  { re: /\bintermittent\b/i, value: "Intermittent" },
  { re: /\bpermanent\b/i, value: "Permanent" },
  { re: /\bpending\b/i, value: "Pending" },
  { re: /\bhistory\b/i, value: "History" },
  { re: /\bstored\b/i, value: "Stored" },
  { re: /\bcurrent\b/i, value: "Current" },
];

const MODULE_KEYWORDS =
  /(system|module|engine|transmission|abs|srs|airbag|body|network|obd|emissions?|brake|steering|hvac|climate|cluster|amplifier|audio|door|camera|telephone|communication|control|drive|seat|lighting|charging|battery|head unit|telematic|gateway|instrument|infotainment|immobilizer|alarm|tpms|parking)/i;

const NO_CODES_RE =
  /\b(no (codes?|faults?|dtcs?|trouble codes?)|no codes (found|reported|present)|0 (codes|faults|dtcs)|system (ok|passed)|all systems? (ok|passed))\b/i;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function stripSeparators(text: string): string {
  return text.replace(/^[\s:\-–—•·|]+/, "").trim();
}

function detectSourceTool(text: string): string {
  if (/repairsolutions/i.test(text) || /\binnova\b/i.test(text)) {
    return SOURCE_TOOL_INNOVA;
  }
  if (/bluedriver/i.test(text)) return SOURCE_TOOL_BLUEDRIVER;
  return SOURCE_TOOL_UNKNOWN;
}

function extractReportId(lines: string[]): string | null {
  for (const line of lines) {
    const m = line.match(/report\s*(?:id|no\.?|#)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9-]{0,31})/i);
    if (m && /\d/.test(m[1])) return m[1];
  }
  return null;
}

function extractScannedAt(text: string): string | null {
  const candidates: string[] = [];
  const labeled = text.match(
    /(?:date|scanned|created|generated)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i,
  );
  if (labeled) candidates.push(labeled[1]);
  const standalone = text.match(/\b([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})\b/);
  if (standalone) candidates.push(standalone[1]);
  const numeric = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
  if (numeric) candidates.push(numeric[1]);
  for (const c of candidates) {
    const t = Date.parse(c);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return null;
}

interface VehicleIdentity {
  vehicleLabel: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
}

function extractVehicle(lines: string[]): VehicleIdentity {
  for (const line of lines) {
    // A year-leading vehicle bar: "2022 BMW M850XI" possibly after a label.
    const m = line.match(/(?:^|\bvehicle\s*[:\-]?\s*)\b((?:19|20)\d{2})\s+([A-Za-z][A-Za-z&-]*)\s+(.+)$/i);
    if (m) {
      const year = Number(m[1]);
      const make = m[2];
      // Model: rest of the bar, minus trailing fields that share the line.
      let model = m[3]
        .replace(/\b(vin|odometer|mileage|report)\b.*$/i, "")
        .trim();
      if (model) {
        return {
          vehicleLabel: `${year} ${make} ${model}`,
          year,
          make,
          model,
        };
      }
    }
  }
  return { vehicleLabel: null, year: null, make: null, model: null };
}

function extractVinFragment(text: string): string | null {
  const labeled = text.match(/vin\s*[:#]?\s*([A-HJ-NPR-Z0-9*•·.\- ]{4,30})/i);
  if (labeled) {
    const alnum = labeled[1].toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (alnum.length >= 4) return alnum.slice(-6);
  }
  const full = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (full) return full[1].slice(-6);
  return null;
}

function extractOdometer(
  lines: string[],
): { value: number | null; unit: "mi" | "km" | null } {
  for (const line of lines) {
    const m = line.match(
      /(?:odometer|mileage)\s*[:\-]?\s*([\d,]{2,})\s*(mi|miles|km|kilometers|kilometres)?/i,
    );
    if (m) {
      const value = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value >= 0 && value <= 2_000_000) {
        const unitRaw = (m[2] ?? "").toLowerCase();
        return {
          value,
          unit: unitRaw.startsWith("k") ? "km" : "mi",
        };
      }
    }
  }
  return { value: null, unit: null };
}

function isHeadingLine(line: string, hasCode: boolean): boolean {
  if (hasCode) return false;
  if (line.length < 3 || line.length > 70) return false;
  if (NO_CODES_RE.test(line)) return false;
  if (/^(report|date|vin|odometer|mileage|vehicle)\b/i.test(line)) return false;
  if (line.endsWith(":")) return true;
  if (MODULE_KEYWORDS.test(line) && !/[.!?]$/.test(line)) return true;
  return false;
}

function codesInLine(
  line: string,
  opts: { rs2Shaped: boolean; sectionHasCode: boolean },
): Array<{ code: string; index: number }> {
  const found: Array<{ code: string; index: number }> = [];
  const seen = new Set<string>();
  for (const m of line.matchAll(new RegExp(OBD_CODE_SOURCE, "g"))) {
    const code = m[1].toUpperCase();
    if (!seen.has(code)) {
      seen.add(code);
      found.push({ code, index: m.index ?? 0 });
    }
  }
  if (found.length === 0 && opts.rs2Shaped) {
    // Module codes only inside an RS2-shaped report. A token qualifies
    // when it contains a hex letter, or a status word shares its line, or
    // its section already produced a code, or it leads the line followed
    // by description words (the "031794 Telephone calls" shape). This
    // keeps freeze-frame numbers and dates out while admitting the
    // status-less module lines RS2 prints.
    for (const m of line.matchAll(new RegExp(MODULE_CODE_SOURCE, "g"))) {
      const token = m[1].toUpperCase();
      if (!/\d/.test(token)) continue;
      const hasLetter = /[A-F]/.test(token);
      const hasStatus = STATUS_WORDS.some((s) => s.re.test(line));
      const leadsWithDescription =
        (m.index ?? 0) === 0 && line.slice(token.length).trim().split(/\s+/).length >= 2;
      if (!hasLetter && !hasStatus && !opts.sectionHasCode && !leadsWithDescription) {
        continue;
      }
      if (!seen.has(token)) {
        seen.add(token);
        found.push({ code: token, index: m.index ?? 0 });
      }
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

function statusInLine(line: string): string | null {
  for (const s of STATUS_WORDS) {
    if (s.re.test(line)) return s.value;
  }
  return null;
}

/**
 * Parse extracted PDF text into a structured scan report. Pure and
 * deterministic; safe to call with arbitrary garbage (returns unparsed).
 */
export function parseScanReportText(rawText: string): ParsedScanReport {
  const base: ParsedScanReport = {
    sourceTool: SOURCE_TOOL_UNKNOWN,
    reportId: null,
    scannedAt: null,
    vehicleLabel: null,
    year: null,
    make: null,
    model: null,
    vinFragment: null,
    odometer: null,
    odometerUnit: null,
    codes: [],
    noCodesReported: false,
    parseStatus: "unparsed",
    parserVersion: SCAN_REPORT_PARSER_VERSION,
  };

  if (!rawText || rawText.trim().length < 20) return base;

  const text = rawText.replace(/ /g, " ");
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  if (lines.length === 0) return base;

  const sourceTool = detectSourceTool(text);
  const reportId = extractReportId(lines);
  const scannedAt = extractScannedAt(text);
  const vehicle = extractVehicle(lines);
  const vinFragment = extractVinFragment(text);
  const odo = extractOdometer(lines);

  const rs2Shaped =
    sourceTool === SOURCE_TOOL_INNOVA ||
    (reportId !== null && vinFragment !== null && vehicle.year !== null);

  let currentSystem = UNSPECIFIED_SYSTEM;
  let sectionHasCode = false;
  const codes: ParsedScanCode[] = [];
  const seenKeys = new Set<string>();
  let noCodesReported = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (NO_CODES_RE.test(line)) noCodesReported = true;

    // Never mine identity/label lines for codes (odometer digits, VIN
    // fragments, and report ids are number-shaped but are not codes).
    if (/^(vin|odometer|mileage|report\s*(id|no|#)?)\b/i.test(line)) continue;

    const inLine = codesInLine(line, { rs2Shaped, sectionHasCode });
    if (inLine.length === 0) {
      // Heading: a keyword/colon section title, or a short label line
      // immediately followed by a code-bearing line ("Head Unit" shape).
      const next = lines[i + 1];
      const nextHasCode =
        next !== undefined &&
        codesInLine(next, { rs2Shaped, sectionHasCode: true }).length > 0;
      const labelShape =
        nextHasCode &&
        line.length <= 60 &&
        line.split(/\s+/).length <= 7 &&
        !/[.!?]$/.test(line) &&
        /[A-Za-z]/.test(line) &&
        !NO_CODES_RE.test(line);
      if (isHeadingLine(line, false) || labelShape) {
        currentSystem = line.replace(/:\s*$/, "").trim();
        sectionHasCode = false;
      }
      continue;
    }
    sectionHasCode = true;

    for (const { code, index } of inLine) {
      const rest = stripSeparators(line.slice(index + code.length));
      // Description: the remainder of the code's own line, minus a
      // trailing status-only fragment; never text from other lines.
      let description = rest;
      const key = `${currentSystem}::${code}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      codes.push({
        code,
        system: currentSystem,
        description,
        status: statusInLine(line),
      });
    }
  }

  const hasIdentity =
    vehicle.year !== null || vinFragment !== null || odo.value !== null;

  let parseStatus: ScanReportParseStatus;
  if (rs2Shaped && (codes.length > 0 || noCodesReported) && hasIdentity) {
    parseStatus = "parsed";
  } else if (codes.length > 0 || hasIdentity) {
    parseStatus = "partial";
  } else {
    parseStatus = "unparsed";
  }

  if (parseStatus === "unparsed") {
    return { ...base, sourceTool, parseStatus };
  }

  return {
    sourceTool,
    reportId,
    scannedAt,
    vehicleLabel: vehicle.vehicleLabel,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    vinFragment,
    odometer: odo.value,
    odometerUnit: odo.unit,
    codes,
    noCodesReported,
    parseStatus,
    parserVersion: SCAN_REPORT_PARSER_VERSION,
  };
}

/** Group parsed codes by their system, preserving report order. */
export function groupCodesBySystem(
  codes: ParsedScanCode[],
): Array<{ system: string; codes: ParsedScanCode[] }> {
  const groups: Array<{ system: string; codes: ParsedScanCode[] }> = [];
  const bySystem = new Map<string, ParsedScanCode[]>();
  for (const code of codes) {
    const existing = bySystem.get(code.system);
    if (existing) {
      existing.push(code);
    } else {
      const fresh = [code];
      bySystem.set(code.system, fresh);
      groups.push({ system: code.system, codes: fresh });
    }
  }
  return groups;
}
