// Vercel Routing Middleware: per-door routing for the segmented site
// (segmentation Phase 1, 2026-11-19).
//
// WHY THIS FILE IS SELF-CONTAINED: the first two ships of this
// middleware failed invocation on Vercel (MIDDLEWARE_INVOCATION_FAILED)
// with a top-level import of ./src/lib/doorRouting in place. This file
// therefore carries the routing table inline and imports nothing.
// src/lib/doorRouting.ts re-exports doorAction from here so the unit
// tests (src/lib/doorRouting.test.ts) exercise the shipped code.
//
// Why middleware and not vercel.json rewrites: vercel.json rewrites
// are applied after the filesystem (per the vercel.json reference:
// "precedence is given to the filesystem prior to rewrites being
// applied"), so they cannot substitute a different robots.txt /
// llms.txt / sitemap.xml per host. Routing Middleware runs before
// the filesystem, which the per-door machine identity requires.
//
// Contract notes (Vercel Routing Middleware docs, read 2026-11-19):
// - With the middleware.ts file convention, the runtime config must
//   be set to "nodejs".
// - The handler must always return a Response. Pass-through is a
//   Response carrying the x-middleware-next header (what next() from
//   @vercel/functions returns); returning undefined is not valid.
// - Canary history: step 1 shipped with the matcher limited to a
//   probe path (/__door-canary) which proved all four return
//   primitives live while www stayed untouched; step 2 (this file)
//   widened the matcher to all paths and removed the probe branch.

export const config = { runtime: "nodejs", matcher: ["/(.*)"] };

export type DoorAction =
  | { type: "next" }
  | { type: "rewrite"; to: string }
  | { type: "redirect"; to: string; status: 301 | 302 }
  | { type: "notFound" };

export const DEVELOPERS_HOST = "developers.wrenchli.net";
export const OPS_HOST = "ops.wrenchli.net";

const NEXT: DoorAction = { type: "next" };
const NOT_FOUND: DoorAction = { type: "notFound" };

// Static files the ops door's single-page app needs in order to boot
// (bundles, icons, manifest). Everything else on the ops door is
// either an admin path or a 404: the console exists only there, and
// nothing else exists there at all. Note txt/xml are deliberately
// absent: the ops door must never serve the shared llms.txt or
// sitemap.xml (they are also refused explicitly in opsAction).
const OPS_STATIC_ASSET =
  /\.(?:png|jpe?g|svg|ico|webp|gif|css|js|map|woff2?|ttf|mp3|mp4|webm|json)$/;

function developersAction(pathname: string): DoorAction {
  // Per-door machine identity: this door's own agent/search files.
  if (pathname === "/robots.txt")
    return { type: "rewrite", to: "/door-files/developers/robots.txt" };
  if (pathname === "/llms.txt")
    return { type: "rewrite", to: "/door-files/developers/llms.txt" };
  if (pathname === "/sitemap.xml")
    return { type: "rewrite", to: "/door-files/developers/sitemap.xml" };
  // The admin console exists only on the ops door.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return NOT_FOUND;
  // Door-local canonicalization: the legacy /developers paths on this
  // host redirect to the door-relative URLs the door advertises.
  if (pathname === "/developers") return { type: "redirect", to: "/", status: 301 };
  if (pathname.startsWith("/developers/"))
    return {
      type: "redirect",
      to: pathname.slice("/developers".length),
      status: 301,
    };
  // Door home and guide serve their prerendered door variants, whose
  // canonicals point at this host (see scripts/prerender.mjs).
  if (pathname === "/")
    return { type: "rewrite", to: "/door-developers/index.html" };
  if (pathname === "/gpt-actions")
    return { type: "rewrite", to: "/door-developers/gpt-actions/index.html" };
  if (pathname === "/price-check")
    return { type: "rewrite", to: "/door-developers/price-check/index.html" };
  if (pathname === "/code-lookup")
    return { type: "rewrite", to: "/door-developers/code-lookup/index.html" };
  return NEXT;
}

function opsAction(pathname: string): DoorAction {
  if (pathname === "/robots.txt")
    return { type: "rewrite", to: "/door-files/ops/robots.txt" };
  if (pathname === "/") return { type: "redirect", to: "/admin", status: 302 };
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return NEXT;
  // AdminLogin's reset flow returns to /reset-password on this host.
  if (pathname === "/reset-password") return NEXT;
  if (pathname.startsWith("/assets/")) return NEXT;
  // The ops door has no sitemap and no llms.txt, ever.
  if (pathname === "/llms.txt" || pathname === "/sitemap.xml") return NOT_FOUND;
  if (OPS_STATIC_ASSET.test(pathname)) return NEXT;
  return NOT_FOUND;
}

export function doorAction(hostname: string, pathname: string): DoorAction {
  const host = hostname.toLowerCase();
  if (host === DEVELOPERS_HOST) return developersAction(pathname);
  if (host === OPS_HOST) return opsAction(pathname);
  return NEXT;
}

function next(): Response {
  return new Response(null, { headers: { "x-middleware-next": "1" } });
}

function rewrite(request: Request, to: string): Response {
  return new Response(null, {
    headers: { "x-middleware-rewrite": new URL(to, request.url).toString() },
  });
}

function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export default function middleware(request: Request): Response {
  const url = new URL(request.url);
  const action = doorAction(url.hostname, url.pathname);
  switch (action.type) {
    case "rewrite":
      return rewrite(request, action.to);
    case "redirect":
      return Response.redirect(new URL(action.to, request.url), action.status);
    case "notFound":
      return notFound();
    default:
      return next();
  }
}
