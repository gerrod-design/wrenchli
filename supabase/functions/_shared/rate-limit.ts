import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export const RATE_LIMITS = {
  STRICT: { maxRequests: 10, windowSeconds: 60 },
  STANDARD: { maxRequests: 60, windowSeconds: 60 },
  GENEROUS: { maxRequests: 120, windowSeconds: 60 },
  ADMIN: { maxRequests: 30, windowSeconds: 60 },
} as const;

/**
 * Database-backed rate limiter using edge_rate_limits table.
 * Falls back to allowing the request if the DB check fails.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.STANDARD,
  endpoint = "default",
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + config.windowSeconds * 1000;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const windowStart = new Date(now - config.windowSeconds * 1000).toISOString();

    // Count recent requests
    const { count, error: countError } = await supabase
      .from("edge_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("requested_at", windowStart);

    if (countError) {
      console.error("Rate limit count error:", countError);
      return { allowed: true, remaining: config.maxRequests - 1, resetTime };
    }

    const currentCount = count ?? 0;

    if (currentCount >= config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime };
    }

    // Record this request (fire and forget)
    supabase
      .from("edge_rate_limits")
      .insert({ identifier, endpoint, requested_at: new Date().toISOString() })
      .then(() => {});

    // Probabilistic cleanup (1 in 50 requests)
    if (Math.random() < 0.02) {
      supabase.rpc("cleanup_edge_rate_limits").then(() => {});
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetTime,
    };
  } catch (err) {
    console.error("Rate limit error:", err);
    // Fail open to avoid blocking legitimate traffic
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }
}

export function getRateLimitIdentifier(
  req: Request,
  userId?: string | null,
): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  return `ip:${ip}`;
}

export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
  };
}
