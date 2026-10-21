// supabase/functions/chat/handoff-context.ts

export const HANDOFF_TTL_DAYS = 7;

export const PRODUCT_CAPABILITIES = {
  accounts: true,
  chat_saving: false,
  garage: true,
  signed_out_handoff_lifetime_days: 7,
} as const;

export type HandoffStatus = "present" | "expired" | "absent" | "unreadable";

export interface HandoffRef {
  token?: string;
  snapshotId?: string;
  clientExpiredHint?: boolean;
}

export interface HandoffResolution {
  status: HandoffStatus;
  snapshot?: Record<string, unknown>;
}

export interface HandoffRow {
  id: string;
  owner_user_id: string | null;
  token_hash: string | null;
  snapshot: Record<string, unknown>;
  expires_at: string | null;
}

export interface HandoffStore {
  from(table: "assessment_handoffs"): {
    select(cols: string): {
      eq(
        col: string,
        val: string,
      ): { maybeSingle(): Promise<{ data: HandoffRow | null; error: unknown }> };
    };
  };
}

const SELECT_COLS = "id, owner_user_id, token_hash, snapshot, expires_at";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isExpired(expires_at: string | null): boolean {
  if (!expires_at) return false;
  const t = Date.parse(expires_at);
  if (Number.isNaN(t)) return false;
  return t <= Date.now();
}

export async function resolveHandoff(
  admin: unknown,
  ref: HandoffRef,
  userId: string | null,
): Promise<HandoffResolution> {
  const store = admin as HandoffStore;

  try {
    if (ref.token && ref.token.length > 0) {
      const hash = await sha256Hex(ref.token);
      const { data: row, error } = await store
        .from("assessment_handoffs")
        .select(SELECT_COLS)
        .eq("token_hash", hash)
        .maybeSingle();

      if (error) return { status: "unreadable" };
      if (!row) return { status: ref.clientExpiredHint ? "expired" : "absent" };
      if (isExpired(row.expires_at)) return { status: "expired" };
      return { status: "present", snapshot: row.snapshot };
    }

    if (ref.snapshotId && ref.snapshotId.length > 0) {
      const { data: row, error } = await store
        .from("assessment_handoffs")
        .select(SELECT_COLS)
        .eq("id", ref.snapshotId)
        .maybeSingle();

      if (error) return { status: "unreadable" };
      if (!row) return { status: "absent" };
      if (row.token_hash !== null) return { status: "unreadable" };
      if (row.owner_user_id !== null && userId !== null && row.owner_user_id === userId) {
        if (isExpired(row.expires_at)) return { status: "expired" };
        return { status: "present", snapshot: row.snapshot };
      }
      return { status: "unreadable" };
    }

    return { status: "absent" };
  } catch {
    return { status: "unreadable" };
  }
}

function fmtDate(completedAt: unknown): { label: string; ageDays: number } {
  const raw = typeof completedAt === "string" ? completedAt : undefined;
  const t = raw ? Date.parse(raw) : NaN;
  if (!raw || Number.isNaN(t)) return { label: "an earlier date", ageDays: 999 };
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(t));
  const ageDays = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  return { label, ageDays };
}

function get(obj: Record<string, unknown> | undefined, key: string): unknown {
  return obj ? obj[key] : undefined;
}

function buildSnapshotBlock(snapshot: Record<string, unknown>): string {
  const { label: dateLabel, ageDays } = fmtDate(snapshot.completed_at);

  const vehicle = snapshot.vehicle as Record<string, unknown> | undefined;
  const year = get(vehicle, "year");
  const make = get(vehicle, "make");
  const model = get(vehicle, "model");
  const mileage = get(vehicle, "mileage");
  const vin = get(vehicle, "vin");
  let vehicleLine = `Vehicle: ${[year, make, model].filter((v) => v !== undefined && v !== null && v !== "").join(" ")}`;
  if (mileage !== undefined && mileage !== null) vehicleLine += ` — ${mileage} miles`;
  if (vin) vehicleLine += ` — VIN ${vin}`;

  const symptoms = snapshot.symptoms as Record<string, unknown> | undefined;
  const primary = get(symptoms, "primary_symptom") ?? get(symptoms, "raw_description");
  let symptomLine = `What they described: ${primary ?? "not recorded"}`;
  const severity = get(symptoms, "severity");
  if (severity) symptomLine += ` (severity: ${severity})`;
  const when = get(symptoms, "when_it_happens");
  if (when) symptomLine += ` — happens: ${when}`;
  const lights = get(symptoms, "warning_lights");
  if (Array.isArray(lights) && lights.length > 0) {
    symptomLine += ` — warning lights: ${lights.join(", ")}`;
  }

  const assessment = snapshot.assessment as Record<string, unknown> | undefined;
  const explanation = get(assessment, "explanation");
  const assessmentLine = explanation ? `Preliminary assessment: ${explanation}` : undefined;

  const causes = get(assessment, "possible_causes");
  let causesLine: string | undefined;
  if (Array.isArray(causes) && causes.length > 0) {
    const parts = causes.map((c) => {
      const cc = c as Record<string, unknown>;
      let s = String(cc.name ?? "unknown cause");
      if (typeof cc.probability === "number") s += ` (~${Math.round(cc.probability * 100)}%)`;
      if (cc.estimated_cost_low !== undefined && cc.estimated_cost_high !== undefined) {
        s += ` — est. $${cc.estimated_cost_low}–$${cc.estimated_cost_high}`;
      }
      return s;
    });
    causesLine = `Likely causes: ${parts.join("; ")}`;
  }

  const costRange = get(assessment, "cost_range") as Record<string, unknown> | null | undefined;
  let costLine: string | undefined;
  if (costRange && costRange.low !== undefined && costRange.high !== undefined) {
    costLine = `Overall cost range shown: $${costRange.low}–$${costRange.high}`;
  }

  let staleness: string;
  if (ageDays <= 30) {
    staleness = "This assessment is recent; still date it when you restate it.";
  } else if (ageDays <= 90) {
    staleness =
      "This assessment is over a month old: when you use it, add that prices and the car's condition may have changed since, and offer a fresh assessment.";
  } else {
    staleness =
      "This assessment is over 90 days old: talk about it in the past tense only. Do not restate its cost or urgency as current, and recommend a new assessment before the user acts on it.";
  }

  const lines = [
    `**ASSESSMENT SNAPSHOT — the user completed a Wrenchli assessment on ${dateLabel}. This is exactly what they were shown:**`,
    `- ${vehicleLine}`,
    `- ${symptomLine}`,
  ];
  if (assessmentLine) lines.push(`- ${assessmentLine}`);
  if (causesLine) lines.push(`- ${causesLine}`);
  if (costLine) lines.push(`- ${costLine}`);
  lines.push(
    "Rules for using this snapshot — follow them exactly:",
    `- Open (or when first relevant) with ONE short line acknowledging it: name the vehicle and the main symptom, like "I've got your assessment from ${dateLabel} on the ${[year, make, model].filter(Boolean).join(" ")} — the ${primary ?? "issue"}. Want to start there?" Use that shape. Do not say "pick up where you left off" or otherwise suggest the chat conversation itself was saved — what you have is the assessment, not an earlier chat. Do not recite the findings, causes, or cost unless the user asks.`,
    "- Whenever you restate a finding, urgency, or cost from this snapshot, give the assessment's date with it. A completed assessment is a preliminary assessment — a shop's inspection is what confirms it. Never invent updated numbers.",
    `- ${staleness}`,
    `- If the user corrects a fact from the snapshot in this conversation, their words are newer — go with the correction and name it ("you said 2017, so I'll go with that"). The snapshot itself does not change.`,
  );
  return lines.join("\n");
}

