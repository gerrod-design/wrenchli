import { describe, expect, it } from "vitest";
import { confirmRequiredError } from "@/lib/scanReport/copy";
import {
  buildScanReportStoragePath,
  buildTimelineEventPayload,
  buildVehicleDocumentPayload,
  fileScanReport,
  sanitizeScanReportFilename,
  type ScanReportFilingClient,
} from "@/lib/scanReport/filing";
import type { MatchableVehicle, ScanReport } from "@/lib/scanReport/types";

const OWNER = "user-owner";
const OTHER = "user-other";

const VEHICLE: MatchableVehicle & { vin: string } = {
  id: "veh-1",
  year: 2022,
  make: "BMW",
  model: "M850i",
  vin: "WBAGV8C0XNCH32006",
};

function makeReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    id: "report-1",
    owner_user_id: OWNER,
    vehicle_id: null,
    timeline_event_id: null,
    source_tool: "Innova RepairSolutions2",
    report_id: "102",
    scanned_at: "2026-10-25T16:41:00.000Z",
    odometer: 144128,
    vin_fragment: "H32006",
    vehicle_label: "2022 BMW M850XI",
    storage_bucket: "garage-vehicle-media",
    storage_path: `${OWNER}/scan-reports/1730000000000-rs2-report.pdf`,
    original_filename: "rs2-report.pdf",
    parse_status: "parsed",
    parsed_payload: {
      sourceTool: "Innova RepairSolutions2",
      reportId: "102",
      scannedAt: "2026-10-25T16:41:00.000Z",
      vehicleLabel: "2022 BMW M850XI",
      year: 2022,
      make: "BMW",
      model: "M850XI",
      vinFragment: "H32006",
      odometer: 144128,
      odometerUnit: "mi",
      codes: [
        {
          code: "B7F500",
          system: "HiFi Amplifier",
          description: "Microphone driver not calibrated",
          status: "Intermittent",
        },
      ],
      noCodesReported: true,
      parseStatus: "parsed",
      parserVersion: 1,
    },
    created_at: "2026-10-26T12:00:00.000Z",
    updated_at: "2026-10-26T12:00:00.000Z",
    ...overrides,
  };
}

interface FakeCalls {
  inserted: Array<{ table: string; values: Record<string, unknown> }>;
  updated: Array<{ table: string; values: Record<string, unknown> }>;
}

function makeFakeClient(freshReport: ScanReport | null) {
  const calls: FakeCalls = { inserted: [], updated: [] };
  const client = {
    from(table: string) {
      return {
        select: (_columns: string) => ({
          eq: (_column: string, _value: unknown) => ({
            single: async () =>
              table === "scan_reports"
                ? { data: freshReport, error: null }
                : { data: null, error: new Error("unexpected select") },
          }),
        }),
        insert: (values: Record<string, unknown>) => {
          calls.inserted.push({ table, values });
          return {
            select: (_columns: string) => ({
              single: async () => ({
                data: {
                  id:
                    table === "vehicle_timeline_events"
                      ? "evt-1"
                      : table === "vehicle_documents"
                        ? "doc-1"
                        : "row-1",
                },
                error: null,
              }),
            }),
          };
        },
        update: (values: Record<string, unknown>) => ({
          eq: async (_column: string, _value: unknown) => {
            calls.updated.push({ table, values });
            return { data: null, error: null };
          },
        }),
      };
    },
  } as unknown as ScanReportFilingClient;
  return { client, calls };
}

describe("fileScanReport — the no-silent-filing guarantee", () => {
  it("throws when no vehicle was confirmed, and writes nothing", async () => {
    const { client, calls } = makeFakeClient(makeReport());
    await expect(
      fileScanReport(client, {
        userId: OWNER,
        report: makeReport(),
        confirmedVehicleId: null,
        vehicle: VEHICLE,
      }),
    ).rejects.toThrow(confirmRequiredError);
    expect(calls.inserted).toHaveLength(0);
    expect(calls.updated).toHaveLength(0);
  });

  it("throws when the confirmed id is undefined", async () => {
    const { client, calls } = makeFakeClient(makeReport());
    await expect(
      fileScanReport(client, {
        userId: OWNER,
        report: makeReport(),
        confirmedVehicleId: undefined,
        vehicle: VEHICLE,
      }),
    ).rejects.toThrow(confirmRequiredError);
    expect(calls.inserted).toHaveLength(0);
  });

  it("throws when the vehicle object does not match the confirmed id", async () => {
    const { client, calls } = makeFakeClient(makeReport());
    await expect(
      fileScanReport(client, {
        userId: OWNER,
        report: makeReport(),
        confirmedVehicleId: "veh-other",
        vehicle: VEHICLE,
      }),
    ).rejects.toThrow();
    expect(calls.inserted).toHaveLength(0);
  });

  it("throws for a report owned by someone else", async () => {
    const { client, calls } = makeFakeClient(makeReport({ owner_user_id: OTHER }));
    await expect(
      fileScanReport(client, {
        userId: OWNER,
        report: makeReport(),
        confirmedVehicleId: VEHICLE.id,
        vehicle: VEHICLE,
      }),
    ).rejects.toThrow();
    expect(calls.inserted).toHaveLength(0);
  });
});

