import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, Download, Gauge, RefreshCw } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DocumentAttachForm,
  TimelineEntryForm,
  VehicleRecordSections,
} from "@/components/garage/VehicleRecordSections";
import MileageLedgerSection, { type OdometerPhotoResult } from "@/components/garage/MileageLedgerSection";
import JourneyPlanSection from "@/components/garage/JourneyPlanSection";
import { VehicleRecordProvider, useVehicleRecordContext } from "@/contexts/VehicleRecordContext";
import VehicleAssessmentsSection from "@/components/garage/VehicleAssessmentsSection";
import ScanReportsSection from "@/components/garage/ScanReportsSection";
import type { HandoffSnapshot } from "@/lib/handoff";
import { supabase } from "@/integrations/supabase/client";
import { formatReadingLabel } from "@/lib/mileage";
import type { GarageVehicle, VehicleDocument, VehicleTimelineEvent } from "@/types/garageRecord";
import { toast } from "sonner";

// Batch 5, spec SS7: the proactive mileage ask. In-context only, and only
// when a stale or missing reading actually changes an answer (no reading
// at all, or the newest is over a year old). Caps: at most one ask per
// vehicle per 90 days, one per session, and after two dismissals the ask
// goes quiet for 180 days. State lives in localStorage — dismissals are
// owner-local facts about nagging, not record facts.
const MILEAGE_ASK_KEY = (vehicleId: string) => `wrenchli.mileageAsk.${vehicleId}`;
const MILEAGE_ASK_SESSION_KEY = "wrenchli.mileageAsk.sessionShown";

interface MileageAskState {
  lastShownAt?: string;
  dismissals: string[];
  suppressedUntil?: string;
}

function readMileageAskState(vehicleId: string): MileageAskState {
  try {
    const raw = localStorage.getItem(MILEAGE_ASK_KEY(vehicleId));
    if (raw) return JSON.parse(raw) as MileageAskState;
  } catch {
    /* storage unavailable — treat as never asked */
  }
  return { dismissals: [] };
}

function writeMileageAskState(vehicleId: string, state: MileageAskState) {
  try {
    localStorage.setItem(MILEAGE_ASK_KEY(vehicleId), JSON.stringify(state));
  } catch {
    /* storage unavailable — the ask simply may reappear */
  }
}

