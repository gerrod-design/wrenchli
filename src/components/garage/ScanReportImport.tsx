import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GARAGE_MEDIA_BUCKET } from "@/lib/garageRecord";
import {
  formatCodesCount,
  formatOdometerLine,
  matchNoneText,
  matchProposalText,
  scanReportCopy,
} from "@/lib/scanReport/copy";
import {
  buildScanReportStoragePath,
  fileScanReport,
  type ScanReportFilingClient,
} from "@/lib/scanReport/filing";
import {
  proposeScanReportMatch,
  type ScanReportMatchProposal,
} from "@/lib/scanReport/matcher";
import {
  groupScanReportCodes,
  vehicleDisplayName,
  type MatchableVehicle,
  type ScanReport,
} from "@/lib/scanReport/types";

type FlowState = "idle" | "uploading" | "parsing" | "review" | "done";

interface ScanReportImportProps {
  /** When the flow starts from a vehicle's page, that vehicle is offered
   *  first in the picker — it is still only filed after the owner taps
   *  the confirm button. */
  preselectedVehicleId?: string;
  onFiled?: () => void;
}

/**
 * Add-a-scan-report flow: pick the exported PDF → it is stored under the
 * owner's Garage media prefix → parse-scan-report reads it → the matcher
 * proposes a vehicle → the owner confirms (or picks another) → filing
 * writes the timeline entry. Nothing is filed before the confirm tap.
 */
