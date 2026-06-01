// Browser-facing wrapper for auto-fix-wrenchli.
// Validates JWT + admin role, then forwards server-to-server with INTERNAL_SECRET.

import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAdmin, forwardToInternal } from "../_shared/admin-auth.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  const optResp = handleCorsOptions(req);
  if (optResp) return optResp;

  const gate = await requireAdmin(req, corsHeaders);
  if (!gate.ok) return gate.response;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  return forwardToInternal("auto-fix-wrenchli", body, corsHeaders);
});
