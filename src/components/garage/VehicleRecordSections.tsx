import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Paperclip,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MEDIA_RETENTION_NOTE,
  REPORTED_HISTORY_CAPTION,
  REPORTED_SUMMARY_CATEGORIES,
  conditionEvidenceLabel,
  formatRecordDate,
  observedCoverage,
  splitTimelineEvents,
  weakPointCheckKey,
} from "@/lib/garageRecord";
import type { AddTimelineInput, AttachDocumentInput } from "@/hooks/useVehicleRecord";
import type { RecallAlert } from "@/hooks/useVehicleRecalls";
import type {
  RecordLayer,
  SourceType,
  TimelineCategory,
  VehicleBaseline,
  VehicleConditionCheck,
  VehicleDocument,
  VehicleTimelineEvent,
  WeakPointCheck,
} from "@/types/garageRecord";
import { cn } from "@/lib/utils";

const SOURCE_TYPES: Array<{ value: SourceType; label: string }> = [
  { value: "owner", label: "Owner" },
  { value: "technician", label: "Technician" },
  { value: "shop", label: "Shop" },
  { value: "document", label: "Document" },
  { value: "system", label: "System" },
];

const CATEGORIES: Record<RecordLayer, Array<{ value: TimelineCategory; label: string }>> = {
  reported: [
    { value: "title", label: "Title" },
    { value: "odometer", label: "Odometer" },
    { value: "recall", label: "Recall" },
    { value: "damage", label: "Damage" },
    { value: "service", label: "Service" },
    { value: "document", label: "Document" },
    { value: "shop_visit", label: "Shop visit" },
  ],
  observed: [
    { value: "condition_check", label: "Condition check" },
    { value: "baseline", label: "Baseline correction or re-check" },
    { value: "shop_visit", label: "Shop visit note" },
    { value: "document", label: "Document" },
  ],
};

function selectClassName() {
  return "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
}

export function TimelineEntryForm({
  layer,
  onSubmit,
}: {
  layer: RecordLayer;
  onSubmit: (input: AddTimelineInput) => Promise<unknown>;
}) {
  const [category, setCategory] = useState<TimelineCategory>(CATEGORIES[layer][0].value);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("owner");
  const [sourceName, setSourceName] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!sourceName.trim()) {
      setMessage("Enter the source name. Entries without a named source cannot be saved.");
      return;
    }
    if (!title.trim()) {
      setMessage("Enter a short title for this entry.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        layer,
        category,
        title,
        detail,
        sourceType,
        sourceName,
        occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
        odometer: odometer ? Number(odometer) : null,
      });
      setTitle("");
      setDetail("");
      setOdometer("");
      setMessage("Entry added to the timeline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-dashed p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Add a {layer} entry</h3>
        <p className="text-xs text-muted-foreground mt-1">
          This creates a new timeline entry. Existing entries are not edited.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`${layer}-category`}>Category</Label>
          <select
            id={`${layer}-category`}
            className={selectClassName()}
            value={category}
            onChange={(event) => setCategory(event.target.value as TimelineCategory)}
          >
            {CATEGORIES[layer].map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${layer}-date`}>Date it occurred</Label>
          <Input
            id={`${layer}-date`}
            type="date"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${layer}-title`}>Title</Label>
        <Input
          id={`${layer}-title`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={layer === "reported" ? "Example: Service visit reported" : "Example: Rechecked rear cargo area"}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${layer}-detail`}>Detail</Label>
        <Textarea
          id={`${layer}-detail`}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="What was reported or observed?"
          rows={3}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor={`${layer}-source-type`}>Source type</Label>
          <select
            id={`${layer}-source-type`}
            className={selectClassName()}
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as SourceType)}
          >
            {SOURCE_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-1">
          <Label htmlFor={`${layer}-source-name`}>Source name *</Label>
          <Input
            id={`${layer}-source-name`}
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="Person, shop, or document name"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${layer}-odometer`}>Odometer</Label>
          <Input
            id={`${layer}-odometer`}
            inputMode="numeric"
            value={odometer}
            onChange={(event) => setOdometer(event.target.value.replace(/\D/g, ""))}
            placeholder="Optional"
          />
        </div>
      </div>
      {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
      <Button type="submit" disabled={saving} variant="outline">
        {saving ? "Saving..." : "Add timeline entry"}
      </Button>
    </form>
  );
}

