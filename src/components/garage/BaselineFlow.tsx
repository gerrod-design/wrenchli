import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Play,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WeakPointCheckCard } from "@/components/garage/VehicleRecordSections";
import {
  CORE_BASELINE_CHECKS,
  MEDIA_RETENTION_NOTE,
  baselineCompletionState,
  formatRecordDate,
  weakPointCheckKey,
  type BaselineCheckDefinition,
} from "@/lib/garageRecord";
import type { useVehicleRecord } from "@/hooks/useVehicleRecord";
import type {
  BaselineResponseValue,
  VehicleBaseline,
  VehicleBaselineResponse,
  WeakPointCheck,
} from "@/types/garageRecord";

type RecordApi = ReturnType<typeof useVehicleRecord>;

interface BaselineItem {
  key: string;
  label: string;
  instruction: string;
  sense: BaselineCheckDefinition["sense"];
  mediaLabel?: string;
  accept?: string;
  mediaRequired?: boolean;
  weakPoint?: WeakPointCheck;
}

function responseLabel(response?: VehicleBaselineResponse) {
  if (!response) return "Not answered";
  if (response.response === "ok") return "Recorded as OK";
  if (response.response === "issue") return "Issue recorded";
  return "Skipped with reason";
}

function BaselineCheckCard({
  item,
  baseline,
  savedResponse,
  sourceName,
  vehicle,
  onSave,
}: {
  item: BaselineItem;
  baseline: VehicleBaseline;
  savedResponse?: VehicleBaselineResponse;
  sourceName: string;
  vehicle: NonNullable<RecordApi["vehicle"]>;
  onSave: RecordApi["saveBaselineResponse"];
}) {
  const [response, setResponse] = useState<BaselineResponseValue | "">(savedResponse?.response ?? "");
  const [skipReason, setSkipReason] = useState(savedResponse?.skip_reason ?? "");
  const [note, setNote] = useState(savedResponse?.note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setResponse(savedResponse?.response ?? "");
    setSkipReason(savedResponse?.skip_reason ?? "");
    setNote(savedResponse?.note ?? "");
  }, [savedResponse?.id, savedResponse?.response, savedResponse?.skip_reason, savedResponse?.note]);

  const save = async () => {
    setMessage("");
    if (!response) {
      setMessage("Choose OK, issue, or skipped before saving.");
      return;
    }
    if (!sourceName.trim()) {
      setMessage("Enter your name in the source field at the top before saving.");
      return;
    }
    if (response === "skipped" && !skipReason.trim()) {
      setMessage("A skipped check needs a reason.");
      return;
    }
    if (
      item.mediaRequired &&
      response !== "skipped" &&
      !file &&
      !(savedResponse?.media?.length)
    ) {
      setMessage("This capture step needs a photo before it can be recorded as OK or issue.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        baseline,
        checkKey: item.key,
        checkLabel: item.label,
        response,
        skipReason,
        note,
        sourceName,
        weakPoint: item.weakPoint ?? null,
        sense: item.sense,
        evidenceFile: file,
      });
      setFile(null);
      setMessage("Answer saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this answer.");
    } finally {
      setSaving(false);
    }
  };

  const controls = (
    <div className="space-y-3 border-t pt-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Answer for ${item.label}`}>
        {([
          ["ok", "OK"],
          ["issue", "Issue"],
          ["skipped", "Skipped"],
        ] as Array<[BaselineResponseValue, string]>).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={response === value ? "default" : "outline"}
            onClick={() => setResponse(value)}
          >
            {label}
          </Button>
        ))}
        {savedResponse && <Badge variant="secondary">{responseLabel(savedResponse)}</Badge>}
      </div>

      {response === "skipped" && (
        <div className="space-y-1">
          <Label htmlFor={`skip-${item.key}`}>Reason for skipping *</Label>
          <Input
            id={`skip-${item.key}`}
            value={skipReason}
            onChange={(event) => setSkipReason(event.target.value)}
            placeholder="Example: This vehicle does not have that feature"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor={`note-${item.key}`}>What did you notice?</Label>
        <Textarea
          id={`note-${item.key}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Add the smell, sound, feel, location, or other detail you observed."
        />
      </div>

      {item.mediaLabel && (
        <div className="space-y-1">
          <Label htmlFor={`file-${item.key}`}>{item.mediaLabel} {item.mediaRequired ? "(required for OK or issue)" : "(optional)"}</Label>
          <Input
            id={`file-${item.key}`}
            type="file"
            accept={item.accept ?? "image/*,video/*,audio/*"}
            capture={item.accept === "image/*" ? "environment" : undefined}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-muted-foreground flex gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0" /> {MEDIA_RETENTION_NOTE}
          </p>
          {savedResponse?.media?.length ? (
            <p className="text-xs text-muted-foreground">{savedResponse.media.length} evidence file saved with this answer.</p>
          ) : null}
        </div>
      )}

      {response === "issue" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium">You recorded an issue. Wrenchli can help you describe it and get a preliminary assessment.</p>
          <Button asChild size="sm" className="mt-2" variant="outline">
            <Link to={`/?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`}>
              Start a preliminary assessment
            </Link>
          </Button>
        </div>
      )}

      {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
      <Button type="button" onClick={() => void save()} disabled={saving}>
        <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save answer"}
      </Button>
    </div>
  );

  if (item.weakPoint) {
    return (
      <WeakPointCheckCard check={item.weakPoint} statusLabel={responseLabel(savedResponse)}>
        {controls}
      </WeakPointCheckCard>
    );
  }

  return (
    <article className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">{item.label}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.instruction}</p>
        </div>
        <Badge variant="outline" className="capitalize">{item.sense}</Badge>
      </div>
      {controls}
    </article>
  );
}

export function BaselineFlow({ record }: { record: RecordApi }) {
  const { vehicle, baselines, responses, weakPoints } = record;
  const defaultSource = useMemo(() => {
    const metadata = record.user?.user_metadata as Record<string, unknown> | undefined;
    const name = metadata?.full_name ?? metadata?.name;
    return typeof name === "string" && name.trim() ? name : record.user?.email?.split("@")[0] ?? "";
  }, [record.user]);
  const [sourceName, setSourceName] = useState("");
  const [odometer, setOdometer] = useState("");
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [startNewRequested, setStartNewRequested] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sourceName && defaultSource) setSourceName(defaultSource);
  }, [defaultSource, sourceName]);

  useEffect(() => {
    // Batch 5: the baseline odometer prefill comes from the latest sourced
    // ledger reading — never a stored bare attribute.
    if (!odometer && record.latestReading) setOdometer(String(Math.round(record.latestReading.odometer_miles)));
  }, [odometer, record.latestReading]);

  const selectedBaseline = useMemo(() => {
    if (startNewRequested) return null;
    if (selectedBaselineId) return baselines.find((baseline) => baseline.id === selectedBaselineId) ?? null;
    return baselines.find((baseline) => baseline.status === "in_progress") ?? baselines[0] ?? null;
  }, [baselines, selectedBaselineId, startNewRequested]);

  const selectedResponses = useMemo(
    () => responses.filter((response) => response.baseline_id === selectedBaseline?.id),
    [responses, selectedBaseline?.id],
  );
  const responseByKey = useMemo(
    () => new Map(selectedResponses.map((response) => [response.check_key, response])),
    [selectedResponses],
  );
  const completion = useMemo(
    () => baselineCompletionState(selectedResponses, weakPoints),
    [selectedResponses, weakPoints],
  );

  if (!vehicle) return null;

  const start = async () => {
    setMessage("");
    setStarting(true);
    try {
      const baseline = await record.startBaseline(odometer ? Number(odometer) : null);
      setStartNewRequested(false);
      setSelectedBaselineId(baseline.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start this baseline.");
    } finally {
      setStarting(false);
    }
  };

  const complete = async () => {
    if (!selectedBaseline) return;
    setMessage("");
    if (!sourceName.trim()) {
      setMessage("Enter your name as the source before saving the baseline.");
      return;
    }
    setCompleting(true);
    try {
      const completed = await record.completeBaseline(selectedBaseline, sourceName);
      setSelectedBaselineId(completed.id);
      setMessage("Baseline saved. It is now locked; later corrections are new timeline entries.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This baseline is not ready to save yet.");
    } finally {
      setCompleting(false);
    }
  };

  const coreItems: BaselineItem[] = CORE_BASELINE_CHECKS.map((definition) => ({
    key: definition.key,
    label: definition.label,
    instruction: definition.instruction,
    sense: definition.sense,
    mediaLabel: definition.mediaLabel,
    accept: definition.accept,
    mediaRequired: definition.mediaRequired,
  }));
  const weakItems: BaselineItem[] = weakPoints.map((check) => ({
    key: weakPointCheckKey(check),
    label: check.title,
    instruction: check.instruction,
    sense: check.sense,
    mediaLabel: "Optional evidence photo",
    accept: "image/*,video/*",
    weakPoint: check,
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-accent" /> Purchase-day Baseline
          </CardTitle>
          <CardDescription>
            A guided capture for a vehicle you just bought. Work through the photos, senses checks, and model-specific checks. Most owners finish in about 10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="baseline-source">Your name (saved as the source) *</Label>
              <Input
                id="baseline-source"
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="Owner name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="baseline-odometer">Odometer at capture</Label>
              <Input
                id="baseline-odometer"
                inputMode="numeric"
                value={odometer}
                onChange={(event) => setOdometer(event.target.value.replace(/\D/g, ""))}
                placeholder="Example: 132400"
                disabled={Boolean(selectedBaseline)}
              />
            </div>
          </div>

          {!selectedBaseline && (
            <div className="rounded-xl border border-dashed p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {baselines.length
                  ? "Start a separate run for this vehicle. Earlier baselines stay locked and unchanged."
                  : "No baseline yet for this vehicle. Enter the odometer reading, then start one now; each run is saved separately."}
              </p>
              <Button onClick={() => void start()} disabled={starting || !odometer}>
                <Play className="mr-2 h-4 w-4" /> {starting ? "Starting..." : "Start Baseline"}
              </Button>
            </div>
          )}

          {selectedBaseline && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={selectedBaseline.status === "completed" ? "default" : "secondary"}>
                {selectedBaseline.status === "completed" ? "Saved baseline" : "Baseline in progress"}
              </Badge>
              <span className="text-muted-foreground">
                Started {formatRecordDate(selectedBaseline.started_at)}
                {selectedBaseline.odometer ? ` · ${selectedBaseline.odometer.toLocaleString()} mi` : ""}
              </span>
              {baselines.length > 1 && (
                <select
                  aria-label="Choose a baseline run"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={selectedBaseline.id}
                  onChange={(event) => setSelectedBaselineId(event.target.value)}
                >
                  {baselines.map((baseline) => (
                    <option key={baseline.id} value={baseline.id}>
                      {formatRecordDate(baseline.started_at)} — {baseline.status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
        </CardContent>
      </Card>

      {selectedBaseline?.status === "completed" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> This baseline is saved and locked</CardTitle>
            <CardDescription>
              Corrections and re-checks do not rewrite this run. Add a correction from the vehicle record, or start a separate new baseline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y rounded-xl border">
              {selectedResponses.map((response) => (
                <li key={response.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                  <span>{response.check_label}</span>
                  <span className="text-muted-foreground">{responseLabel(response)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={`/garage/vehicles/${vehicle.id}`}>Add a correction on the vehicle record</Link>
              </Button>
              <Button onClick={() => {
                setSelectedBaselineId(null);
                setStartNewRequested(true);
                setOdometer("");
              }}>
                Start a new Baseline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedBaseline?.status === "in_progress" && (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="font-heading text-lg font-bold">1. Capture the vehicle today</h2>
              <p className="text-sm text-muted-foreground">Odometer first, then one photo from each side.</p>
            </div>
            {coreItems.slice(0, 5).map((item) => (
              <BaselineCheckCard
                key={item.key}
                item={item}
                baseline={selectedBaseline}
                savedResponse={responseByKey.get(item.key)}
                sourceName={sourceName}
                vehicle={vehicle}
                onSave={record.saveBaselineResponse}
              />
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-heading text-lg font-bold">2. Use Your Senses</h2>
              <p className="text-sm text-muted-foreground">Record what you hear, smell, see, and feel while the vehicle is parked safely.</p>
            </div>
            {coreItems.slice(5).map((item) => (
              <BaselineCheckCard
                key={item.key}
                item={item}
                baseline={selectedBaseline}
                savedResponse={responseByKey.get(item.key)}
                sourceName={sourceName}
                vehicle={vehicle}
                onSave={record.saveBaselineResponse}
              />
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-heading text-lg font-bold">3. Model-specific checks</h2>
              <p className="text-sm text-muted-foreground">
                These checks use only sight, sound, smell, or feel. Anything that would need tools, lifting, or taking parts apart belongs in a shop-visit note instead.
              </p>
            </div>
            {weakItems.length ? weakItems.map((item) => (
              <BaselineCheckCard
                key={item.key}
                item={item}
                baseline={selectedBaseline}
                savedResponse={responseByKey.get(item.key)}
                sourceName={sourceName}
                vehicle={vehicle}
                onSave={record.saveBaselineResponse}
              />
            )) : (
              <p className="rounded-xl border p-4 text-sm text-muted-foreground">
                No model-specific check is saved for this year, make, and model. The core capture above still completes the baseline.
              </p>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Save this Baseline</CardTitle>
              <CardDescription>
                {completion.complete
                  ? "Every core and model-specific check has an answer."
                  : `${completion.answeredCount} of ${completion.totalCount} checks answered. Answer every remaining check before saving.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!completion.complete && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Still needed: {[...completion.missingCore.map((item) => item.label), ...completion.missingWeakPoints.map((item) => item.title)].join(", ")}
                  </span>
                </div>
              )}
              <Button onClick={() => void complete()} disabled={!completion.complete || completing} size="lg">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {completing ? "Saving..." : "Save Baseline"}
              </Button>
              <p className="text-xs text-muted-foreground flex gap-1.5">
                <Camera className="h-3.5 w-3.5 shrink-0" /> Photos and recordings stay in private Garage storage and appear as evidence on the timeline.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
