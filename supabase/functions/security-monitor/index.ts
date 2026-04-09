// supabase/functions/security-monitor/index.ts
// ============================================================
// WRENCHLI — Edge Function: Security Monitor
// Runs every 6 hours. Checks credential integrity, sync failures,
// and tracking gaps. Writes to security_audit_log & security_alerts.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuditEntry {
  check_name: string;
  status: "pass" | "fail" | "warning";
  details: Record<string, unknown>;
  checked_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const checkedAt = now.toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    const auditEntries: AuditEntry[] = [];
    const alertEntries: { check_name: string; severity: string; details: Record<string, unknown> }[] = [];

    // ── CHECK 1: Credential Integrity ────────────────────
    {
      const { data: integrations, error } = await supabase
        .from("shop_integrations")
        .select("id, shop_id, api_key_encrypted, api_key_iv, is_active")
        .eq("is_active", true);

      if (error) throw error;

      const total = integrations?.length ?? 0;
      const missingCreds = (integrations ?? []).filter(
        (r) => !r.api_key_encrypted || !r.api_key_iv
      );

      const status = missingCreds.length === 0 ? "pass" : "fail";

      // Never expose actual credential values — only counts and IDs
      const entry: AuditEntry = {
        check_name: "credential_integrity",
        status,
        details: {
          total_active_integrations: total,
          missing_credentials_count: missingCreds.length,
          affected_integration_ids: missingCreds.map((r) => r.id),
        },
        checked_at: checkedAt,
      };
      auditEntries.push(entry);

      if (status === "fail") {
        alertEntries.push({
          check_name: "credential_integrity",
          severity: "high",
          details: {
            message: `${missingCreds.length} active integration(s) missing encrypted credentials or IV`,
            affected_count: missingCreds.length,
          },
        });
      }
    }

    // ── CHECK 2: Sync Failures (last 6 hours) ────────────
    {
      const { data: failedSyncs, error } = await supabase
        .from("integration_sync_log")
        .select("id, shop_integration_id, status, error_message")
        .eq("status", "failed")
        .gte("attempted_at", sixHoursAgo);

      if (error) throw error;

      const failCount = failedSyncs?.length ?? 0;

      // Count by shop_integration_id
      const byIntegration = new Map<string, number>();
      for (const row of failedSyncs ?? []) {
        const key = row.shop_integration_id;
        byIntegration.set(key, (byIntegration.get(key) ?? 0) + 1);
      }

      const status = failCount === 0 ? "pass" : failCount <= 3 ? "warning" : "fail";

      const entry: AuditEntry = {
        check_name: "sync_failures",
        status,
        details: {
          total_failures_last_6h: failCount,
          failures_by_integration: Object.fromEntries(byIntegration),
          // Redact error_message to avoid leaking PII — only include count
        },
        checked_at: checkedAt,
      };
      auditEntries.push(entry);

      if (status === "fail") {
        alertEntries.push({
          check_name: "sync_failures",
          severity: "medium",
          details: {
            message: `${failCount} failed API sync(s) in the last 6 hours`,
            integrations_affected: byIntegration.size,
          },
        });
      }
    }

    // ── CHECK 3: Ad Click Tracking Gaps ──────────────────
    {
      const { data: gapRows, error } = await supabase
        .from("ad_click_events")
        .select("id, created_at, click_type")
        .is("session_id", null)
        .eq("destination", "amazon");

      if (error) throw error;

      const gapCount = gapRows?.length ?? 0;
      const status = gapCount === 0 ? "pass" : "warning";

      const entry: AuditEntry = {
        check_name: "ad_tracking_gaps",
        status,
        details: {
          amazon_clicks_without_session: gapCount,
          // No PII — just counts and anonymized click types
          sample_click_types: [...new Set((gapRows ?? []).slice(0, 5).map((r) => r.click_type))],
        },
        checked_at: checkedAt,
      };
      auditEntries.push(entry);

      if (gapCount > 10) {
        alertEntries.push({
          check_name: "ad_tracking_gaps",
          severity: "low",
          details: {
            message: `${gapCount} Amazon ad clicks missing session_id — possible tracking gap`,
          },
        });
      }
    }

    // ── Write audit log ──────────────────────────────────
    if (auditEntries.length > 0) {
      const { error: auditError } = await supabase
        .from("security_audit_log")
        .insert(auditEntries);
      if (auditError) throw auditError;
    }

    // ── Write alerts ─────────────────────────────────────
    if (alertEntries.length > 0) {
      const { error: alertError } = await supabase
        .from("security_alerts")
        .insert(alertEntries);
      if (alertError) throw alertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        checks_run: auditEntries.length,
        alerts_generated: alertEntries.length,
        results: auditEntries.map((e) => ({
          check: e.check_name,
          status: e.status,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("security-monitor error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
