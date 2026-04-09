import { supabase } from "@/integrations/supabase/client";

const PENDING_KEY = "wrenchli_pending_funnel";

interface PendingEvent {
  step_number: number;
  step_name: string;
  device_type: string;
  created_at: string;
}

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  const ua = navigator.userAgent;
  if (w < 768 || /Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (w >= 768 && w <= 1024) return "tablet";
  return "desktop";
}

function readPending(): PendingEvent[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePending(events: PendingEvent[]) {
  try {
    if (events.length) localStorage.setItem(PENDING_KEY, JSON.stringify(events));
    else localStorage.removeItem(PENDING_KEY);
  } catch { /* ignore */ }
}

/**
 * Fire-and-forget insert to wizard_funnel_events.
 * If sessionId is null, buffers in localStorage.
 */
export function logFunnelEvent(
  sessionId: string | null,
  stepNumber: number,
  stepName: string,
) {
  const device_type = detectDeviceType();

  if (!sessionId) {
    const pending = readPending();
    pending.push({
      step_number: stepNumber,
      step_name: stepName,
      device_type,
      created_at: new Date().toISOString(),
    });
    writePending(pending);
    return;
  }

  // Insert directly — fire and forget
  supabase
    .from("wizard_funnel_events" as any)
    .insert({ session_id: sessionId, step_number: stepNumber, step_name: stepName, device_type })
    .then(() => {});
}

/**
 * Flush any pending events once sessionId is available.
 */
export function flushPendingFunnelEvents(sessionId: string) {
  const pending = readPending();
  if (!pending.length) return;
  writePending([]);

  const rows = pending.map((e) => ({
    session_id: sessionId,
    step_number: e.step_number,
    step_name: e.step_name,
    device_type: e.device_type,
  }));

  supabase
    .from("wizard_funnel_events" as any)
    .insert(rows)
    .then(() => {});
}
