/**
 * Scan report filing — the step that puts a parsed report on a vehicle's
 * Garage record.
 *
 * THE rule of this module: filing requires a confirmed vehicle id, chosen
 * by the owner in the UI after seeing the matcher's proposal. Every entry
 * point throws when the confirmed id is missing, and there is no default,
 * fallback, or proposal-derived filing path. A proposal is display data
 * only; it is never read here.
 */

import { GARAGE_MEDIA_BUCKET } from "@/lib/garageRecord";
import {
  confirmRequiredError,
  timelineDetail,
  timelineTitle,
} from "./copy";
import type { MatchableVehicle, ScanReport } from "./types";

/** Minimal structural surface of the Supabase JS client used here, so
 *  tests can inject a lightweight fake (same pattern as vehiclePhoto.ts). */
export interface ScanReportFilingClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: unknown,
      ): { single(): Promise<{ data?: unknown; error?: unknown }> };
    };
    insert(values: Record<string, unknown>): {
      select(columns: string): {
        single(): Promise<{ data?: unknown; error?: unknown }>;
      };
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: unknown): Promise<{ data?: unknown; error?: unknown }>;
    };
  };
}

export function sanitizeScanReportFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "scan-report.pdf";
}

/** Storage path for a newly uploaded scan report PDF. Lives under the
 *  owner's own prefix (storage RLS keys on the first path segment); the
 *  vehicle is not part of the path because filing happens after parsing. */
export function buildScanReportStoragePath(
  userId: string,
  filename: string,
  timestamp: number,
): string {
  return `${userId}/scan-reports/${timestamp}-${sanitizeScanReportFilename(filename)}`;
}

export interface TimelineEventPayload {
  vehicle_id: string;
  owner_user_id: string;
  vin: string | null;
  layer: "reported";
  category: "document";
  title: string;
  detail: string;
  source_type: "document";
  source_name: string;
  occurred_at: string;
  odometer: number | null;
  media: Array<{
    bucket: string;
    path: string;
    name: string;
    contentType: string;
    kind: "document";
  }>;
  created_by: string;
}

export function buildTimelineEventPayload(args: {
  userId: string;
  vehicle: MatchableVehicle & { vin?: string | null };
  report: ScanReport;
}): TimelineEventPayload {
  const { userId, vehicle, report } = args;
  return {
    vehicle_id: vehicle.id,
    owner_user_id: userId,
    vin: vehicle.vin ?? null,
    layer: "reported",
    category: "document",
    title: timelineTitle(report),
    detail: timelineDetail(report),
    source_type: "document",
    source_name: report.source_tool,
    occurred_at: report.scanned_at ?? report.created_at,
    odometer: report.odometer ?? report.parsed_payload.odometer ?? null,
    media: [
      {
        bucket: report.storage_bucket || GARAGE_MEDIA_BUCKET,
        path: report.storage_path,
        name: report.original_filename ?? "scan-report.pdf",
        contentType: "application/pdf",
        kind: "document",
      },
    ],
    created_by: userId,
  };
}

export function buildVehicleDocumentPayload(args: {
  userId: string;
  vehicleId: string;
  timelineEventId: string;
  report: ScanReport;
}): Record<string, unknown> {
  const { userId, vehicleId, timelineEventId, report } = args;
  return {
    vehicle_id: vehicleId,
    owner_user_id: userId,
    timeline_event_id: timelineEventId,
    storage_bucket: report.storage_bucket || GARAGE_MEDIA_BUCKET,
    storage_path: report.storage_path,
    original_filename: report.original_filename ?? "scan-report.pdf",
    content_type: "application/pdf",
    byte_size: null,
    document_kind: "scan_report",
    layer: "reported",
    source_name: report.source_tool,
    uploaded_by: userId,
  };
}

/**
 * File a parsed scan report onto the CONFIRMED vehicle's record:
 * timeline event (document-sourced) + vehicle document row + the
 * scan_reports row linked to both. Idempotent for an already-filed
 * report (returns the existing timeline event id).
 *
 * Throws when confirmedVehicleId is absent — by design, this is the
 * no-silent-filing guarantee, and the UI cannot reach this function from
 * a proposal alone.
 */
export async function fileScanReport(
  client: ScanReportFilingClient,
  args: {
    userId: string;
    report: ScanReport;
    confirmedVehicleId: string | null | undefined;
    vehicle: MatchableVehicle & { vin?: string | null };
  },
): Promise<{ timelineEventId: string }> {
  if (!args.confirmedVehicleId) {
    throw new Error(confirmRequiredError);
  }
  if (args.vehicle.id !== args.confirmedVehicleId) {
    throw new Error("The confirmed vehicle does not match the vehicle being filed to.");
  }
  const { userId, report } = args;

  const { data: fresh, error: fetchError } = await client
    .from("scan_reports")
    .select("*")
    .eq("id", report.id)
    .single();
  if (fetchError) throw fetchError;
  const current = fresh as ScanReport | undefined;
  if (!current || current.owner_user_id !== userId) {
    throw new Error("That scan report does not belong to this owner.");
  }
  if (current.timeline_event_id) {
    if (current.vehicle_id && current.vehicle_id !== args.confirmedVehicleId) {
      throw new Error("That scan report is already filed to a different vehicle.");
    }
    return { timelineEventId: current.timeline_event_id };
  }

  const timelinePayload = buildTimelineEventPayload({
    userId,
    vehicle: args.vehicle,
    report: current,
  });
  const { data: event, error: eventError } = await client
    .from("vehicle_timeline_events")
    .insert(timelinePayload as unknown as Record<string, unknown>)
    .select("*")
    .single();
  if (eventError) throw eventError;
  const timelineEventId = (event as { id: string }).id;

  const documentPayload = buildVehicleDocumentPayload({
    userId,
    vehicleId: args.confirmedVehicleId,
    timelineEventId,
    report: current,
  });
  const { error: documentError } = await client
    .from("vehicle_documents")
    .insert(documentPayload)
    .select("*")
    .single();
  if (documentError) throw documentError;

  const { error: updateError } = await client
    .from("scan_reports")
    .update({ vehicle_id: args.confirmedVehicleId, timeline_event_id: timelineEventId })
    .eq("id", current.id);
  if (updateError) throw updateError;

  return { timelineEventId };
}
