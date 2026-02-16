import { supabase } from "@/integrations/supabase/client";

const REFERRAL_KEY = "wrli_ref";

/** Capture referral token from URL on page load */
export function captureReferralToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("ref");
  if (token) {
    sessionStorage.setItem(REFERRAL_KEY, token);
    // Log click event
    supabase
      .from("referral_events" as any)
      .insert({
        referral_token: token,
        event_type: "click",
        source: "api",
        zip_code: params.get("zip") || null,
        vehicle_make: params.get("make") || null,
        vehicle_model: params.get("model") || null,
        vehicle_year: params.get("year") || null,
        diagnosis_title: params.get("diagnosis") || null,
      })
      .then(() => {});
  }
  return token || sessionStorage.getItem(REFERRAL_KEY);
}

/** Get stored referral token */
export function getReferralToken(): string | null {
  return sessionStorage.getItem(REFERRAL_KEY);
}

/** Log a page_visit referral event */
export function trackReferralPageVisit(page: string) {
  const token = getReferralToken();
  if (!token) return;
  supabase
    .from("referral_events" as any)
    .insert({
      referral_token: token,
      event_type: "page_visit",
      source: "api",
      metadata: { page },
    })
    .then(() => {});
}

/** Log a quote_submitted referral event */
export function trackReferralConversion(quoteRequestId?: string) {
  const token = getReferralToken();
  if (!token) return;
  supabase
    .from("referral_events" as any)
    .insert({
      referral_token: token,
      event_type: "quote_submitted",
      source: "api",
      quote_request_id: quoteRequestId || null,
    })
    .then(() => {});
}