function DrivingProfileCard({ vehicle, onSave }: {
  vehicle: GarageVehicle;
  onSave: (fields: {
    annual_mileage_estimate?: number | null;
    driving_style?: string | null;
    usage_type?: string | null;
  }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [annual, setAnnual] = useState(vehicle.annual_mileage_estimate?.toString() ?? "");
  const [style, setStyle] = useState(vehicle.driving_style ?? "");
  const [usage, setUsage] = useState(vehicle.usage_type ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnnual(vehicle.annual_mileage_estimate?.toString() ?? "");
    setStyle(vehicle.driving_style ?? "");
    setUsage(vehicle.usage_type ?? "");
  }, [vehicle.annual_mileage_estimate, vehicle.driving_style, vehicle.usage_type]);

  const stamp = (field: string) => vehicle.profile_provenance?.[field]?.recorded_at;
  const row = (label: string, value: string | null | undefined, field: string) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? (
        <span className="text-sm font-medium">
          {value}
          {stamp(field) && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              you provided this on {new Date(stamp(field) as string).toLocaleDateString("en-US")}
            </span>
          )}
        </span>
      ) : (
        <span className="text-sm font-medium text-muted-foreground">Not set</span>
      )}
    </div>
  );

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        annual_mileage_estimate: annual.trim() ? Number(annual) : null,
        driving_style: style || null,
        usage_type: usage || null,
      });
      toast.success("Driving profile saved.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the driving profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Driving profile</CardTitle>
        <CardDescription>
          These fields are used only when you provide them. Nothing here is pre-filled from a
          template — an unset field stays unset, and estimates that use your numbers say so.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div>
            <div className="divide-y">
              {row("Miles driven per year", vehicle.annual_mileage_estimate ? vehicle.annual_mileage_estimate.toLocaleString("en-US") : null, "annual_mileage_estimate")}
              {row("Driving style", vehicle.driving_style, "driving_style")}
              {row("Main use", vehicle.usage_type, "usage_type")}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
              {vehicle.annual_mileage_estimate || vehicle.driving_style || vehicle.usage_type ? "Update" : "Add yours"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Miles driven per year</Label>
              <Input inputMode="numeric" value={annual} onChange={(e) => setAnnual(e.target.value)} placeholder="e.g. 12000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Driving style</Label>
              <select aria-label="Driving style" className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="">Not set</option>
                <option value="Gentle">Gentle</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Main use</Label>
              <select aria-label="Main use" className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={usage} onChange={(e) => setUsage(e.target.value)}>
                <option value="">Not set</option>
                <option value="Personal">Personal</option>
                <option value="Commute">Commute</option>
                <option value="Family">Family</option>
                <option value="Business">Business</option>
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button size="sm" onClick={() => void save()} disabled={saving}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleRecordView({ vehicleId }: { vehicleId?: string }) {
  const { record, recalls } = useVehicleRecordContext();
  const [showMileageAsk, setShowMileageAsk] = useState(false);

  // R-70 Tier 2: assessments linked to this vehicle (user_vehicle_id).
  const [linkedAssessments, setLinkedAssessments] = useState<
    Array<{ id: string; snapshot: HandoffSnapshot }>
  >([]);
  
  useEffect(() => {
    let cancelled = false;
  
    if (!vehicleId) {
      setLinkedAssessments([]);
      return () => {
        cancelled = true;
      };
    }
  
    supabase
      .from("assessment_handoffs")
      .select("id, snapshot, created_at")
      .eq("user_vehicle_id", vehicleId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
  
        if (error || !data) {
          setLinkedAssessments([]);
          return;
        }
  
        setLinkedAssessments(
          data.map((row) => ({
            id: row.id,
            snapshot: row.snapshot as unknown as HandoffSnapshot,
          }))
        );
      });
  
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  useEffect(() => {
    // Gate on the vehicle row itself: during the pre-auth pass the record is
    // empty (readings not yet loaded), and deciding "stale" then would show
    // the ask for vehicles whose newest reading is fresh — and burn the caps.
    if (!vehicleId || record.sectionsLoading || !record.vehicle) return;
    const latest = record.latestReading;
    const stale =
      !latest ||
      Date.now() - new Date(`${latest.reading_date}T12:00:00Z`).getTime() > 365 * 24 * 60 * 60 * 1000;
    if (!stale) return;
    try {
      if (sessionStorage.getItem(MILEAGE_ASK_SESSION_KEY)) return;
    } catch {
      /* session storage unavailable — fall through to the per-vehicle caps */
    }
    const state = readMileageAskState(vehicleId);
    const now = Date.now();
    if (state.suppressedUntil && new Date(state.suppressedUntil).getTime() > now) return;
    if (state.lastShownAt && now - new Date(state.lastShownAt).getTime() < 90 * 24 * 60 * 60 * 1000) return;
    writeMileageAskState(vehicleId, { ...state, lastShownAt: new Date().toISOString() });
    try {
      sessionStorage.setItem(MILEAGE_ASK_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowMileageAsk(true);
    // latestReading identity changes on refresh; the caps above gate repeats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, record.sectionsLoading, record.vehicle]);

  const dismissMileageAsk = () => {
    if (!vehicleId) return;
    const state = readMileageAskState(vehicleId);
    const dismissals = [...state.dismissals, new Date().toISOString()];
    const next: MileageAskState = { ...state, dismissals };
    if (dismissals.length >= 2) {
      next.suppressedUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    }
    writeMileageAskState(vehicleId, next);
    setShowMileageAsk(false);
  };

  const readOdometerPhoto = async (file: File): Promise<OdometerPhotoResult | null> => {
    const media = await record.uploadMedia(file);
    const url = await record.getSignedMediaUrl(media);
    const { data, error } = await supabase.functions.invoke("read-odometer-photo", {
      body: { image_url: url },
    });
    if (error) throw error;
    const parsed = data as { value?: number; unit?: string; confident?: boolean } | null;
    if (!parsed || typeof parsed.value !== "number" || !parsed.confident) return null;
    return {
      value: parsed.value,
      unit: parsed.unit === "km" ? "km" : "mi",
      evidence: media,
    };
  };

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
                {" · "}
                {record.latestReading
                  ? formatReadingLabel(record.latestReading, "mi")
                  : "No reading on record yet"}
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

        {showMileageAsk && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <Gauge className="h-5 w-5 shrink-0 text-sky-700" />
            <p className="flex-1 text-sm text-sky-900">
              {record.latestReading
                ? "The newest mileage reading for this vehicle is over a year old, so maintenance timing can only be estimated. A current reading makes it exact."
                : "There is no mileage reading on record for this vehicle yet, so maintenance timing cannot be calculated. Adding one takes a few seconds."}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setShowMileageAsk(false);
                  document.getElementById("mileage-ledger")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Record a reading
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissMileageAsk}>
                Not now
              </Button>
            </div>
          </div>
        )}

        <div id="mileage-ledger">
          <MileageLedgerSection
            readings={record.readings}
            discrepancy={record.mileageDiscrepancy}
            onAddReading={record.addReading}
            onDispute={record.disputeReading}
            onDismissDispute={record.dismissDispute}
            onDismissDiscrepancy={record.dismissDiscrepancy}
            onReadOdometerPhoto={readOdometerPhoto}
          />
        </div>

        <DrivingProfileCard vehicle={vehicle} onSave={record.saveProfileFields} />

        <VehicleAssessmentsSection handoffs={linkedAssessments} />

        {vehicleId && <ScanReportsSection vehicleId={vehicleId} />}

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

export default function VehicleRecord() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  return (
    <VehicleRecordProvider vehicleId={vehicleId}>
      <VehicleRecordView vehicleId={vehicleId} />
    </VehicleRecordProvider>
  );
}
