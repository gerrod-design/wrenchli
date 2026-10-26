import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  selectDelivery,
  DEFAULT_PREFS,
  type PendingMessage,
  type ProactivePrefs,
  type ShownRecord,
} from "@/lib/proactive/delivery";
import { messageFor, reasonFor, actionLabelFor } from "@/lib/proactive/copy";

// Proactive Events Phase 1 — the delivery path.
//
// Reads the signed-in user's queue rows and preferences (owner-scoped RLS),
// re-checks at delivery time which underlying records have been acted on
// (the spec's kill switch), then hands everything to the pure delivery
// gate (src/lib/proactive/delivery.ts), which applies quiet hours, caps,
// priority, and the current opt-out state. At most one message is ever
// returned. State changes decided by the gate (cancel / expire) are
// persisted before the message is shown.

export interface ProactiveMessageView {
  id: string;
  eventType: string;
  message: string;
  reason: string;
  actionLabel: string;
  actionPath: string;
}

interface QueueRow {
  id: string;
  event_type: string;
  category: PendingMessage["category"];
  source_table: string;
  source_id: string;
  source_key: string;
  vehicle_id: string | null;
  payload: Record<string, unknown>;
  state: string;
  eligible_at: string;
  shown_at: string | null;
  created_at: string;
}

const MESSAGES_TABLE = "proactive_messages" as any;
const PREFS_TABLE = "proactive_preferences" as any;

export function prefsFromRow(row: Record<string, unknown> | null): ProactivePrefs {
  if (!row) return DEFAULT_PREFS;
  return {
    masterEnabled: row.master_enabled !== false,
    assessmentFollowups: row.assessment_followups !== false,
    repairUpdates: row.repair_updates !== false,
    postRepairCheckins: row.post_repair_checkins !== false,
    servicePrompts: row.service_prompts !== false,
    recallAlertsEnabled: row.recall_alerts_enabled !== false,
  };
}

async function fetchPrefsRow(userId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from(PREFS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as unknown as Record<string, unknown> | null) ?? null;
}

/** Which queued records has the user acted on since they were queued?
 *  Returns event-namespaced keys ("E1:session:...") for the delivery gate. */
async function computeActedKeys(pending: QueueRow[]): Promise<Set<string>> {
  const acted = new Set<string>();
  const sessionRows = pending.filter((r) => ["E1", "E4", "E6"].includes(r.event_type));
  if (sessionRows.length > 0) {
    const sessionIds = [...new Set(sessionRows.map((r) => r.source_id))];
    const actedSessions = new Set<string>();
    const [handoffs, outcomes, repairs, plans, sessions] = await Promise.all([
      supabase.from("assessment_handoffs" as any).select("source_assessment_id").in("source_assessment_id", sessionIds),
      supabase.from("outcome_reports").select("session_id").in("session_id", sessionIds),
      supabase.from("repair_history").select("session_id").in("session_id", sessionIds),
      supabase.from("journey_plans" as any).select("assessment_id").in("assessment_id", sessionIds),
      supabase.from("diagnostic_sessions").select("id, status").in("id", sessionIds),
    ]);
    for (const h of (handoffs.data ?? []) as unknown as { source_assessment_id: string }[]) actedSessions.add(h.source_assessment_id);
    for (const o of (outcomes.data ?? []) as { session_id: string }[]) actedSessions.add(o.session_id);
    for (const r of (repairs.data ?? []) as { session_id: string }[]) actedSessions.add(r.session_id);
    for (const p of (plans.data ?? []) as unknown as { assessment_id: string }[]) actedSessions.add(p.assessment_id);
    for (const s of (sessions.data ?? []) as { id: string; status: string }[]) {
      // An abandoned-assessment nudge dies the moment the session finished.
      if (s.status === "outcome_reported" || s.status === "complete") actedSessions.add(s.id);
    }
    for (const row of sessionRows) {
      if (actedSessions.has(row.source_id)) acted.add(`${row.event_type}:${row.source_key}`);
    }
  }

  // E7 (repair_history only): the owner reporting the outcome IS the
  // check-in answer, so a queued check-in for that repair cancels.
  const e7Rows = pending.filter((r) => r.event_type === "E7" && r.source_table === "repair_history");
  for (const row of e7Rows) {
    const { data: rh } = await supabase
      .from("repair_history")
      .select("session_id")
      .eq("id", row.source_id)
      .maybeSingle();
    const sessionId = (rh as { session_id: string | null } | null)?.session_id;
    if (!sessionId) continue;
    const { data: oc } = await supabase
      .from("outcome_reports")
      .select("id")
      .eq("session_id", sessionId)
      .limit(1);
    if (oc && oc.length > 0) acted.add(`E7:${row.source_key}`);
  }

  // E5 mileage: the service got recorded after the alert was created.
  const e5Rows = pending.filter(
    (r) => r.event_type === "E5" && (r.payload as { subType?: string }).subType === "mileage",
  );
  for (const row of e5Rows) {
    const { data: alert } = await supabase
      .from("maintenance_alerts" as any)
      .select("vehicle_id, service_type, created_at")
      .eq("id", row.source_id)
      .maybeSingle();
    const a = alert as unknown as { vehicle_id: string; service_type: string; created_at: string } | null;
    if (!a) continue;
    const { data: recs } = await supabase
      .from("maintenance_records")
      .select("id")
      .eq("vehicle_id", a.vehicle_id)
      .eq("service_type", a.service_type)
      .gte("created_at", a.created_at)
      .limit(1);
    if (recs && recs.length > 0) acted.add(`E5:${row.source_key}`);
  }

  // E9: a fresh reading arrived after the staleness prompt was queued.
  const e9Rows = pending.filter((r) => r.event_type === "E9" && r.vehicle_id);
  for (const row of e9Rows) {
    const { data: readings } = await supabase
      .from("vehicle_mileage_readings" as any)
      .select("id")
      .eq("vehicle_id", row.vehicle_id as string)
      .eq("status", "current")
      .gte("created_at", row.created_at)
      .limit(1);
    if (readings && readings.length > 0) acted.add(`E9:${row.source_key}`);
  }

  return acted;
}