describe("fileScanReport — happy path", () => {
  it("writes a document-sourced timeline event, a document row, and links the report", async () => {
    const report = makeReport();
    const { client, calls } = makeFakeClient(report);
    const result = await fileScanReport(client, {
      userId: OWNER,
      report,
      confirmedVehicleId: VEHICLE.id,
      vehicle: VEHICLE,
    });
    expect(result.timelineEventId).toBe("evt-1");

    const timelineInsert = calls.inserted.find(
      (c) => c.table === "vehicle_timeline_events",
    );
    expect(timelineInsert).toBeDefined();
    expect(timelineInsert!.values.layer).toBe("reported");
    expect(timelineInsert!.values.category).toBe("document");
    expect(timelineInsert!.values.source_type).toBe("document");
    expect(timelineInsert!.values.source_name).toBe("Innova RepairSolutions2");
    expect(timelineInsert!.values.title).toContain("Scan report");
    expect(timelineInsert!.values.odometer).toBe(144128);
    const media = timelineInsert!.values.media as Array<Record<string, unknown>>;
    expect(media[0].path).toBe(report.storage_path);
    expect(media[0].bucket).toBe("garage-vehicle-media");
    expect(media[0].contentType).toBe("application/pdf");

    const documentInsert = calls.inserted.find((c) => c.table === "vehicle_documents");
    expect(documentInsert).toBeDefined();
    expect(documentInsert!.values.document_kind).toBe("scan_report");
    expect(documentInsert!.values.timeline_event_id).toBe("evt-1");
    expect(documentInsert!.values.storage_path).toBe(report.storage_path);

    const link = calls.updated.find((c) => c.table === "scan_reports");
    expect(link).toBeDefined();
    expect(link!.values.vehicle_id).toBe(VEHICLE.id);
    expect(link!.values.timeline_event_id).toBe("evt-1");
  });

  it("is idempotent for an already-filed report on the same vehicle", async () => {
    const filed = makeReport({ vehicle_id: VEHICLE.id, timeline_event_id: "evt-9" });
    const { client, calls } = makeFakeClient(filed);
    const result = await fileScanReport(client, {
      userId: OWNER,
      report: filed,
      confirmedVehicleId: VEHICLE.id,
      vehicle: VEHICLE,
    });
    expect(result.timelineEventId).toBe("evt-9");
    expect(calls.inserted).toHaveLength(0);
  });

  it("refuses to re-file a report already filed to a different vehicle", async () => {
    const filed = makeReport({ vehicle_id: "veh-2", timeline_event_id: "evt-9" });
    const { client, calls } = makeFakeClient(filed);
    await expect(
      fileScanReport(client, {
        userId: OWNER,
        report: filed,
        confirmedVehicleId: VEHICLE.id,
        vehicle: VEHICLE,
      }),
    ).rejects.toThrow();
    expect(calls.inserted).toHaveLength(0);
  });
});

describe("payload builders and storage paths", () => {
  it("timeline payload uses the scan date as the event time", () => {
    const payload = buildTimelineEventPayload({
      userId: OWNER,
      vehicle: VEHICLE,
      report: makeReport(),
    });
    expect(payload.occurred_at).toBe("2026-10-25T16:41:00.000Z");
    expect(payload.detail).toContain("144,128 mi");
  });

  it("document payload carries the original PDF identity", () => {
    const payload = buildVehicleDocumentPayload({
      userId: OWNER,
      vehicleId: VEHICLE.id,
      timelineEventId: "evt-1",
      report: makeReport(),
    });
    expect(payload.original_filename).toBe("rs2-report.pdf");
    expect(payload.content_type).toBe("application/pdf");
  });

  it("storage paths stay under the owner's prefix and sanitize names", () => {
    expect(buildScanReportStoragePath(OWNER, "My Report (final).PDF", 42)).toBe(
      `${OWNER}/scan-reports/42-My-Report-final-.PDF`,
    );
    expect(sanitizeScanReportFilename("a/b\\c.pdf")).toBe("a-b-c.pdf");
  });
});