export function buildSessionContext(
  resolution: HandoffResolution | null,
  opts: { signedIn: boolean },
): string {
  const cap = PRODUCT_CAPABILITIES;
  const parts: string[] = [];

  parts.push(
    [
      "**PRODUCT CAPABILITIES — ANSWER FROM THIS BLOCK ONLY:**",
      "The facts below come from this product's live configuration. Whenever the user asks about accounts, signing in, saving, history, or what you remember, answer ONLY from these facts — never from general knowledge of how apps usually work. If a question falls outside these facts, say you don't have that answer instead of guessing.",
      `- accounts: ${cap.accounts ? "YES" : "NO"} — people can create a free Wrenchli account and sign in. If they ask how, tell them the Garage page walks them through it: [My Garage](/garage). Never send someone to a contact form for account help.`,
      `- chat_saving: ${cap.chat_saving ? "YES" : "NO"} — chat conversations are not saved to an account yet. Never say "I'll save this," "it's in your history," or "you can pick up where we left off." When saving comes up, state what IS true and what is NOT in the same answer, and give one practical step (for example: copy anything you want to keep before you leave this page).`,
      `- garage: ${cap.garage ? "YES" : "NO"} — the Garage exists. Signed-in users can save vehicles there and track maintenance.`,
      `- signed_out_assessment_handoff: a finished assessment can start a new chat on the same device for up to ${cap.signed_out_handoff_lifetime_days} days. That is about the assessment only — it is not saved chat history.`,
    ].join("\n"),
  );

  parts.push(
    [
      "**SESSION STATE:**",
      `- signed_in: ${opts.signedIn ? "YES" : "NO"}`,
      "- If the user asks whether THIS chat is being saved: the answer is NO for everyone right now (chat_saving is NO). Say it plainly, signed in or not.",
    ].join("\n"),
  );

  if (resolution) {
    if (resolution.status === "present" && resolution.snapshot) {
      parts.push(buildSnapshotBlock(resolution.snapshot));
    } else if (resolution.status === "expired") {
      parts.push(
        "**CONTEXT STATUS: EXPIRED** — the user tried to continue from an earlier assessment, but it is no longer available to you (it expired, or the assessment was done on a different device). Say that plainly in one line, do NOT guess or invent any detail of it, and ask the user to tell you the vehicle and what they're noticing so you can pick up from there.",
      );
    } else if (resolution.status === "absent") {
      parts.push(
        "**CONTEXT STATUS: ABSENT** — no earlier assessment is attached to this conversation, even though the user may expect one to be. Do not claim to remember anything from before. Ask plainly for the vehicle and what they're noticing.",
      );
    } else if (resolution.status === "unreadable") {
      parts.push(
        "**CONTEXT STATUS: UNREADABLE** — an earlier assessment exists as a reference but could not be opened. Say plainly that you can't open it, do NOT invent any detail of it, and ask the user to tell you the vehicle and what they're noticing.",
      );
    }
  }

  return "\n\n" + parts.join("\n\n");
}

export const SESSION_START_TURN: string =
  "[Session start — the user just opened this chat. If an assessment snapshot is in your context, open with your one-line acknowledgment of it and end with a short question. If the context status is EXPIRED, ABSENT, or UNREADABLE, open with the plain admission and ask them to tell you the vehicle and what they're noticing. Do not call any tools in this opening. Do not ask for the user's name in this opening.]";