export function DocumentAttachForm({
  onAttach,
}: {
  onAttach: (file: File, input: AttachDocumentInput) => Promise<unknown>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [layer, setLayer] = useState<RecordLayer>("reported");
  const [documentKind, setDocumentKind] = useState("purchase_paperwork");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!file) {
      setMessage("Choose a PDF or image file first.");
      return;
    }
    if (!sourceName.trim()) {
      setMessage("Enter the uploader name. It is saved as the source for this document.");
      return;
    }
    setSaving(true);
    try {
      await onAttach(file, { layer, documentKind, sourceName, title, detail });
      setFile(null);
      setTitle("");
      setDetail("");
      setMessage("Document saved and added to the timeline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this document.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex gap-2">
        <Lock className="h-4 w-4 shrink-0" />
        <span>{MEDIA_RETENTION_NOTE} Documents are private and owner-only unless you later choose a sharing option.</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="document-layer">Record layer</Label>
          <select
            id="document-layer"
            className={selectClassName()}
            value={layer}
            onChange={(event) => setLayer(event.target.value as RecordLayer)}
          >
            <option value="reported">Reported history</option>
            <option value="observed">Observed condition</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="document-kind">Document type</Label>
          <select
            id="document-kind"
            className={selectClassName()}
            value={documentKind}
            onChange={(event) => setDocumentKind(event.target.value)}
          >
            <option value="purchase_paperwork">Purchase paperwork</option>
            <option value="inspection_report">Inspection report</option>
            <option value="history_report">History report</option>
            <option value="service_record">Service record</option>
            <option value="other">Other vehicle document</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="document-file">PDF or image</Label>
        <Input
          id="document-file"
          type="file"
          accept="application/pdf,image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="document-title">Timeline title</Label>
          <Input
            id="document-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Defaults to the file name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="document-source">Uploader / source name *</Label>
          <Input
            id="document-source"
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="Your name"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="document-detail">Note</Label>
        <Textarea
          id="document-detail"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={2}
          placeholder="Optional context for this file"
        />
      </div>
      {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
      <Button type="submit" disabled={saving}>
        <Paperclip className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Attach document"}
      </Button>
    </form>
  );
}

export function WeakPointCheckCard({
  check,
  statusLabel,
  children,
}: {
  check: WeakPointCheck;
  statusLabel?: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">{check.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {check.make} {check.model} · {check.year_start}-{check.year_end}
            {check.generation ? ` · ${check.generation}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">{check.sense}</Badge>
          {statusLabel && <Badge variant="secondary">{statusLabel}</Badge>}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{check.instruction}</p>
      <p className="text-sm text-muted-foreground"><strong className="text-foreground">Why it matters:</strong> {check.why_it_matters}</p>
      {check.applicability_notes && (
        <p className="text-xs text-muted-foreground flex gap-2">
          <Info className="h-4 w-4 shrink-0" /> {check.applicability_notes}
        </p>
      )}
      <details className="rounded-lg bg-muted/50 p-3">
        <summary className="cursor-pointer text-xs font-semibold">Source for this check</summary>
        <div className="pt-2 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{check.citation_label}</p>
          <p>{check.citation_details}</p>
          {check.citation_url && (
            <a className="inline-flex items-center gap-1 text-primary hover:underline" href={check.citation_url} target="_blank" rel="noreferrer">
              Open source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </details>
      {children}
    </article>
  );
}

function TimelineList({ events, onOpenMedia }: {
  events: VehicleTimelineEvent[];
  onOpenMedia?: (event: VehicleTimelineEvent) => Promise<void>;
}) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No entries saved in this layer yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-xl border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{event.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Occurred {formatRecordDate(event.occurred_at)} · Captured {formatRecordDate(event.captured_at)}
                {event.odometer ? ` · ${event.odometer.toLocaleString()} mi` : ""}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">{event.category.replace("_", " ")}</Badge>
          </div>
          {event.detail && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{event.detail}</p>}
          <p className="text-xs mt-3">
            <span className="font-semibold">Source:</span> {event.source_name} <span className="text-muted-foreground">({event.source_type})</span>
          </p>
          {event.media?.length > 0 && onOpenMedia && (
            <Button type="button" size="sm" variant="link" className="px-0" onClick={() => void onOpenMedia(event)}>
              <Camera className="mr-1 h-3.5 w-3.5" /> View attached evidence ({event.media.length})
            </Button>
          )}
        </li>
      ))}
    </ol>
  );
}

interface VehicleRecordSectionsProps {
  timeline: VehicleTimelineEvent[];
  coreChecks: VehicleConditionCheck[];
  currentChecks: VehicleConditionCheck[];
  weakPoints: WeakPointCheck[];
  recalls: RecallAlert[];
  documents: VehicleDocument[];
  baselines: VehicleBaseline[];
  sharePermissionCount: number;
  loading?: boolean;
  reportedTools?: ReactNode;
  observedTools?: ReactNode;
  documentTools?: ReactNode;
  onOpenDocument: (document: VehicleDocument) => Promise<void>;
  onOpenTimelineMedia?: (event: VehicleTimelineEvent) => Promise<void>;
}

export function VehicleRecordSections({
  timeline,
  coreChecks,
  currentChecks,
  weakPoints,
  recalls,
  documents,
  baselines,
  sharePermissionCount,
  loading,
  reportedTools,
  observedTools,
  documentTools,
  onOpenDocument,
  onOpenTimelineMedia,
}: VehicleRecordSectionsProps) {
  const { reported, observed } = useMemo(() => splitTimelineEvents(timeline), [timeline]);
  const coverage = observedCoverage(coreChecks);
  const currentByKey = useMemo(
    () => new Map(currentChecks.map((check) => [check.check_key, check])),
    [currentChecks],
  );

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-sky-50/70">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-700" />
            <CardTitle>Reported History</CardTitle>
          </div>
          <CardDescription>{REPORTED_HISTORY_CAPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Reported history summary">
            {REPORTED_SUMMARY_CATEGORIES.map((category) => {
              const entries = reported.filter((event) => event.category === category.key);
              const recallCount = category.key === "recall" ? recalls.length : 0;
              const count = category.key === "recall" ? Math.max(entries.length, recallCount) : entries.length;
              const latest = entries[0];
              return (
                <div key={category.key} className="rounded-xl border bg-background p-3 min-h-24">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category.label}</p>
                  <p className="text-2xl font-bold mt-2">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latest ? `Latest: ${formatRecordDate(latest.occurred_at)} · ${latest.source_name}` : count ? "See recall alerts below" : "No entry saved"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recall alerts saved for this vehicle</h3>
            {recalls.length ? recalls.map((recall) => (
              <div key={recall.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{recall.component}</p>
                    <p className="text-sm text-muted-foreground mt-1">{recall.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">Campaign {recall.campaign_number}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recall alerts are currently saved in this Garage record.</p>
            )}
          </div>

          {reportedTools}
          <TimelineList events={reported} onOpenMedia={onOpenTimelineMedia} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <CardTitle>Observed Condition</CardTitle>
          </div>
          <CardDescription>
            Coverage only: this section records what was checked, when, and what evidence was saved. It does not rate the vehicle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="rounded-xl border bg-background p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
            <div>
              <p className="font-semibold">{coverage.label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {baselines.some((baseline) => baseline.status === "completed")
                  ? "A saved baseline is in the timeline. A later run is stored as a separate baseline."
                  : "No baseline yet. Start one to capture the core checks for this vehicle."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Observed condition summary">
            {coreChecks.map((check) => (
              <div key={check.check_key} className="rounded-xl border bg-background p-3 min-h-24">
                <div className="flex items-start gap-2">
                  {check.status === "not_checked" ? (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : check.status === "checked_issue" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-semibold leading-tight">{check.label}</p>
                    <p className={cn("text-xs mt-1", check.status === "not_checked" && "text-muted-foreground")}>
                      {conditionEvidenceLabel(check)}
                    </p>
                    {check.last_source_name && check.status !== "not_checked" && (
                      <p className="text-xs text-muted-foreground mt-1">Recorded by {check.last_source_name}</p>
                    )}
                    {check.note && <p className="text-xs text-muted-foreground mt-1">{check.note}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Model-specific checks</h3>
              <p className="text-sm text-muted-foreground">Each check uses only sight, sound, smell, or feel. Open the source details before relying on a check.</p>
            </div>
            {weakPoints.length ? weakPoints.map((check) => {
              const current = currentByKey.get(weakPointCheckKey(check));
              return (
                <WeakPointCheckCard
                  key={check.id}
                  check={check}
                  statusLabel={current ? conditionEvidenceLabel(current) : "Not yet checked"}
                />
              );
            }) : (
              <p className="text-sm text-muted-foreground">No model-specific check is saved for this year, make, and model.</p>
            )}
          </div>

          {observedTools}
          <TimelineList events={observed} onOpenMedia={onOpenTimelineMedia} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Paperclip className="h-5 w-5" /> Documents</CardTitle>
          <CardDescription>
            Files stay in private storage. Attaching a file also creates a timeline event in the layer you choose.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentTools}
          {documents.length ? (
            <ul className="divide-y rounded-xl border">
              {documents.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium">{document.original_filename}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {document.layer === "reported" ? "Reported history" : "Observed condition"} · {formatRecordDate(document.created_at)} · Source: {document.source_name}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void onOpenDocument(document)}>
                    Open private file
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No documents saved for this vehicle yet.</p>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Sharing is off by default. {sharePermissionCount} share-permission record{sharePermissionCount === 1 ? " is" : "s are"} stored in the schema; no share controls are included here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
