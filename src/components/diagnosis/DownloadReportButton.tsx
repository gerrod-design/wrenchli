import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Diagnosis } from "./types";

interface DownloadReportProps {
  vehicle: string;
  diagnoses: Diagnosis[];
  symptom?: string;
  codes?: string;
  year?: string;
  make?: string;
  model?: string;
}

const urgencyLabel: Record<string, { text: string; cls: string }> = {
  low: { text: "Monitor — No immediate action needed. Keep an eye on this issue and note any changes.", cls: "urgency-low" },
  medium: { text: "Schedule Soon — This should be addressed within the next few weeks to prevent further damage.", cls: "urgency-medium" },
  high: { text: "Urgent — Address as soon as possible. Continuing to drive may cause additional damage or safety risk.", cls: "urgency-high" },
};

const MECHANIC_QUESTIONS = [
  "Can you confirm which of these possible causes applies to my vehicle?",
  "Are there any related issues I should inspect at the same time?",
  "What is the expected timeline for this repair?",
  "Is it safe to continue driving while waiting for the repair?",
  "Can you provide a written estimate before starting work?",
];

function buildPrintContent(props: DownloadReportProps) {
  const { vehicle, diagnoses, symptom, codes } = props;
  const top3 = diagnoses.slice(0, 3);
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topUrgency = top3[0]?.urgency ?? "low";
  const u = urgencyLabel[topUrgency] ?? urgencyLabel.low;

  // Compute overall cost range from top 3
  const allDiyCosts = top3.map(d => d.diy_cost).filter(Boolean);
  const allShopCosts = top3.map(d => d.shop_cost).filter(Boolean);

  const inputDescription = codes
    ? `Diagnostic trouble code: ${codes}`
    : symptom
    ? `Reported symptom: "${symptom}"`
    : "Reported symptoms";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Wrenchli Vehicle Repair Assessment Report</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1a1a1a;
    line-height: 1.55;
    font-size: 11pt;
    background: white;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #E07B39;
    padding-bottom: 14px;
    margin-bottom: 22px;
  }
  .brand { font-size: 22pt; font-weight: 800; color: #E07B39; letter-spacing: -0.5px; }
  .brand-sub { font-size: 9pt; color: #666; margin-top: 2px; font-weight: 500; }
  .meta { text-align: right; font-size: 9pt; color: #666; }
  .report-title {
    font-size: 15pt;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 18px;
    text-align: center;
  }
  .vehicle-box {
    background: #FFF7ED;
    border: 1px solid #FED7AA;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 8px;
  }
  .vehicle-box h2 { font-size: 14pt; font-weight: 700; color: #C2410C; margin-bottom: 4px; }
  .vehicle-box .detail { font-size: 10pt; color: #444; margin-bottom: 2px; }
  .urgency-box {
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 18px;
    font-size: 10.5pt;
    page-break-inside: avoid;
  }
  .urgency-box strong { font-weight: 700; }
  .urgency-low { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .urgency-medium { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  .urgency-high { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1a1a1a;
    margin: 16px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e5e7eb;
  }
  .cause {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .cause-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .cause-name { font-weight: 700; font-size: 11pt; }
  .cause-prob {
    background: #E07B39;
    color: white;
    font-size: 9pt;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .cause-details {
    display: flex;
    gap: 20px;
    font-size: 9.5pt;
    color: #555;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .cause-desc { font-size: 10pt; color: #444; line-height: 1.5; }
  .questions ol { padding-left: 22px; }
  .questions li { margin-bottom: 6px; font-size: 10pt; color: #333; }
  .disclaimer {
    margin-top: 20px;
    padding: 12px 16px;
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    font-size: 9pt;
    color: #374151;
    line-height: 1.55;
    page-break-inside: avoid;
  }
  /* Repeating per-page footer (tfoot inside a full-page table repeats on each printed page in Chrome). */
  .page-table { width: 100%; border-collapse: collapse; }
  .page-table tfoot { display: table-footer-group; }
  .page-footer-cell {
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    font-size: 7.5pt;
    color: #6B7280;
    line-height: 1.45;
    text-align: center;
  }
  .page-footer-brand { font-size: 7.5pt; color: #9CA3AF; margin-top: 4px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <table class="page-table">
    <tbody><tr><td>

  <div class="header">
    <div>
      <div class="brand">Wrenchli</div>
      <div class="brand-sub">Mobility for All.</div>
    </div>
    <div class="meta">
      <div>${now}</div>
      <div>wrenchli.net</div>
    </div>
  </div>

  <div class="report-title">Vehicle Repair Assessment Report</div>

  <div class="vehicle-box">
    <h2>${vehicle || "Vehicle"}</h2>
    <p class="detail">${inputDescription}</p>
    <p class="detail">Assessment date: ${now}</p>
  </div>

  <div class="urgency-box ${u.cls}">
    <strong>Urgency Level:</strong> ${u.text}
  </div>

  <div class="section-title">Possible Causes (Top ${top3.length})</div>
  ${top3.map((d, i) => `
  <div class="cause">
    <div class="cause-header">
      <span class="cause-name">${i + 1}. ${d.title}${d.code ? ` (${d.code})` : ""}</span>
    </div>
    <div class="cause-details">
      <span><strong>DIY Cost:</strong> ${d.diy_cost}</span>
      <span><strong>Shop Cost:</strong> ${d.shop_cost}</span>
      <span><strong>DIY Level:</strong> ${d.diy_feasibility}</span>
    </div>
    <div class="cause-desc">${d.whats_happening}</div>
  </div>`).join("")}

  ${allDiyCosts.length > 0 || allShopCosts.length > 0 ? `
  <div style="margin: 12px 0; padding: 10px 16px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; font-size: 10pt; color: #333; page-break-inside: avoid;">
    <strong>Estimated Cost Range:</strong>
    ${allDiyCosts.length > 0 ? ` DIY: ${allDiyCosts.join(" / ")}` : ""}
    ${allShopCosts.length > 0 ? ` | Shop: ${allShopCosts.join(" / ")}` : ""}
  </div>` : ""}

  <div class="section-title">Questions to Ask Your Mechanic</div>
  <div class="questions">
    <ol>
      ${MECHANIC_QUESTIONS.map((q) => `<li>${q}</li>`).join("")}
    </ol>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician.
  </div>

    </td></tr></tbody>
    <tfoot><tr><td>
      <div class="page-footer-cell">
        Wrenchli is not a licensed mechanic. This is an informational symptom assessment only. For professional diagnosis and repair, please consult a qualified automotive technician.
        <div class="page-footer-brand">Generated by Wrenchli — wrenchli.net &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Wrenchli, Inc.</div>
      </div>
    </td></tr></tfoot>
  </table>
</body>
</html>`;
}


function buildFilename(props: DownloadReportProps): string {
  const { year, make, model } = props;
  const dateStr = new Date().toISOString().slice(0, 10);
  const parts = ["Wrenchli-Assessment"];
  if (year) parts.push(year);
  if (make) parts.push(make);
  if (model) parts.push(model);
  parts.push(dateStr);
  return parts.join("-").replace(/\s+/g, "-");
}

export default function DownloadReportButton(props: DownloadReportProps) {
  const handlePrint = () => {
    const html = buildPrintContent(props);
    const filename = buildFilename(props);
    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();

    // Set document title for PDF filename
    printWindow.document.title = filename;

    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
    };
    printWindow.onload = triggerPrint;
    setTimeout(triggerPrint, 400);
  };

  return (
    <Button
      variant="outline"
      onClick={handlePrint}
      className="gap-2 border-border text-foreground hover:bg-muted"
    >
      <FileDown className="h-4 w-4" aria-hidden="true" />
      Download My Report
    </Button>
  );
}
