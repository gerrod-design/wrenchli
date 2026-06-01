// Shared helper for browser-facing admin wrapper functions.
// Validates the caller's JWT and checks has_role(uid, 'admin').
// Returns the userId on success, or a Response (401/403) on failure.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface AdminAuthSuccess {
  ok: true;
  userId: string;
}

export interface AdminAuthFailure {
  ok: false;
  response: Response;
}

export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AdminAuthSuccess | AdminAuthFailure> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate the JWT
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = claimsData.claims.sub as string;

  // Check admin role via service-role client (bypasses RLS, uses security-definer fn)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: hasRole, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (roleError || !hasRole) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden — admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, userId };
}

/**
 * Forward a validated admin request to a locked-down internal Edge Function
 * by attaching the x-internal-secret header. Returns the upstream Response
 * (with CORS headers merged in).
 */
export async function forwardToInternal(
  functionName: string,
  body: unknown,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const internalSecret = Deno.env.get("INTERNAL_SECRET");

  if (!internalSecret) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured: INTERNAL_SECRET missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const upstream = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      "x-internal-secret": internalSecret,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      ...corsHeaders,
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
