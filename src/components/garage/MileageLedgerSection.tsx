import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deriveLatestReading,
  evaluateReadingGate,
  formatReadingDate,
  formatReadingLabel,
  readingStatusLabel,
  toMiles,
  type MileageReading,
  type MileageSource,
} from "@/lib/mileage";
import type { GarageMediaRef } from "@/types/garageRecord";
import type { AddReadingInput } from "@/hooks/useVehicleRecord";

// Batch 5 (R-50, spec v1.1 SS1-SS3): the mileage ledger section of the
// vehicle record. Mileage here is a set of dated, sourced facts — the
// displayed value is derived (greatest reading_date, ties to Observed,
// disputed/superseded excluded), corrections supersede rather than edit,
// and disputes are stamped facts, never silent changes.

const SOURCE_OPTIONS: Array<{ value: MileageSource; label: string; layer: "reported" | "observed"; needsDetail: boolean }> = [
  { value: "owner_reported", label: "I read the dashboard", layer: "reported", needsDetail: false },
  { value: "dashboard_photo", label: "Dashboard photo", layer: "reported", needsDetail: false },
  { value: "shop_document", label: "Shop document (invoice / inspection)", layer: "observed", needsDetail: true },
  { value: "purchase_document", label: "Purchase document", layer: "reported", needsDetail: true },
];

