import { supabase } from "@/integrations/supabase/client";

/**
 * Client error reporting (restored 2026-10-18, audit R-49).
 *
 * The `client_errors` table and its anon INSERT policy have existed since
 * 2026-09-27, and the Argus probe reads the `get_client_error_summary()`
 * aggregate hourly — but no writer shipped in the frontend, so the probe's
 * PASS meant "nothing reports", not "nothing fails". This module is the
 * writer: window errors, unhandled rejections, and ErrorBoundary catches
 * are filed as anonymous reports (error type + message + route + UA only —
 * no user id, no storage contents, no form data).
 *
 * Reporting is fire-and-forget and must never throw into the app it
 * monitors. A per-page-load cap + per-message dedupe keep a looping error
 * from flooding the table.
 */

const MAX_REPORTS_PER_LOAD = 25;
const MAX_PER_MESSAGE = 3;
const MAX_MESSAGE_CHARS = 500;

let installed = false;
let sentThisLoad = 0;
const seenCounts = new Map<string, number>();

function toMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return String(error);
  } catch {
    return "Unknown error";
  }
}

export function reportClientError(errorType: string, error: unknown): void {
  try {
    if (typeof window === "undefined") return;
    if (sentThisLoad >= MAX_REPORTS_PER_LOAD) return;
    const message = toMessage(error).slice(0, MAX_MESSAGE_CHARS);
    const key = `${errorType}|${message}`;
    const seen = seenCounts.get(key) ?? 0;
    if (seen >= MAX_PER_MESSAGE) return;
    seenCounts.set(key, seen + 1);
    sentThisLoad += 1;

    // client_errors predates the generated Database types; same cast
    // pattern the alert hooks use for untyped tables.
    void supabase
      .from("client_errors" as any)
      .insert({
        error_type: errorType,
        message,
        route: window.location.pathname,
        user_agent: window.navigator.userAgent.slice(0, 300),
      } as any)
      .then(() => undefined, () => undefined);
  } catch {
    // Reporting must never break the app it monitors.
  }
}

export function installClientErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportClientError("window_error", event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError("unhandled_rejection", event.reason);
  });
}
