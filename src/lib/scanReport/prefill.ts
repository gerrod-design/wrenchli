/**
 * "Go through this with Aiden" — chat prefill bridge.
 *
 * There is no server-side context object for a scan report (the handoff
 * machinery resolves assessment snapshots, not Garage documents), so this
 * uses the same device-local pattern the wizard uses for vehicle context:
 * the message is stashed in sessionStorage, a window event fires, and
 * ChatBot consumes it once and places it in the composer. It is a
 * PREFILL, never an auto-send — the owner reads it and sends it (or
 * edits it) themselves.
 */

export const PREFILL_MESSAGE_KEY = "wrenchli_prefill_message";
export const PREFILL_MESSAGE_EVENT = "wrenchli:prefill-message";
const PREFILL_MAX_AGE_MS = 5 * 60 * 1000;

export function openChatWithPrefill(message: string, vehicleLabel?: string): void {
  try {
    sessionStorage.setItem(
      PREFILL_MESSAGE_KEY,
      JSON.stringify({ message, at: Date.now() }),
    );
    if (vehicleLabel) {
      sessionStorage.setItem("wrenchli_vehicle", vehicleLabel);
    }
  } catch {
    /* storage unavailable — the event below still fires, but without a
       stored message ChatBot has nothing to prefill. */
  }
  try {
    window.dispatchEvent(new CustomEvent(PREFILL_MESSAGE_EVENT));
  } catch {
    /* non-browser context */
  }
  const trigger = document.querySelector<HTMLElement>("[data-chat-trigger]");
  trigger?.click();
}

/** Read-and-clear the pending prefill. Returns null when absent or stale. */
export function consumePrefillMessage(): string | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_MESSAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_MESSAGE_KEY);
    const parsed = JSON.parse(raw) as { message?: unknown; at?: unknown };
    if (typeof parsed.message !== "string" || !parsed.message.trim()) return null;
    if (typeof parsed.at === "number" && Date.now() - parsed.at > PREFILL_MAX_AGE_MS) {
      return null;
    }
    return parsed.message;
  } catch {
    return null;
  }
}
