import jsPDF from "jspdf";
import {
  CORE_BASELINE_CHECKS,
  REPORTED_HISTORY_CAPTION,
  conditionEvidenceLabel,
  formatRecordDate,
  observedCoverage,
  weakPointCheckKey,
} from "@/lib/garageRecord";
import type {
  GarageVehicle,
  VehicleBaseline,
  VehicleBaselineResponse,
  VehicleConditionCheck,
  VehicleDocument,
  VehicleTimelineEvent,
  WeakPointCheck,
} from "@/types/garageRecord";

export interface GarageRecordExportData {
  vehicle: GarageVehicle;
  timeline: VehicleTimelineEvent[];
  checks: VehicleConditionCheck[];
  baselines: VehicleBaseline[];
  responses: VehicleBaselineResponse[];
  documents: VehicleDocument[];
  weakPoints: WeakPointCheck[];
}

function wrap(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function createGarageRecordPdf(data: GarageRecordExportData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 54;

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 48) {
      doc.addPage();
      y = 54;
    }
  };
  const write = (text: string, size = 10, leading = 14, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = wrap(doc, text, width);
    ensureSpace(lines.length * leading + 4);
    doc.text(lines, margin, y);
    y += lines.length * leading + 4;
  };
  const heading = (text: string) => {
    y += 10;
    write(text, 15, 19, true);
  };

  const vehicleName = `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`;
  write(`Wrenchli Garage vehicle record — ${vehicleName}`, 17, 22, true);
  write(`Exported ${formatRecordDate(new Date().toISOString())}. Reported history and observed condition are separate sections in this file.`);
  if (data.vehicle.vin) write(`VIN: ${data.vehicle.vin}`);

  heading("Reported History");
  write(REPORTED_HISTORY_CAPTION);
  const reported = data.timeline.filter((event) => event.layer === "reported");
  if (!reported.length) write("No reported-history entries are saved.");
  reported.forEach((event) => {
    write(
      `${formatRecordDate(event.occurred_at)} — ${event.title}. Source: ${event.source_name} (${event.source_type}). ${event.detail ?? ""}`,
    );
  });

  heading("Observed Condition");
  write("Coverage describes what has been captured only.");
  write(observedCoverage(data.checks).label, 10, 14, true);
  if (!data.checks.length) write("Not yet checked: no core condition checks have been captured.");
  data.checks.forEach((check) => {
    write(`${check.label}: ${conditionEvidenceLabel(check)}${check.note ? ` Note: ${check.note}` : ""}`);
  });

  const observed = data.timeline.filter((event) => event.layer === "observed");
  if (observed.length) {
    write("Observed timeline", 12, 16, true);
    observed.forEach((event) => {
      write(
        `${formatRecordDate(event.occurred_at)} — ${event.title}. Recorded by ${event.source_name}. ${event.detail ?? ""}`,
      );
    });
  }

  heading("Purchase-Day Baselines");
  if (!data.baselines.length) write("No baseline has been saved.");
  data.baselines.forEach((baseline) => {
    write(
      `${formatRecordDate(baseline.started_at)} — ${baseline.status}${baseline.odometer ? ` · odometer ${baseline.odometer.toLocaleString()}` : ""}`,
      11,
      15,
      true,
    );
    const baselineResponses = data.responses.filter((response) => response.baseline_id === baseline.id);
    const responseByKey = new Map(baselineResponses.map((response) => [response.check_key, response]));
    CORE_BASELINE_CHECKS.forEach((check) => {
      const response = responseByKey.get(check.key);
      write(
        response
          ? `${check.label}: ${response.response}${response.skip_reason ? ` — ${response.skip_reason}` : ""}${response.media?.length ? ` · ${response.media.length} evidence file${response.media.length === 1 ? "" : "s"}` : ""}`
          : `${check.label}: not answered in this run`,
      );
    });
    data.weakPoints.forEach((check) => {
      const response = responseByKey.get(weakPointCheckKey(check));
      write(
        `${check.title}: ${response ? response.response : "not answered in this run"}${response?.media?.length ? ` · ${response.media.length} evidence file${response.media.length === 1 ? "" : "s"}` : ""}. Source: ${check.citation_label}. ${check.citation_details}`,
      );
    });
  });

  heading("Documents Saved With This Vehicle");
  if (!data.documents.length) write("No documents are saved.");
  data.documents.forEach((document) => {
    write(
      `${document.original_filename} — ${document.layer} layer · uploaded by ${document.source_name} · ${formatRecordDate(document.created_at)}`,
    );
  });

  return doc;
}

export function downloadGarageRecordPdf(data: GarageRecordExportData) {
  const doc = createGarageRecordPdf(data);
  const filename = `wrenchli-garage-${data.vehicle.year}-${data.vehicle.make}-${data.vehicle.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`${filename}-record.pdf`);
}
