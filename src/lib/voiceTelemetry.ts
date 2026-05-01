import { trackEvent } from "./analytics";

/**
 * Voice telemetry — turns silent mic failures into observable events.
 *
 * Maren's dashboard pages on (taps - starts) / taps > 20% on any
 * browser/OS combo over a 24h window. See useVoiceChat ownership notes.
 */

type VoiceSurface =
  | "chatbot_header"
  | "chatbot_input"
  | "inline_voice_button"
  | "inline_switch_to_voice";

type VoiceOutcome = "tap" | "start_success" | "start_failure" | "permission_error";

const ua = () => (typeof navigator !== "undefined" ? navigator.userAgent : "unknown");

export function trackVoiceEvent(
  surface: VoiceSurface,
  outcome: VoiceOutcome,
  metadata: Record<string, unknown> = {},
): void {
  trackEvent({
    event_type: "user_action",
    category: "navigation",
    action: `voice_${outcome}`,
    label: surface,
    metadata: {
      surface,
      outcome,
      user_agent: ua(),
      ...metadata,
    },
  });
}
