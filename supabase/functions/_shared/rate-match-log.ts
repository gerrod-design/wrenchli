/**
 * rate-match-log.ts
 * ---------------------------------------------------------------------------
 * R-68 telemetry: record every repair-rate matcher outcome (which pipeline
 * ran the matcher, what repair text it tried, matched or missed, and which
 * book entry matched) into public.rate_match_log via the service role.
 *
 * This turns the matcher miss rate from a sampling guess into a counted
 * fact and produces the work list for growing the book (Option C follow-on).
 *
 * FIRE-AND-FORGET BY CONTRACT: logging must never break, delay, or fail an
 * assessment. Every failure path is swallowed with a console marker
 * ("[rate-match-log] ...") and the function never throws and never returns
 * a promise the caller needs to await.
 * ---------------------------------------------------------------------------
 */

export interface RateMatchEvent {
  /** Pipeline name, e.g. "diagnose", "estimate-repair", "api-diagnose". */
  pipeline: string;
  /** The repair title / cause text the matcher was run against. */
  repairText: string;
  matched: boolean;
  /** Book entry id on a match (RepairRateEntry.id); null on a miss. */
  rateEntryId?: string | null;
}

export function logRateMatch(event: RateMatchEvent): void {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.warn(
        `[rate-match-log] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not configured; skipping outcome for pipeline=${event.pipeline}`,
      );
      return;
    }

    fetch(`${url}/rest/v1/rate_match_log`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        pipeline: event.pipeline,
        repair_text: (event.repairText ?? "").slice(0, 300),
        matched: event.matched,
        rate_entry_id: event.matched ? (event.rateEntryId ?? null) : null,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn(
            `[rate-match-log] insert failed pipeline=${event.pipeline} status=${res.status}`,
          );
        }
      })
      .catch((err) => {
        console.warn(`[rate-match-log] insert error pipeline=${event.pipeline}:`, err);
      });
  } catch (err) {
    console.warn("[rate-match-log] unexpected error:", err);
  }
}
