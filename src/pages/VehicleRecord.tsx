import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, Download, RefreshCw } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DocumentAttachForm,
  TimelineEntryForm,
  VehicleRecordSections,
} from "@/components/garage/VehicleRecordSections";
import { useVehicleRecord } from "@/hooks/useVehicleRecord";
import JourneyPlanSection from "@/components/garage/JourneyPlanSection";
import { useVehicleRecalls } from "@/hooks/useVehicleRecalls";
import type { VehicleDocument, VehicleTimelineEvent } from "@/types/garageRecord";

export default function VehicleRecord() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const record = useVehicleRecord(vehicleId);
  const vehicleIds = useMemo(() => (vehicleId ? [vehicleId] : []), [vehicleId]);
  const { recalls } = useVehicleRecalls(vehicleIds);

  const openDocument = async (document: VehicleDocument) => {
    const url = await record.getSignedMediaUrl({
      bucket: document.storage_bucket,
      path: document.storage_path,
      name: document.original_filename,
      kind: "document",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openTimelineMedia = async (event: VehicleTimelineEvent) => {
    const first = event.media?.[0];
    if (!first) return;
    const url = await record.getSignedMediaUrl(first);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (record.vehicleLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8" aria-busy="true">
        <div className="space-y-5">
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
          <div className="rounded-2xl bg-[#0F1117] p-5 sm:p-7">
            <div className="h-3 w-40 animate-pulse rounded bg-white/20" />
            <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded bg-white/20" />
            <div className="mt-3 h-4 w-56 max-w-full animate-pulse rounded bg-white/10" />
          </div>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border p-5 space-y-3">
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!record.vehicle) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link to="/garage"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Garage</Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Vehicle record not available</AlertTitle>
          <AlertDescription>
            {record.error ?? "Sign in and choose a vehicle from your Garage."}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const vehicle = record.vehicle;
  const hasCompletedBaseline = record.baselines.some((baseline) => baseline.status === "completed");
  const hasOpenBaseline = record.baselines.some((baseline) => baseline.status === "in_progress");

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:py-8">
      <SEO
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model} Record | Wrenchli Garage`}
        description="A two-layer Garage record with reported history and observed condition kept separate."
        path={`/garage/vehicles/${vehicle.id}`}
      />

      <div className="space-y-5">
        <Button asChild variant="ghost" className="px-0">
          <Link to="/garage"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Garage</Link>
        </Button>

        <header className="rounded-2xl bg-[#0F1117] text-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Garage vehicle record</p>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-2">
                {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </h1>
              <p className="text-sm text-white/60 mt-2">
                {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ""}
                {vehicle.current_mileage ? ` · ${vehicle.current_mileage.toLocaleString()} mi` : ""}
              </p>
              {vehicle.vin && <p className="text-xs text-white/50 mt-1 font-mono">VIN {vehicle.vin}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-accent text-white hover:bg-accent/90">
                <Link to={`/garage/vehicles/${vehicle.id}/baseline`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {hasOpenBaseline ? "Continue Baseline" : hasCompletedBaseline ? "Run Baseline Again" : "Start Baseline"}
                </Link>
              </Button>
              <Button variant="secondary" onClick={record.exportPdf}>
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => void record.refresh()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
          {!hasCompletedBaseline && (
            <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/80">
              No baseline yet. Capture one today so this vehicle has a dated observed-condition record.
            </p>
          )}
        </header>

        {record.error && (
          <Alert variant="destructive">
            <AlertTitle>Some record data could not be loaded</AlertTitle>
            <AlertDescription>{record.error}</AlertDescription>
          </Alert>
        )}

        <VehicleRecordSections
          loading={record.sectionsLoading}
          timeline={record.timeline}
          coreChecks={record.coreDisplayChecks}
          currentChecks={record.currentConditionChecks}
          weakPoints={record.weakPoints}
          recalls={recalls}
          documents={record.documents}
          baselines={record.baselines}
          sharePermissionCount={record.sharePermissions.length}
          reportedTools={<TimelineEntryForm layer="reported" onSubmit={record.addTimelineEvent} />}
          observedTools={<TimelineEntryForm layer="observed" onSubmit={record.addTimelineEvent} />}
          documentTools={<DocumentAttachForm onAttach={record.attachDocument} />}
          onOpenDocument={openDocument}
          onOpenTimelineMedia={openTimelineMedia}
        />

        {vehicleId && record.vehicle && (
          <JourneyPlanSection
            vehicleId={vehicleId}
            userId={record.vehicle.user_id}
          />
        )}
      </div>
    </main>
  );
}
