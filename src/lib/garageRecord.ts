import type {
  BaselineResponseValue,
  ConditionStatus,
  RecordLayer,
  Sense,
  TimelineCategory,
  VehicleBaselineResponse,
  VehicleConditionCheck,
  VehicleTimelineEvent,
  WeakPointCheck,
} from "@/types/garageRecord";

export const GARAGE_MEDIA_BUCKET = "garage-vehicle-media";
export const MEDIA_RETENTION_NOTE =
  "Files are stored privately in your Garage, are not shared with shops, and open through signed links that expire after one hour.";

export const REPORTED_HISTORY_CAPTION =
  "Reported history only includes what was reported to a DMV, an insurer, a manufacturer, or a reporting shop. If it was never reported, it will not appear here.";

export interface BaselineCheckDefinition {
  key: string;
  label: string;
  sense: Sense;
  instruction: string;
  mediaLabel?: string;
  accept?: string;
  mediaRequired?: boolean;
}

export const CORE_BASELINE_CHECKS: BaselineCheckDefinition[] = [
  {
    key: "odometer_photo",
    label: "Odometer photo and reading",
    sense: "sight",
    instruction: "Photograph the odometer and confirm the number you entered when starting this baseline.",
    mediaLabel: "Odometer photo",
    accept: "image/*",
    mediaRequired: true,
  },
  {
    key: "walkaround_front",
    label: "Walkaround — front",
    sense: "sight",
    instruction: "Stand safely in front of the parked vehicle and photograph the full front view.",
    mediaLabel: "Front photo",
    accept: "image/*",
    mediaRequired: true,
  },
  {
    key: "walkaround_driver_side",
    label: "Walkaround — driver side",
    sense: "sight",
    instruction: "Photograph the full driver side, including both wheels and the lower body panels.",
    mediaLabel: "Driver-side photo",
    accept: "image/*",
    mediaRequired: true,
  },
  {
    key: "walkaround_rear",
    label: "Walkaround — rear",
    sense: "sight",
    instruction: "Photograph the full rear view, including lights, bumper, and lower panels.",
    mediaLabel: "Rear photo",
    accept: "image/*",
    mediaRequired: true,
  },
  {
    key: "walkaround_passenger_side",
    label: "Walkaround — passenger side",
    sense: "sight",
    instruction: "Photograph the full passenger side, including both wheels and the lower body panels.",
    mediaLabel: "Passenger-side photo",
    accept: "image/*",
    mediaRequired: true,
  },
  {
    key: "sound_audio_system",
    label: "Audio system works",
    sense: "sound",
    instruction: "Turn the audio system on at a low volume and note whether sound plays clearly from the speakers.",
  },
  {
    key: "sound_engine_idle",
    label: "Engine idle sound",
    sense: "sound",
    instruction: "With the vehicle parked in a ventilated area, listen at idle for knocking, ticking, squealing, or a rough rhythm. You may add a short recording.",
    mediaLabel: "Optional idle recording",
    accept: "audio/*,video/*",
  },
  {
    key: "smell_cabin",
    label: "Cabin smell — musty, sweet, or chemical",
    sense: "smell",
    instruction: "Sit in the parked vehicle and note whether the cabin smells musty, sweet, or chemical. Choose the closest description in your note.",
  },
  {
    key: "sight_dash_and_panel_fit",
    label: "Dash warnings and panel fit",
    sense: "sight",
    instruction: "Look for dash warning lights that stay on, uneven panel gaps, loose trim, or visible water marks.",
    mediaLabel: "Optional dash or panel photo",
    accept: "image/*",
  },
  {
    key: "feel_idle_and_pedal",
    label: "Idle vibration and pedal feel",
    sense: "feel",
    instruction: "While parked with the parking brake set, note steering-wheel or seat vibration at idle and whether the brake pedal feels firm, soft, or spongy when pressed without moving the vehicle.",
  },
];

export const REPORTED_SUMMARY_CATEGORIES: Array<{
  key: TimelineCategory;
  label: string;
}> = [
  { key: "title", label: "Title records" },
  { key: "odometer", label: "Odometer reports" },
  { key: "recall", label: "Recall reports" },
  { key: "damage", label: "Damage reports" },
  { key: "service", label: "Service reports" },
  { key: "document", label: "Documents" },
];

