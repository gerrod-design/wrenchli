/**
 * Scan report import — shared client types.
 *
 * Mirrors the pure parser's output shape (supabase/functions/parse-scan-
 * report/parser.ts) and the public.scan_reports table. A scan report is
 * document-sourced record data: it states what a tool reported, in the
 * report's own words. It is never a verdict on the vehicle.
 */

export type ScanReportParseStatus = "parsed" | "partial" | "unparsed";

export interface ScanReportCode {
  code: string;
  system: string;
  description: string;
  status: string | null;
}

export interface ScanReportParsedPayload {
  sourceTool: string;
  reportId: string | null;
  scannedAt: string | null;
  vehicleLabel: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  vinFragment: string | null;
  odometer: number | null;
  odometerUnit: "mi" | "km" | null;
  codes: ScanReportCode[];
  noCodesReported: boolean;
  parseStatus: ScanReportParseStatus;
  parserVersion: number;
}

export interface ScanReport {
  id: string;
  owner_user_id: string;
  vehicle_id: string | null;
  timeline_event_id: string | null;
  source_tool: string;
  report_id: string | null;
  scanned_at: string | null;
  odometer: number | null;
  vin_fragment: string | null;
  vehicle_label: string | null;
  storage_bucket: string;
  storage_path: string;
  original_filename: string | null;
  parse_status: ScanReportParseStatus;
  parsed_payload: ScanReportParsedPayload;
  created_at: string;
  updated_at: string;
}

/** The vehicle fields the matcher needs — a subset of GarageVehicle. */
export interface MatchableVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  vin?: string | null;
  nickname?: string | null;
}

export function vehicleDisplayName(vehicle: MatchableVehicle): string {
  return vehicle.nickname?.trim()
    ? vehicle.nickname.trim()
    : `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

/** Group codes by system, preserving report order (display helper). */
export function groupScanReportCodes(
  codes: ScanReportCode[],
): Array<{ system: string; codes: ScanReportCode[] }> {
  const groups: Array<{ system: string; codes: ScanReportCode[] }> = [];
  const bySystem = new Map<string, ScanReportCode[]>();
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
