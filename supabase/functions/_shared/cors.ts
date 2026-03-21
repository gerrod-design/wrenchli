const ALLOWED_ORIGINS = [
  "https://wrenchli.net",
  "https://www.wrenchli.net",
  "https://wrenchli.lovable.app",
];

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

function isAllowedOrigin(origin: string): boolean {
  const allowed = [...ALLOWED_ORIGINS];
  const env = Deno.env.get("ENVIRONMENT");
  if (env === "development") allowed.push(...DEV_ORIGINS);

  if (allowed.includes(origin)) return true;
  // Allow Lovable preview/published domains
  if (origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")) return true;
  return false;
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const resolvedOrigin =
    origin && isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }
  return null;
}

export const corsHeaders = getCorsHeaders();
