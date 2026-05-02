import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const MAINTENANCE_MESSAGE =
  "The chat assistant is temporarily unavailable while we improve it. For symptom assessment, please use the assessment flow at /agent-diagnosis. We expect to have the chat back online within a few days. — The Wrenchli team";

Deno.serve((req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  return new Response(
    JSON.stringify({ message: MAINTENANCE_MESSAGE, maintenance: true }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
