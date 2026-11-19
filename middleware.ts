// Vercel Routing Middleware: per-door edge routing for the segmented
// site (segmentation Phase 1, 2026-11-19). All decisions live in
// src/lib/doorRouting.ts (unit-tested); this adapter only executes
// them. Requests on any host that is not a named door pass through
// untouched, so www, the apex, and preview deployments behave exactly
// as before this ship.
import { doorAction } from "./src/lib/doorRouting";

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);
  const action = doorAction(url.hostname, url.pathname);
  switch (action.type) {
    case "rewrite":
      return new Response(null, {
        headers: {
          "x-middleware-rewrite": new URL(action.to, request.url).toString(),
        },
      });
    case "redirect":
      return Response.redirect(new URL(action.to, request.url), action.status);
    case "notFound":
      return new Response("Not Found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    default:
      return undefined;
  }
}