function todayLocal(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export interface OdometerPhotoResult {
  value: number;
  unit: "mi" | "km";
  evidence: GarageMediaRef;
}

interface MileageLedgerSectionProps {
  readings: MileageReading[];
  discrepancy: { observed: MileageReading; reported: MileageReading } | null;
  onAddReading: (input: AddReadingInput) => Promise<MileageReading>;
  onDispute: (reading: MileageReading, reason: string) => Promise<void>;
  onDismissDispute: (reading: MileageReading, reason: string) => Promise<void>;
  onDismissDiscrepancy: (reason: string) => Promise<void>;
  onReadOdometerPhoto: (file: File) => Promise<OdometerPhotoResult | null>;
}

export default function MileageLedgerSection({
  readings,
  discrepancy,
  onAddReading,
  onDispute,
  onDismissDispute,
  onDismissDiscrepancy,
  onReadOdometerPhoto,
}: MileageLedgerSectionProps) {
  const latest = useMemo(() => deriveLatestReading(readings), [readings]);
  const sorted = useMemo(
    () =>
      [...readings].sort((a, b) =>
        a.reading_date === b.reading_date
          ? b.created_at.localeCompare(a.created_at)
          : b.reading_date.localeCompare(a.reading_date),
      ),
    [readings],
  );
  const byId = useMemo(() => new Map(readings.map((r) => [r.id, r])), [readings]);

  const [formOpen, setFormOpen] = useState(false);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<"mi" | "km">("mi");
  const [date, setDate] = useState(todayLocal());
  const [source, setSource] = useState<MileageSource>("owner_reported");
  const [detail, setDetail] = useState("");
  const [evidence, setEvidence] = useState<GarageMediaRef | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gate, setGate] = useState<
    | { kind: "decrease"; conflict?: MileageReading }
    | { kind: "outlier" }
    | null
  >(null);
  const [correctsId, setCorrectsId] = useState<string>("");
  const [outlierOk, setOutlierOk] = useState(false);
  const [reasonFor, setReasonFor] = useState<{ id: string; mode: "dispute" | "dismiss-dispute" | "discrepancy" } | null>(null);
  const [reason, setReason] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const sourceMeta = SOURCE_OPTIONS.find((o) => o.value === source) ?? SOURCE_OPTIONS[0];

  const resetForm = () => {
    setValue("");
    setUnit("mi");
    setDate(todayLocal());
    setSource("owner_reported");
    setDetail("");
    setEvidence(null);
    setGate(null);
    setCorrectsId("");
    setOutlierOk(false);
  };

  const handlePhoto = async (file: File) => {
    setPhotoBusy(true);
    try {
      const result = await onReadOdometerPhoto(file);
      if (!result) {
        toast.warning("We couldn't read that photo. Enter the reading manually — nothing was saved.");
        return;
      }
      // Spec SS2: the app-read value is a PREFILL only. It is stored only
      // when the owner confirms it through the normal save below.
      setValue(String(result.value));
      setUnit(result.unit);
      setSource("dashboard_photo");
      setEvidence(result.evidence);
      setGate(null);
      toast.info("We read the odometer from your photo. Check the number, then save to record it.");
    } catch {
      toast.error("The photo could not be processed. Enter the reading manually.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async () => {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter the odometer reading as shown on the dashboard.");
      return;
    }
    if (!date) {
      toast.error("Pick the date this reading was taken.");
      return;
    }
    if (sourceMeta.needsDetail && !detail.trim()) {
      toast.error("Name the document (shop and date, or the purchase paperwork) — a document reading needs its source.");
      return;
    }
    const candidate = { odometer_miles: toMiles(parsed, unit), reading_date: date };
    if (!gate) {
      const verdict = evaluateReadingGate(readings, candidate);
      if (verdict.kind === "decrease") {
        setGate({ kind: "decrease", conflict: verdict.predecessor ?? verdict.successor });
        setCorrectsId((verdict.predecessor ?? verdict.successor)?.id ?? "");
        return;
      }
      if (verdict.kind === "outlier") {
        setGate({ kind: "outlier" });
        return;
      }
    }
    if (gate?.kind === "decrease" && !correctsId) {
      toast.error("Choose the reading this one corrects, or change the value.");
      return;
    }
    if (gate?.kind === "outlier" && !outlierOk) {
      toast.error("Confirm the jump is real, or change the value.");
      return;
    }
    setSaving(true);
    try {
      await onAddReading({
        odometer_value: parsed,
        unit,
        reading_date: date,
        source,
        source_detail: detail.trim() || null,
        layer: sourceMeta.layer,
        outlier_confirmed: gate?.kind === "outlier" ? outlierOk : false,
        evidence_media: evidence ? [evidence] : [],
        supersedesId: gate?.kind === "decrease" ? correctsId : undefined,
      });
      toast.success("Mileage reading recorded.");
      resetForm();
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that reading.");
    } finally {
      setSaving(false);
    }
  };

  const submitReason = async () => {
    if (!reasonFor || !reason.trim()) {
      toast.error("A short reason is required — it becomes part of the record.");
      return;
    }
    try {
      if (reasonFor.mode === "discrepancy") {
        await onDismissDiscrepancy(reason);
        toast.success("Discrepancy note dismissed with your reason on record.");
      } else {
        const reading = byId.get(reasonFor.id);
        if (!reading) return;
        if (reasonFor.mode === "dispute") {
          await onDispute(reading, reason);
          toast.success("Reading flagged as disputed. It no longer counts toward the displayed mileage.");
        } else {
          await onDismissDispute(reading, reason);
          toast.success("Dispute dismissed. The reading counts again.");
        }
      }
      setReasonFor(null);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that.");
    }
  };

  const reasonForm = (id: string, mode: "dispute" | "dismiss-dispute" | "discrepancy") =>
    reasonFor?.id === id && reasonFor.mode === mode ? (
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (saved to the record)"
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void submitReason()}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { setReasonFor(null); setReason(""); }}>Cancel</Button>
        </div>
      </div>
    ) : null;

  return (
    <Card>
      <CardHeader className="bg-emerald-50/70">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-emerald-700" />
          <CardTitle>Mileage</CardTitle>
        </div>
        <CardDescription>
          Every reading is a dated fact with a source. The current mileage is derived from the
          latest reading — it is never typed in as a bare number, and a wrong reading is
          corrected by a new one, never rewritten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-xl border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current mileage</p>
          {latest ? (
            <>
              <p className="mt-1 text-lg font-semibold">{formatReadingLabel(latest, "mi")}</p>
              {latest.unsupported && (
                <p className="mt-1 text-sm text-amber-700">
                  This reading has no source document behind it. It stays labeled unsupported
                  until a sourced reading replaces it.
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold">No reading on record yet</p>
          )}
        </div>

        {discrepancy && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div className="flex-1">
                <p className="text-sm font-semibold">The two layers disagree</p>
                <p className="mt-1 text-sm text-amber-900">
                  Reported: {formatReadingLabel(discrepancy.reported, "mi")} · Observed:{" "}
                  {formatReadingLabel(discrepancy.observed, "mi")}. One of these readings steps
                  backwards. Both stay on the record; the note clears when a newer reading
                  follows the consistent line, or when you dismiss it with a reason.
                </p>
                {reasonFor?.mode !== "discrepancy" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => { setReasonFor({ id: "discrepancy", mode: "discrepancy" }); setReason(""); }}
                  >
                    Dismiss with a reason
                  </Button>
                )}
                {reasonForm("discrepancy", "discrepancy")}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Reading history</h3>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing recorded yet. Add the first reading below — from the dashboard, a photo,
              a shop document, or the purchase paperwork.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {sorted.map((r) => {
                const statusLabel = readingStatusLabel(r);
                const replacedBy = r.superseded_by ? byId.get(r.superseded_by) : undefined;
                return (
                  <li key={r.id} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {r.odometer_value.toLocaleString("en-US")} {r.unit}
                      </span>
                      {r.unit === "km" && (
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(r.odometer_miles).toLocaleString("en-US")} mi)
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">{formatReadingDate(r.reading_date)}</span>
                      <Badge variant={r.layer === "observed" ? "secondary" : "outline"} className="capitalize">
                        {r.layer}
                      </Badge>
                      {statusLabel && <Badge variant="secondary">{statusLabel}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.source_detail || "No source detail recorded"}
                    </p>
                    {r.status === "superseded" && replacedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Replaced by {replacedBy.odometer_value.toLocaleString("en-US")} {replacedBy.unit} on{" "}
                        {formatReadingDate(replacedBy.reading_date)}.
                      </p>
                    )}
                    {r.status !== "superseded" && (
                      <div className="mt-1">
                        {r.status === "current" && reasonFor?.id !== r.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => { setReasonFor({ id: r.id, mode: "dispute" }); setReason(""); }}
                          >
                            Flag as disputed
                          </Button>
                        )}
                        {r.status === "disputed" && reasonFor?.id !== r.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => { setReasonFor({ id: r.id, mode: "dismiss-dispute" }); setReason(""); }}
                          >
                            Dismiss dispute
                          </Button>
                        )}
                        {reasonForm(r.id, "dispute")}
                        {reasonForm(r.id, "dismiss-dispute")}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!formOpen ? (
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            Record a mileage reading
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-dashed p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Odometer reading</Label>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setGate(null); }}
                    placeholder="e.g. 134,500"
                  />
                  <select
                    aria-label="Unit"
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                    value={unit}
                    onChange={(e) => { setUnit(e.target.value as "mi" | "km"); setGate(null); }}
                  >
                    <option value="mi">miles</option>
                    <option value="km">km</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date of this reading</Label>
                <Input type="date" value={date} max={todayLocal()} onChange={(e) => { setDate(e.target.value); setGate(null); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Where it comes from</Label>
                <select
                  aria-label="Reading source"
                  className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={source}
                  onChange={(e) => setSource(e.target.value as MileageSource)}
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source detail{sourceMeta.needsDetail ? " (required)" : ""}</Label>
                <Input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={source === "shop_document" ? "Shop name, repair order, date" : "Optional note"}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePhoto(f);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={photoBusy} onClick={() => photoInputRef.current?.click()}>
                {photoBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Read from a dashboard photo
              </Button>
              <span className="text-xs text-muted-foreground">
                A photo only fills in the number — nothing is saved until you confirm it. Skipping the photo never blocks you.
              </span>
              {evidence && <Badge variant="secondary">Photo attached as evidence</Badge>}
            </div>

            {gate?.kind === "decrease" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">This reading steps backwards</p>
                <p className="mt-1 text-amber-900">
                  {gate.conflict
                    ? `It is lower than ${gate.conflict.odometer_value.toLocaleString("en-US")} ${gate.conflict.unit} recorded on ${formatReadingDate(gate.conflict.reading_date)} (or would strand a later reading). Readings are never rewritten — if an earlier reading was wrong, record this one as its correction and the old one is marked replaced.`
                    : "It conflicts with the readings around it. Record it as a correction of the reading it replaces."}
                </p>
                <div className="mt-2 space-y-1">
                  <Label className="text-xs">This reading corrects</Label>
                  <select
                    aria-label="Reading this corrects"
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={correctsId}
                    onChange={(e) => setCorrectsId(e.target.value)}
                  >
                    <option value="">Choose the reading it replaces…</option>
                    {sorted
                      .filter((r) => r.status === "current")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.odometer_value.toLocaleString("en-US")} {r.unit} — {formatReadingDate(r.reading_date)} ({r.source_detail || r.layer})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {gate?.kind === "outlier" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">That is a very large jump</p>
                <p className="mt-1 text-amber-900">
                  It implies more than 1,000 miles a day, or over 25,000 miles in 90 days, against
                  the readings around it. If the number is right, confirm it and it will be saved
                  labeled as an owner-confirmed outlier.
                </p>
                <label className="mt-2 flex items-center gap-2 text-amber-900">
                  <input type="checkbox" checked={outlierOk} onChange={(e) => setOutlierOk(e.target.checked)} />
                  This jump is real — save it as an owner-confirmed outlier
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => void submit()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save reading
              </Button>
              <Button variant="ghost" onClick={() => { resetForm(); setFormOpen(false); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