function actionPathFor(row: QueueRow): string {
  const fromPayload = (row.payload as { actionPath?: string }).actionPath;
  if (fromPayload) return fromPayload;
  if (row.vehicle_id) return `/garage/vehicles/${row.vehicle_id}`;
  if (row.category === "assessment_followups") return "/";
  return "/garage";
}

export function useProactiveMessage() {
  const [view, setView] = useState<ProactiveMessageView | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setView(null); return; }
      userIdRef.current = user.id;

      const [pendingRes, shownRes, prefsRow] = await Promise.all([
        supabase.from(MESSAGES_TABLE).select("*")
          .eq("user_id", user.id).eq("state", "pending")
          .order("eligible_at", { ascending: true }),
        supabase.from(MESSAGES_TABLE).select("event_type, payload, shown_at")
          .eq("user_id", user.id).eq("state", "shown")
          .gte("shown_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        fetchPrefsRow(user.id),
      ]);

      const pendingRows = (pendingRes.data ?? []) as unknown as QueueRow[];
      const shownHistory: ShownRecord[] = ((shownRes.data ?? []) as unknown as QueueRow[]).map((r) => ({
        eventType: r.event_type,
        payload: r.payload,
        shownAt: r.shown_at as string,
      }));
      const prefs = prefsFromRow(prefsRow);
      const actedKeys = await computeActedKeys(pendingRows);

      const pending: PendingMessage[] = pendingRows.map((r) => ({
        id: r.id,
        eventType: r.event_type,
        category: r.category,
        sourceKey: r.source_key,
        payload: r.payload,
        eligibleAt: r.eligible_at,
        createdAt: r.created_at,
      }));

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const decision = selectDelivery({
        pending, shownHistory, prefs, now: new Date(), timeZone, actedKeys,
      });

      const nowIso = new Date().toISOString();
      await Promise.all([
        ...decision.cancelIds.map((id) =>
          supabase.from(MESSAGES_TABLE)
            .update({ state: "cancelled", resolved_at: nowIso }).eq("id", id)),
        ...decision.expireIds.map((id) =>
          supabase.from(MESSAGES_TABLE)
            .update({ state: "expired", resolved_at: nowIso }).eq("id", id)),
      ]);

      if (!decision.show) { setView(null); return; }
      const row = pendingRows.find((r) => r.id === decision.show!.id) as QueueRow;
      setView({
        id: row.id,
        eventType: row.event_type,
        message: messageFor(row.event_type, row.payload),
        reason: reasonFor(row.event_type, row.payload),
        actionLabel: actionLabelFor(row.event_type, row.payload),
        actionPath: actionPathFor(row),
      });
    } catch (err) {
      console.warn("Failed to load proactive message:", err);
      setView(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markShown = useCallback(async (id: string) => {
    const nowIso = new Date().toISOString();
    await supabase.from(MESSAGES_TABLE)
      .update({ state: "shown", shown_at: nowIso, resolved_at: nowIso })
      .eq("id", id);
  }, []);

  const dismiss = useCallback(async (id: string) => {
    const nowIso = new Date().toISOString();
    await supabase.from(MESSAGES_TABLE)
      .update({ state: "dismissed", dismissed_at: nowIso, resolved_at: nowIso })
      .eq("id", id);
    setView(null);
  }, []);

  return { message: view, loading, markShown, dismiss };
}

export function useProactivePreferences() {
  const [prefs, setPrefs] = useState<ProactivePrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setPrefs(prefsFromRow(await fetchPrefsRow(user.id)));
    } catch (err) {
      console.warn("Failed to fetch proactive preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const update = useCallback(async (patch: Partial<ProactivePrefs>) => {
    setSaving(true);
    const prev = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const row = {
        user_id: user.id,
        master_enabled: next.masterEnabled,
        assessment_followups: next.assessmentFollowups,
        repair_updates: next.repairUpdates,
        post_repair_checkins: next.postRepairCheckins,
        service_prompts: next.servicePrompts,
        recall_alerts_enabled: next.recallAlertsEnabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      };
      const { error } = await supabase.from(PREFS_TABLE).upsert(row, { onConflict: "user_id" });
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to save proactive preferences:", err);
      setPrefs(prev);
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return { prefs, loading, saving, update };
}