export function splitTimelineEvents(events: VehicleTimelineEvent[]) {
  return {
    reported: events.filter((event) => event.layer === "reported"),
    observed: events.filter((event) => event.layer === "observed"),
  };
}

export function formatRecordDate(value?: string | null) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function conditionEvidenceLabel(check: VehicleConditionCheck) {
  if (check.status === "not_checked") return "Not yet checked";
  const evidenceCount = check.evidence_media?.length ?? 0;
  const evidence = evidenceCount > 0 ? `${evidenceCount} evidence file${evidenceCount === 1 ? "" : "s"}` : "note recorded";
  return `Checked ${formatRecordDate(check.last_checked_at)} · ${evidence}`;
}

export function observedCoverage(checks: VehicleConditionCheck[]) {
  const captured = checks.filter((check) => check.status !== "not_checked").length;
  return {
    captured,
    total: checks.length,
    label: checks.length
      ? `Baseline: ${captured} of ${checks.length} core checks captured`
      : "Baseline: no core checks captured yet",
  };
}

function normalizeVehicleModel(model: string) {
  return model
    .trim()
    .toLocaleLowerCase()
    .replace(/-class$/, "")
    .replace(/\s+1500$/, "");
}

export function matchesWeakPoint(
  check: WeakPointCheck,
  vehicle: { make: string; model: string; year: number },
) {
  return (
    check.make.trim().toLocaleLowerCase() === vehicle.make.trim().toLocaleLowerCase() &&
    normalizeVehicleModel(check.model) === normalizeVehicleModel(vehicle.model) &&
    vehicle.year >= check.year_start &&
    vehicle.year <= check.year_end
  );
}

export function weakPointCheckKey(check: WeakPointCheck) {
  return `weakpoint:${check.slug}`;
}

export function isAnswered(
  response?: Pick<VehicleBaselineResponse, "response" | "skip_reason"> | null,
) {
  if (!response) return false;
  if (response.response === "skipped") return Boolean(response.skip_reason?.trim());
  return response.response === "ok" || response.response === "issue";
}

export function baselineCompletionState(
  responses: VehicleBaselineResponse[],
  weakPoints: WeakPointCheck[],
) {
  const byKey = new Map(responses.map((response) => [response.check_key, response]));
  const missingCore = CORE_BASELINE_CHECKS.filter((check) => !isAnswered(byKey.get(check.key)));
  const missingWeakPoints = weakPoints.filter(
    (check) => !isAnswered(byKey.get(weakPointCheckKey(check))),
  );
  return {
    complete: missingCore.length === 0 && missingWeakPoints.length === 0,
    missingCore,
    missingWeakPoints,
    answeredCount: responses.filter(isAnswered).length,
    totalCount: CORE_BASELINE_CHECKS.length + weakPoints.length,
  };
}

export function statusFromBaselineResponse(
  response: BaselineResponseValue,
): ConditionStatus | null {
  if (response === "ok") return "checked_ok";
  if (response === "issue") return "checked_issue";
  return null;
}

export function buildAidenLayerAnswer(input: {
  reported: VehicleTimelineEvent[];
  observedChecks: VehicleConditionCheck[];
}) {
  const reported = input.reported.length
    ? input.reported.map((event) => `${event.title} — reported by ${event.source_name}.`).join(" ")
    : "No reported-history entries are saved for this vehicle.";
  const checked = input.observedChecks.filter((check) => check.status !== "not_checked");
  const observed = checked.length
    ? checked.map((check) => `${check.label}: ${conditionEvidenceLabel(check)}.`).join(" ")
    : "No condition checks have been captured yet.";
  const unchecked = input.observedChecks.filter((check) => check.status === "not_checked");
  const notChecked = unchecked.length
    ? unchecked.map((check) => check.label).join(", ")
    : "Every core check in the current list has been captured.";

  return {
    reported,
    observed,
    notChecked,
    text: `What is reported: ${reported} What has been observed: ${observed} What has not been checked: ${notChecked}`,
  };
}

export function layerForNewEntry(layer: RecordLayer): RecordLayer {
  return layer;
}
