import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Diagnosis } from "./types";

const urgencyLabel: Record<string, string> = {
  low: "Monitor — No immediate action needed",
  medium: "Schedule Soon — Within the next few weeks",
  high: "Urgent — Address as soon as possible",
};

const MECHANIC_QUESTIONS = [
  "Can you confirm which of these possible causes applies to my vehicle?",
  "Are there any related issues I should inspect at the same time?",
  "What is the expected timeline for this repair?",
  "Is it safe to continue driving while waiting for the repair?",
  "Can you provide a written estimate before starting work?",
];

function buildPrintContent(vehicle: string, diagnoses: Diagnosis[]) {
  const top3 = diagnoses.slice(0, 3);
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Wrenchli Assessment Report</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    font-size: 11pt;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .brand { font-size: 20pt; font-weight: 800; color: #0d9488; letter-spacing: -0.5px; }
  .brand-sub { font-size: 8pt; color: #666; margin-top: 2px; }
  .meta { text-align: right; font-size: 9pt; color: #666; }
  .vehicle-box {
    background: #f0fdfa;
    border: 1px solid #ccfbf1;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
  }
  .vehicle-box h2 { font-size: 13pt; font-weight: 700; color: #0d9488; margin-bottom: 2px; }
  .vehicle-box p { font-size: 10pt; color: #444; }
  .section-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1a1a1a;
    margin: 18px 0 10px;
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
    background: #0d9488;
    color: white;
    font-size: 9pt;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
  }
  .cause-details { display: flex; gap: 24px; font-size: 9.5pt; color: #555; margin-bottom: 4px; }
  .cause-desc { font-size: 10pt; color: #444; }
  .urgency-box {
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-weight: 600;
    font-size: 10.5pt;
  }
  .urgency-low { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .urgency-medium { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  .urgency-high { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
  .questions ol { padding-left: 20px; }
  .questions li { margin-bottom: 6px; font-size: 10pt; color: #333; }
  .footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt;
    color: #999;
    text-align: center;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Wrenchli</div>
      <div class="brand-sub">AI Vehicle Assessment Report</div>
    </div>
    <div class="meta">
      <div>${now}</div>
      <div>wrenchli.com</div>
    </div>
  </div>

  <div class="vehicle-box">
    <h2>${vehicle || "Vehicle"}</h2>
    <p>Assessment based on ${diagnoses.length > 0 && diagnoses[0].code ? `diagnostic code: ${diagnoses[0].code}` : "reported symptoms"}</p>
  </div>

  ${top3.length > 0 ? `
  <div class="urgency-box urgency-${top3[0].urgency}">
    Urgency: ${urgencyLabel[top3[0].urgency] || top3[0].urgency}
  </div>` : ""}

  <div class="section-title">Possible Causes (Top ${top3.length})</div>
  ${top3.map((d, i) => `
  <div class="cause">
    <div class="cause-header">
      <span class="cause-name">${i + 1}. ${d.title}</span>
      ${d.code ? `<span class="cause-prob">${d.code}</span>` : ""}
    </div>
    <div class="cause-details">
      <span>DIY Cost: ${d.diy_cost}</span>
      <span>Shop Cost: ${d.shop_cost}</span>
      <span>DIY Difficulty: ${d.diy_feasibility}</span>
    </div>
    <div class="cause-desc">${d.whats_happening}</div>
  </div>`).join("")}

  <div class="section-title">Questions to Ask Your Mechanic</div>
  <div class="questions">
    <ol>
      ${MECHANIC_QUESTIONS.map((q) => `<li>${q}</li>`).join("")}
    </ol>
  </div>

  <div class="footer">
    This report is for informational purposes only and does not replace a professional inspection.
    Generated by Wrenchli — wrenchli.com
  </div>
</body>
</html>`;
}

export default function DownloadReportButton({
  vehicle,
  diagnoses,
}: {
  vehicle: string;
  diagnoses: Diagnosis[];
}) {
  const handlePrint = () => {
    const html = buildPrintContent(vehicle, diagnoses);
    const printWindow = window.open("", "_blank", "width=800,height=1000");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to render before triggering print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    // Fallback for browsers that don't fire onload for document.write
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  return (
    <Button
      variant="outline"
      onClick={handlePrint}
      className="gap-2 border-border text-foreground hover:bg-muted"
    >
      <FileDown className="h-4 w-4" aria-hidden="true" />
      Download Report
    </Button>
  );
}
