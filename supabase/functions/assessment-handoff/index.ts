// supabase/functions/assessment-handoff/index.ts
//
// Continuity spec v1.1 SS2.1 / SS2.2 / SS5.2 — assessment handoff snapshots.
// create: signed-in -> owner-keyed row; signed-out -> one-time token, server
//         stores only the SHA-256 hash of the token.
// delete: retires a handoff row by token (idempotent; used by devices
//         pruning their oldest handoff, max 3 per device, client-side rule).
//
// This function is create/delete ONLY. No read path exists here; reads of
// handoff snapshots happen server-side inside the chat function.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  getRateLimitHeaders,
  RATE_LIMITS,
} from "../_shared/rate-limit.ts";

// Single configuration value, spec SS2.2 / SS9 Q1.
const HANDOFF_TTL_DAYS = 7;

const MAX_SNAPSHOT_BYTES = 24576;

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isNonEmptyTrimmedString(x: unknown, maxLen: number): x is string {
  return typeof x === "string" && x.trim().length >= 1 && x.trim().length <= maxLen;
}

function validateVehicle(input: unknown): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null;

  const year = input.year;
  if (!Number.isInteger(year) || (year as number) < 1900 || (year as number) > 2100) {
    return null;
  }

  if (!isNonEmptyTrimmedString(input.make, 80) || !isNonEmptyTrimmedString(input.model, 80)) {
    return null;
  }

  const rebuilt: Record<string, unknown> = {
    year,
    make: (input.make as string).trim(),
    model: (input.model as string).trim(),
  };

  if (input.mileage !== undefined) {
    if (!isFiniteNumber(input.mileage) || input.mileage < 0 || input.mileage > 2000000) {
      return null;
    }
    rebuilt.mileage = input.mileage;
  }

  if (input.trim !== undefined) {
    if (typeof input.trim !== "string" || input.trim.length > 80) return null;
    rebuilt.trim = input.trim;
  }

  if (input.vin !== undefined) {
    if (typeof input.vin !== "string" || input.vin.length > 17) return null;
    rebuilt.vin = input.vin;
  }

  return rebuilt;
}

function validatePossibleCauses(input: unknown): Record<string, unknown>[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 10) return null;

  const out: Record<string, unknown>[] = [];
  for (const item of input) {
    if (!isPlainObject(item)) return null;
    if (!isNonEmptyTrimmedString(item.name, 200)) return null;

    const cause: Record<string, unknown> = { name: (item.name as string).trim() };

    if (item.probability !== undefined) {
      if (isFiniteNumber(item.probability) && item.probability >= 0 && item.probability <= 1) {
        cause.probability = item.probability;
      }
    }
    if (item.estimated_cost_low !== undefined) {
      if (isFiniteNumber(item.estimated_cost_low) && item.estimated_cost_low >= 0) {
        cause.estimated_cost_low = item.estimated_cost_low;
      }
    }
    if (item.estimated_cost_high !== undefined) {
      if (isFiniteNumber(item.estimated_cost_high) && item.estimated_cost_high >= 0) {
        cause.estimated_cost_high = item.estimated_cost_high;
      }
    }

    out.push(cause);
  }
  return out;
}

function validateCostRange(input: unknown): Record<string, unknown> | null | undefined {
  if (input === null || input === undefined) return null;
  if (!isPlainObject(input)) return undefined; // signals invalid
  const { low, high } = input;
  if (!isFiniteNumber(low) || low < 0) return undefined;
  if (!isFiniteNumber(high) || high < 0) return undefined;
  if (high < low) return undefined;
  return { low, high };
}

function validateAssessment(input: unknown): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null;
  if (!isNonEmptyTrimmedString(input.explanation, 4000)) return null;

  const rebuilt: Record<string, unknown> = { explanation: (input.explanation as string).trim() };

  if (input.confidence !== undefined) {
    if (typeof input.confidence !== "string" || input.confidence.length > 20) return null;
    rebuilt.confidence = input.confidence;
  }
  if (input.urgency !== undefined) {
    if (typeof input.urgency !== "string" || input.urgency.length > 20) return null;
    rebuilt.urgency = input.urgency;
  }

  const causes = validatePossibleCauses(input.possible_causes);
  if (causes === null) return null;
  if (causes.length > 0) rebuilt.possible_causes = causes;

  if ("cost_range" in input) {
    const costRange = validateCostRange(input.cost_range);
    if (costRange === undefined) return null;
    rebuilt.cost_range = costRange;
  }

  return rebuilt;
}

