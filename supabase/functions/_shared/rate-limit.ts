interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const RATE_LIMITS = {
  STRICT: { maxRequests: 10, windowSeconds: 60 },
  STANDARD: { maxRequests: 60, windowSeconds: 60 },
  GENEROUS: { maxRequests: 120, windowSeconds: 60 },
  ADMIN: { maxRequests: 30, windowSeconds: 60 },
} as const;

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.STANDARD,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: resetAt };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetAt,
  };
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
