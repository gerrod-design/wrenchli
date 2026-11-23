import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";
import { createKeysHandler, type KeyRecord } from "./handler.ts";

// Free key issuance for the Wrenchli agent surface (Decision 1).
//
// A key identifies the calling agent or developer (agent name, contact,
// tier) so MCP tool calls are attributable and rate-limited per caller.
// Issuance is instant and free, self-serve, with no account: the
// plaintext key is returned once and only its SHA-256 hash is stored
// (table mcp_api_keys). This endpoint deliberately holds no other
// capability: it cannot read keys back, list them, or change them.
async function insertKey(record: KeyRecord): Promise<{ ok: boolean }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await supabase.from("mcp_api_keys").insert(record);
  if (error) {
    console.error("mcp-keys: insert failed");
    return { ok: false };
  }
  return { ok: true };
}

const handleKeys = createKeysHandler({ insertKey });

serve(async (req) => {
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const res = await handleKeys(req);
  const headers = mergeSecurityHeaders(getCorsHeaders(req.headers.get("origin")));
  const merged = new Headers(res.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(res.body, { status: res.status, headers: merged });
});
