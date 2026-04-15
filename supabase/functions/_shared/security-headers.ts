export function getCspHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": getCspHeader(),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

export function mergeSecurityHeaders(
  customHeaders: Record<string, string> = {},
): Record<string, string> {
  return { ...getSecurityHeaders(), ...customHeaders };
}