function validateSnapshot(input: unknown): Record<string, unknown> | null {
  if (!isPlainObject(input)) return null;

  const vehicle = validateVehicle(input.vehicle);
  if (!vehicle) return null;

  if (!isPlainObject(input.symptoms) || Array.isArray(input.symptoms)) return null;
  const symptoms = input.symptoms;

  const assessment = validateAssessment(input.assessment);
  if (!assessment) return null;

  let completedAt: string;
  if (input.completed_at !== undefined) {
    if (typeof input.completed_at !== "string" || Number.isNaN(Date.parse(input.completed_at))) {
      return null;
    }
    completedAt = input.completed_at;
  } else {
    completedAt = new Date().toISOString();
  }

  const rebuilt = {
    vehicle,
    symptoms,
    assessment,
    completed_at: completedAt,
  };

  if (JSON.stringify(rebuilt).length > MAX_SNAPSHOT_BYTES) return null;

  return rebuilt;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function resolveOwnerUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const presented = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let ownerUserId: string | null = null;
  if (presented) {
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data, error } = await anonClient.auth.getUser(presented);
    if (!error && data?.user) {
      ownerUserId = data.user.id;
    }
  }

  return ownerUserId;
}

serve(async (req: Request) => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const baseHeaders = mergeSecurityHeaders(corsHeaders);

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, baseHeaders);
  }

  const rateLimitResult = await checkRateLimit(
    getRateLimitIdentifier(req),
    RATE_LIMITS.STANDARD,
    "assessment-handoff"
  );
  const rateLimitHeaders = getRateLimitHeaders(
    RATE_LIMITS.STANDARD.maxRequests,
    rateLimitResult.remaining,
    rateLimitResult.resetTime
  );
  const headers = { ...baseHeaders, ...rateLimitHeaders };

  if (!rateLimitResult.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded. Please try again shortly." },
      429,
      headers
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, headers);
  }

  if (!isPlainObject(body) || (body.action !== "create" && body.action !== "delete" && body.action !== "link")) {
    return jsonResponse({ error: "Unknown action" }, 400, headers);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (body.action === "delete") {
    const token = body.token;
    if (typeof token !== "string" || token.length < 10 || token.length > 200) {
      return jsonResponse({ error: "Invalid token" }, 400, headers);
    }

    const tokenHash = await sha256Hex(token);
    const { data, error } = await serviceClient
      .from("assessment_handoffs")
      .delete()
      .eq("token_hash", tokenHash)
      .select("id");

    if (error) {
      console.error(error.message);
      return jsonResponse({ error: "Could not delete the assessment handoff" }, 500, headers);
    }

    return jsonResponse({ deleted: data?.length ?? 0 }, 200, headers);
  }

  // R-70 Tier 2 claim step: the client proposes candidate handoffs from its own
  // exact-match rule; this function verifies ownership of both sides server-side
  // before linking.
  if (body.action === "link") {
    const linkUserVehicleId = (body as Record<string, unknown>).userVehicleId;
    const linkHandoffIds = (body as Record<string, unknown>).handoffIds;

    const linkUserVehicleIdValid =
      typeof linkUserVehicleId === "string" && linkUserVehicleId.length >= 1 && linkUserVehicleId.length <= 64;
    const linkHandoffIdsValid =
      Array.isArray(linkHandoffIds) &&
      linkHandoffIds.length >= 1 &&
      linkHandoffIds.length <= 50 &&
      linkHandoffIds.every((id) => typeof id === "string" && id.length >= 1 && id.length <= 64);

    if (!linkUserVehicleIdValid || !linkHandoffIdsValid) {
      return jsonResponse({ error: "Invalid link request" }, 400, headers);
    }

    const linkOwnerUserId = await resolveOwnerUserId(req);
    if (!linkOwnerUserId) {
      return jsonResponse({ error: "Sign-in required" }, 401, headers);
    }

    const { data: linkVehicle, error: linkVehicleError } = await serviceClient
      .from("user_vehicles")
      .select("id")
      .eq("id", linkUserVehicleId as string)
      .eq("user_id", linkOwnerUserId)
      .maybeSingle();

    if (linkVehicleError) {
      console.error(linkVehicleError.message);
      return jsonResponse({ error: "Could not link assessments" }, 500, headers);
    }

    if (!linkVehicle) {
      return jsonResponse({ error: "Vehicle not found for this account" }, 403, headers);
    }

    const { data: linkUpdated, error: linkUpdateError } = await serviceClient
      .from("assessment_handoffs")
      .update({ user_vehicle_id: linkUserVehicleId as string })
      .in("id", linkHandoffIds as string[])
      .eq("owner_user_id", linkOwnerUserId)
      .is("user_vehicle_id", null)
      .select("id");

    if (linkUpdateError) {
      console.error(linkUpdateError.message);
      return jsonResponse({ error: "Could not link assessments" }, 500, headers);
    }

    return jsonResponse({ linked: linkUpdated?.length ?? 0 }, 200, headers);
  }

  // action === "create"
  const rebuilt = validateSnapshot(body.snapshot);
  if (!rebuilt) {
    return jsonResponse({ error: "Invalid snapshot" }, 400, headers);
  }

  let sourceAssessmentId: string | null = null;
  if (body.sourceAssessmentId !== undefined) {
    if (typeof body.sourceAssessmentId === "string" && body.sourceAssessmentId.length <= 64) {
      sourceAssessmentId = body.sourceAssessmentId;
    }
  }

  const ownerUserId = await resolveOwnerUserId(req);

  // The stamp is best-effort metadata; any doubt (not owned, VIN conflict)
  // saves the handoff unlinked rather than failing the save.
  let stampedVehicleId: string | null = null;
  const requestedUserVehicleId = (body as Record<string, unknown>).userVehicleId;
  if (
    ownerUserId &&
    typeof requestedUserVehicleId === "string" &&
    requestedUserVehicleId.length >= 1 &&
    requestedUserVehicleId.length <= 64
  ) {
    const { data: stampVehicle, error: stampVehicleError } = await serviceClient
      .from("user_vehicles")
      .select("id, vin")
      .eq("id", requestedUserVehicleId)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (!stampVehicleError && stampVehicle) {
      const snapshotVehicle = isPlainObject(rebuilt.vehicle) ? rebuilt.vehicle : null;
      const snapshotVin =
        snapshotVehicle && typeof snapshotVehicle.vin === "string"
          ? snapshotVehicle.vin.trim().toUpperCase()
          : "";
      const vehicleVin = typeof stampVehicle.vin === "string" ? stampVehicle.vin.trim().toUpperCase() : "";
      const vinConflict = snapshotVin !== "" && vehicleVin !== "" && snapshotVin !== vehicleVin;

      if (!vinConflict) {
        stampedVehicleId = stampVehicle.id;
      }
    }
  }

  if (ownerUserId) {
    const { data, error } = await serviceClient
      .from("assessment_handoffs")
      .insert({
        owner_user_id: ownerUserId,
        snapshot: rebuilt,
        source_assessment_id: sourceAssessmentId,
        user_vehicle_id: stampedVehicleId,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error?.message ?? "insert returned no row");
      return jsonResponse({ error: "Could not save the assessment handoff" }, 500, headers);
    }

    return jsonResponse({ id: data.id, kind: "owned", userVehicleLinked: stampedVehicleId !== null }, 200, headers);
  }

  // Token path — signed-out caller.
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = toBase64Url(tokenBytes);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + HANDOFF_TTL_DAYS * 86400000).toISOString();

  const { data, error } = await serviceClient
    .from("assessment_handoffs")
    .insert({
      token_hash: tokenHash,
      snapshot: rebuilt,
      source_assessment_id: sourceAssessmentId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(error?.message ?? "insert returned no row");
    return jsonResponse({ error: "Could not save the assessment handoff" }, 500, headers);
  }

  return jsonResponse(
    { id: data.id, kind: "token", token, expiresAt },
    200,
    headers
  );
});
