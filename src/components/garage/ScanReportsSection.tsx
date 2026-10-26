import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildAidenPrefillMessage,
  formatCodesCount,
  formatOdometerLine,
  scanReportCopy,
  timelineTitle,
} from "@/lib/scanReport/copy";
import { openChatWithPrefill } from "@/lib/scanReport/prefill";
import {
  groupScanReportCodes,
  type MatchableVehicle,
  type ScanReport,
} from "@/lib/scanReport/types";
import ScanReportImport from "./ScanReportImport";

interface ScanReportsSectionProps {
  vehicleId: string;
}

/**
 * Scan reports filed on this vehicle: the import flow plus the filed
 * entries. Each entry shows the codes the tool reported, grouped by
 * system, in the report's own descriptions — a record of the report,
 * with the original PDF one tap away and an Aiden walk-through offered.
 */
export default function ScanReportsSection({ vehicleId }: ScanReportsSectionProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [vehicle, setVehicle] = useState<MatchableVehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !vehicleId) {
      setLoading(false);
      return;
    }
    const [{ data: reportRows }, { data: vehicleRow }] = await Promise.all([
      supabase
        .from("scan_reports" as any)
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_vehicles")
        .select("id, year, make, model, vin, nickname")
        .eq("id", vehicleId)
        .maybeSingle(),
    ]);
    setReports(((reportRows ?? []) as unknown) as ScanReport[]);
    setVehicle((vehicleRow as MatchableVehicle | null) ?? null);
    setLoading(false);
  }, [user, vehicleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openOriginal = async (report: ScanReport) => {
    const { data } = await supabase.storage
      .from(report.storage_bucket)
      .createSignedUrl(report.storage_path, 60 * 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const goThroughWithAiden = (report: ScanReport) => {
    if (!vehicle) return;
    openChatWithPrefill(
      buildAidenPrefillMessage(report, vehicle),
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> {scanReportCopy.sectionTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ScanReportImport preselectedVehicleId={vehicleId} onFiled={() => void refresh()} />

        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted" aria-busy="true" />
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">{scanReportCopy.sectionEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((report) => (
              <li key={report.id} className="rounded-xl border bg-background p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{timelineTitle(report)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.scanned_at
                      ? `${scanReportCopy.scannedAtLabel} ${new Date(report.scanned_at).toLocaleDateString("en-US")}`
                      : `${scanReportCopy.filedOnPrefix} ${new Date(report.created_at).toLocaleDateString("en-US")}`}
                    {formatOdometerLine(report) ? ` · ${formatOdometerLine(report)}` : ""}
                  </p>
                </div>

                {report.parse_status === "unparsed" && (
                  <p className="text-sm">{scanReportCopy.unparsedNote}</p>
                )}
                {report.parse_status === "partial" && (
                  <p className="text-sm text-muted-foreground">{scanReportCopy.partialNote}</p>
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

                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => goThroughWithAiden(report)}>
                    {scanReportCopy.aidenButton}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void openOriginal(report)}
                  >
                    {scanReportCopy.openOriginal}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
