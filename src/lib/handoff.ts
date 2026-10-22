import { supabase } from "@/integrations/supabase/client";

export interface HandoffSnapshot {
  vehicle: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
    trim?: string;
    vin?: string;
  };
  symptoms: Record<string, unknown>;
  assessment: {
    explanation: string;
    confidence?: string;
    urgency?: string;
    possible_causes: Array<{
      name: string;
      probability?: number;
      estimated_cost_low?: number;
      estimated_cost_high?: number;
    }>;
    cost_range: { low: number; high: number } | null;
  };
  completed_at: string;
}

export type HandoffRef =
  | { kind: "token"; token: string }
  | { kind: "owned"; id: string };

export interface DeviceHandoff {
  ref: HandoffRef;
  label: string;
  createdAt: string;
  expiresAt: string | null;
}

export const MAX_DEVICE_HANDOFFS = 3;

const STORAGE_KEY = "wrenchli_handoffs_v1";
const PENDING_KEY = "wrenchli_pending_handoff";
/** Fired on window whenever a pending handoff is set, so an already-open
 *  chat panel can start the handoff session without waiting for an
 *  unrelated state change (Continuity 1.1). */
export const HANDOFF_PENDING_EVENT = "wrenchli:pending-handoff";

// Local structural types mirroring the wizard's shapes — defined here to
// avoid a component -> lib import cycle. Do NOT import wizard types.
interface WizardVehicle {
  year: number;
  make: string;
  model: string;
  mileage: number;
  trim?: string;
  vin?: string;
}

interface WizardAssessment {
  confidence?: string;
  urgency?: string;
  explanation: string;
  possible_causes: Array<{
    name: string;
    probability?: number;
    estimated_cost_low?: number;
    estimated_cost_high?: number;
  }>;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function buildSnapshotFromWizard(input: {
  vehicle: WizardVehicle;
  symptoms: Record<string, unknown>;
  assessment: WizardAssessment;
}): HandoffSnapshot {
  const { vehicle, symptoms, assessment } = input;

  const vehicleOut: HandoffSnapshot["vehicle"] = {
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    mileage: vehicle.mileage,
  };
  if (vehicle.trim) vehicleOut.trim = vehicle.trim;
  if (vehicle.vin) vehicleOut.vin = vehicle.vin;

  const possible_causes = assessment.possible_causes.map((c) => {
    const out: HandoffSnapshot["assessment"]["possible_causes"][number] = {
      name: c.name,
    };
    if (isFiniteNumber(c.probability)) out.probability = c.probability;
    if (isFiniteNumber(c.estimated_cost_low)) out.estimated_cost_low = c.estimated_cost_low;
    if (isFiniteNumber(c.estimated_cost_high)) out.estimated_cost_high = c.estimated_cost_high;
    return out;
  });

  const withBoth = assessment.possible_causes.filter(
    (c) => isFiniteNumber(c.estimated_cost_low) && isFiniteNumber(c.estimated_cost_high)
  );
  const cost_range =
    withBoth.length > 0
      ? {
          low: Math.min(...withBoth.map((c) => c.estimated_cost_low as number)),
          high: Math.max(...withBoth.map((c) => c.estimated_cost_high as number)),
        }
      : null;

  const assessmentOut: HandoffSnapshot["assessment"] = {
    explanation: assessment.explanation,
    possible_causes,
    cost_range,
  };
  if (assessment.confidence !== undefined) assessmentOut.confidence = assessment.confidence;
  if (assessment.urgency !== undefined) assessmentOut.urgency = assessment.urgency;

  return {
    vehicle: vehicleOut,
    symptoms,
    assessment: assessmentOut,
    completed_at: new Date().toISOString(),
  };
}

function readDeviceHandoffs(): DeviceHandoff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as DeviceHandoff[];
  } catch {
    return [];
  }
}

function writeDeviceHandoffs(list: DeviceHandoff[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage may be unavailable; ignore
  }
}

export function listDeviceHandoffs(): DeviceHandoff[] {
  return readDeviceHandoffs();
}

