import { toast } from "sonner";
import { trackVoiceEvent } from "./voiceTelemetry";

type VoiceSurface =
  | "chatbot_header"
  | "chatbot_input"
  | "inline_voice_button"
  | "inline_switch_to_voice";

type StartFn = () => boolean;

const AUTO_RETRY_DELAY_MS = 400;
const PERMISSION_POLL_MS = 500;
const PERMISSION_POLL_TIMEOUT_MS = 30_000;

async function micPermissionState(): Promise<PermissionState | "unknown"> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
    // Cast: TS DOM lib doesn't include "microphone" in PermissionName everywhere.
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}

/**
 * Handle a failed start attempt with three layered fallbacks:
 *   1. If permission is already granted → silent auto-retry once after a short delay.
 *   2. If permission is "prompt" → poll until granted, then auto-start.
 *   3. Always show a persistent toast with a one-tap "Try again" button that
 *      calls start() synchronously inside the user's tap (gesture-chain safe).
 */
export async function handleStartFailure(
  surface: VoiceSurface,
  start: StartFn,
): Promise<void> {
  const state = await micPermissionState();
  trackVoiceEvent(surface, "permission_error", { permission_state: state });

  // Persistent toast with sync retry action — the retry tap itself is a
  // user gesture, so calling start() inside the action is safe.
  const toastId = toast.error("Microphone didn't start.", {
    description:
      state === "denied"
        ? "Mic access is blocked. Enable it in your browser settings, then tap Try again."
        : "Tap Try again — your browser may need one more nudge.",
    duration: Infinity,
    action: {
      label: "Try again",
      onClick: () => {
        trackVoiceEvent(surface, "tap", { retry: true });
        const ok = start();
        trackVoiceEvent(surface, ok ? "start_success" : "start_failure", { retry: true });
        if (ok) toast.dismiss(toastId);
      },
    },
  });

  // Layer 1: silent auto-retry if permission is already granted
  if (state === "granted") {
    setTimeout(() => {
      const ok = start();
      trackVoiceEvent(surface, ok ? "start_success" : "start_failure", { auto_retry: true });
      if (ok) toast.dismiss(toastId);
    }, AUTO_RETRY_DELAY_MS);
    return;
  }

  // Layer 2: poll for permission flip when user is in the prompt
  if (state === "prompt" || state === "unknown") {
    const deadline = Date.now() + PERMISSION_POLL_TIMEOUT_MS;
    const poll = async () => {
      if (Date.now() > deadline) return;
      const next = await micPermissionState();
      if (next === "granted") {
        const ok = start();
        trackVoiceEvent(surface, ok ? "start_success" : "start_failure", {
          auto_retry: true,
          after_prompt: true,
        });
        if (ok) toast.dismiss(toastId);
        return;
      }
      if (next === "denied") return; // stop polling; user said no
      setTimeout(poll, PERMISSION_POLL_MS);
    };
    setTimeout(poll, PERMISSION_POLL_MS);
  }
}