export default function ScanReportImport({
  preselectedVehicleId,
  onFiled,
}: ScanReportImportProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FlowState>("idle");
  const [filing, setFiling] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [vehicles, setVehicles] = useState<MatchableVehicle[]>([]);
  const [proposal, setProposal] = useState<ScanReportMatchProposal | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    if (!user) return [] as MatchableVehicle[];
    const { data } = await supabase
      .from("user_vehicles")
      .select("id, year, make, model, vin, nickname")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as MatchableVehicle[];
    setVehicles(rows);
    return rows;
  }, [user]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const proposalVehicle = useMemo(
    () => vehicles.find((v) => v.id === proposal?.vehicleId) ?? null,
    [vehicles, proposal],
  );

  const handleFile = async (file: File | null) => {
    if (!file || !user) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      toast.error(scanReportCopy.parseErrorToast);
      return;
    }
    try {
      setState("uploading");
      const path = buildScanReportStoragePath(user.id, file.name, Date.now());
      const { error: uploadError } = await supabase.storage
        .from(GARAGE_MEDIA_BUCKET)
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;

      setState("parsing");
      const { data, error: parseError } = await supabase.functions.invoke(
        "parse-scan-report",
        { body: { storage_path: path, original_filename: file.name } },
      );
      if (parseError) throw parseError;
      const parsedReport = (data as { scan_report?: ScanReport } | null)?.scan_report;
      if (!parsedReport) throw new Error("parse-scan-report returned no report");

      setReport(parsedReport);
      const ownerVehicles = await loadVehicles();
      const nextProposal = proposeScanReportMatch(
        parsedReport.parsed_payload,
        ownerVehicles,
      );
      setProposal(nextProposal);
      setSelectedVehicleId(
        nextProposal.vehicleId ?? preselectedVehicleId ?? null,
      );
      setState("review");
    } catch (error) {
      console.error("[ScanReportImport] failed:", error);
      toast.error(
        state === "uploading"
          ? scanReportCopy.uploadErrorToast
          : scanReportCopy.parseErrorToast,
      );
      setState("idle");
    }
  };

  const handleConfirm = async () => {
    if (!report || !user) return;
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
    if (!vehicle) {
      toast.error(scanReportCopy.fileErrorToast);
      return;
    }
    setFiling(true);
    try {
      await fileScanReport(supabase as unknown as ScanReportFilingClient, {
        userId: user.id,
        report,
        confirmedVehicleId: vehicle.id,
        vehicle,
      });
      toast.success(scanReportCopy.filedToast);
      setState("done");
      onFiled?.();
    } catch (error) {
      console.error("[ScanReportImport] filing failed:", error);
      toast.error(scanReportCopy.fileErrorToast);
    } finally {
      setFiling(false);
    }
  };

  const reset = () => {
    setReport(null);
    setProposal(null);
    setSelectedVehicleId(null);
    setState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (state === "done") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">{scanReportCopy.filedToast}</p>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          {scanReportCopy.addButton}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{scanReportCopy.importTitle}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {scanReportCopy.importIntro}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {scanReportCopy.compatibilityLine}
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="scan-report-file">{scanReportCopy.chooseFile}</Label>
        <Input
          ref={fileInputRef}
          id="scan-report-file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={state === "uploading" || state === "parsing" || filing}
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </div>

      {(state === "uploading" || state === "parsing") && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          {state === "uploading"
            ? scanReportCopy.uploadingReport
            : scanReportCopy.readingReport}
        </p>
      )}

      {state === "review" && report && (
        <div className="space-y-4 rounded-xl border bg-background p-4">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> {scanReportCopy.parseHeading}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {report.source_tool}
              {report.report_id
                ? ` · ${scanReportCopy.reportIdLabel} ${report.report_id}`
                : ""}
              {report.scanned_at
                ? ` · ${scanReportCopy.scannedAtLabel} ${new Date(report.scanned_at).toLocaleDateString("en-US")}`
                : ""}
              {report.vehicle_label ? ` · ${report.vehicle_label}` : ""}
            </p>
            {formatOdometerLine(report) && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatOdometerLine(report)}
              </p>
            )}
          </div>

          {report.parse_status === "unparsed" && (
            <p className="text-sm rounded-lg bg-amber-50 border border-amber-200 p-3">
              {scanReportCopy.unparsedNote}
            </p>
          )}
          {report.parse_status === "partial" && (
            <p className="text-sm rounded-lg bg-amber-50 border border-amber-200 p-3">
              {scanReportCopy.partialNote}
            </p>
          )}

          {report.parsed_payload.codes.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold">
                {formatCodesCount(report.parsed_payload.codes.length)}
              </p>
              {groupScanReportCodes(report.parsed_payload.codes).map((group) => (
                <div key={group.system}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.system}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {group.codes.map((code) => (
                      <li key={`${group.system}-${code.code}`} className="text-sm">
                        <span className="font-mono font-medium">{code.code}</span>
                        {code.status ? (
                          <span className="text-muted-foreground"> ({code.status})</span>
                        ) : null}
                        {code.description ? (
                          <span className="text-muted-foreground"> — {code.description}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{scanReportCopy.codesStatement}</p>
            </div>
          ) : (
            report.parsed_payload.noCodesReported && (
              <p className="text-sm">{scanReportCopy.noCodesNote}</p>
            )
          )}

          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-semibold">{scanReportCopy.confirmHeading}</h4>
            {proposal && proposalVehicle && proposal.strength !== "none" ? (
              <p className="text-sm rounded-lg bg-accent/5 border border-accent/20 p-3">
                {matchProposalText(proposal.strength, proposalVehicle)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{matchNoneText}</p>
            )}
            <div className="space-y-1" role="radiogroup" aria-label={scanReportCopy.confirmHeading}>
              {vehicles.map((vehicle) => (
                <label
                  key={vehicle.id}
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="scan-report-vehicle"
                    checked={selectedVehicleId === vehicle.id}
                    onChange={() => setSelectedVehicleId(vehicle.id)}
                  />
                  <span>{vehicleDisplayName(vehicle)}</span>
                  {proposal?.vehicleId === vehicle.id && (
                    <span className="text-xs text-muted-foreground">
                      (
                      {proposal.strength === "exact"
                        ? scanReportCopy.proposalExactBadge
                        : scanReportCopy.proposalWeakBadge}
                      )
                    </span>
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{scanReportCopy.neverSilentNote}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!selectedVehicleId || filing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {filing
                  ? scanReportCopy.filingReport
                  : scanReportCopy.confirmFileButton}
              </Button>
              <Button type="button" variant="ghost" onClick={reset}>
                {scanReportCopy.cancelButton}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
