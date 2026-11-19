// Vercel Routing Middleware: per-door routing for the segmented site
// (segmentation Phase 1, 2026-11-19). All routing decisions live in
// src/lib/doorRouting.ts (unit-tested); this adapter only executes
// them. Requests on any host that is not a named door pass through
// untouched, so www, the apex, and preview deployments behave exactly
// as before this ship.
//
// Contract notes (Vercel Routing Middleware docs, read 2026-11-19
// after the first ship's MIDDLEWARE_INVOCATION_FAILED outage):
// - With the middleware.ts file convention, the runtime config must
//   be set to "nodejs".
// - The handler must always return a Response. Pass-through is a
//   Response carrying the x-middleware-next header (what next() from
//   @vercel/functions returns); returning undefined is not valid.
// - STEP 1 (canary): the matcher below limits invocation to the
//   single probe path /__door-canary, whose handler exercises all
//   four primitives. STEP 2 widens the matcher to all paths and
//   removes the probe branch. Do not widen without canary proof.
import { doorAction } from "./src/lib/doorRouting";

export const config = { runtime: "nodejs", matcher: ["/__door-canary"] };

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

  // TEMPORARY canary branch (removed in step 2): proves each return
  // primitive live without touching any real path.
  if (url.pathname === "/__door-canary") {
    const mode = url.searchParams.get("mode") ?? "rewrite";
    if (mode === "next") return next();
    if (mode === "redirect") return Response.redirect(new URL("/for-shops", request.url), 302);
    if (mode === "404") return notFound();
    return rewrite(request, "/llms.txt");
  }

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