export function getMostRecentHandoff(): DeviceHandoff | null {
  const list = readDeviceHandoffs();
  return list.length > 0 ? list[list.length - 1] : null;
}

export function isHandoffExpired(h: DeviceHandoff, now: Date = new Date()): boolean {
  if (h.expiresAt === null) return false;
  return new Date(h.expiresAt).getTime() <= now.getTime();
}

export function setPendingHandoff(ref: HandoffRef): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(ref));
  } catch {
    // ignore
  }
  // Notify any mounted chat surface that a handoff is waiting. Best-effort:
  // a failed dispatch must never break the caller.
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(HANDOFF_PENDING_EVENT));
    }
  } catch {
    // ignore
  }
}

function isValidHandoffRef(v: unknown): v is HandoffRef {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if (obj.kind === "token" && typeof obj.token === "string") return true;
  if (obj.kind === "owned" && typeof obj.id === "string") return true;
  return false;
}

export function consumePendingHandoff(): HandoffRef | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw);
    if (!isValidHandoffRef(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function toChatHandoffParam(
  ref: HandoffRef,
  clientExpiredHint = false
): { token: string; clientExpiredHint?: boolean } | { snapshotId: string } {
  if (ref.kind === "token") {
    return clientExpiredHint
      ? { token: ref.token, clientExpiredHint: true }
      : { token: ref.token };
  }
  return { snapshotId: ref.id };
}

function fireAndForgetDelete(token: string): void {
  try {
    // supabase.functions.invoke returns a promise, but handle promise-like
    // results defensively since the client is a thin wrapper.
    const result: any = supabase.functions.invoke("assessment-handoff", {
      body: { action: "delete", token },
    });
    if (result && typeof result.catch === "function") {
      void result.catch(() => {});
    } else if (result && typeof result.then === "function") {
      void result.then(
        () => {},
        () => {}
      );
    }
  } catch {
    // ignore — pruning must never block the caller
  }
}

function saveDeviceHandoff(record: DeviceHandoff): void {
  const list = readDeviceHandoffs();
  list.push(record);

  let tokenIndices = list
    .map((r, idx) => ({ r, idx }))
    .filter((x) => x.r.ref.kind === "token");

  while (tokenIndices.length > MAX_DEVICE_HANDOFFS) {
    const oldest = tokenIndices[0];
    const removedRef = oldest.r.ref;
    list.splice(oldest.idx, 1);
    if (removedRef.kind === "token") {
      fireAndForgetDelete(removedRef.token);
    }
    tokenIndices = list
      .map((r, idx) => ({ r, idx }))
      .filter((x) => x.r.ref.kind === "token");
  }

  writeDeviceHandoffs(list);
}

export async function createAssessmentHandoff(
  snapshot: HandoffSnapshot,
  sourceAssessmentId?: string,
  userVehicleId?: string
): Promise<HandoffRef | null> {
  try {
    const { data, error } = await supabase.functions.invoke("assessment-handoff", {
      body: {
        action: "create",
        snapshot,
        ...(sourceAssessmentId ? { sourceAssessmentId } : {}),
        ...(userVehicleId ? { userVehicleId } : {}),
      },
    });

    if (error || !data) return null;

    let ref: HandoffRef | null = null;
    let expiresAt: string | null = null;

    if (data.kind === "owned" && typeof data.id === "string") {
      ref = { kind: "owned", id: data.id };
    } else if (
      data.kind === "token" &&
      typeof data.token === "string" &&
      typeof data.expiresAt === "string"
    ) {
      ref = { kind: "token", token: data.token };
      expiresAt = data.expiresAt;
    } else {
      return null;
    }

    const label = `${snapshot.vehicle.year} ${snapshot.vehicle.make} ${snapshot.vehicle.model}`;
    saveDeviceHandoff({
      ref,
      label,
      createdAt: new Date().toISOString(),
      expiresAt: ref.kind === "token" ? expiresAt : null,
    });
    setPendingHandoff(ref);

    return ref;
  } catch {
    return null;
  }
}
