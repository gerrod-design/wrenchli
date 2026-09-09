import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getRateLimitIdentifier, getRateLimitHeaders, RATE_LIMITS } from "../_shared/rate-limit.ts";
import { mergeSecurityHeaders } from "../_shared/security-headers.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const securityHeaders = mergeSecurityHeaders(corsHeaders);

  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  const rateLimitId = getRateLimitIdentifier(req);
  const rateResult = await checkRateLimit(rateLimitId, RATE_LIMITS.STRICT);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({ valid: false, error: "Rate limit exceeded" }),
      { status: 429, headers: { ...securityHeaders, ...getRateLimitHeaders(RATE_LIMITS.STRICT.maxRequests, rateResult.remaining, rateResult.resetTime), "Content-Type": "application/json" } }
    );
  }

  try {
    let password: unknown = null;
    try {
      const raw = await req.text();
      if (raw) {
        const parsed = JSON.parse(raw);
        password = parsed?.password;
      }
    } catch (e) {
      console.error('Failed to parse request body', e);
    }

    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ valid: false, error: 'Missing password' }), {
        status: 200,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sitePassword = Deno.env.get('SITE_PASSWORD');
    if (!sitePassword) {
      console.error('SITE_PASSWORD secret not configured');
      return new Response(JSON.stringify({ valid: false, error: 'Not configured' }), {
        status: 500,
        headers: { ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const valid = password.trim() === sitePassword.trim();

    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      status: 400,
      headers: { ...securityHeaders, 'Content-Type': 'application/json' },
    });
  }
});
