// Per-host edge routing for the segmented site (segmentation Phase 1,
// 2026-11-19). Pure mapping from (hostname, pathname) to an edge action;
// middleware.ts at the project root is the thin adapter that executes
// it, and doorRouting.test.ts pins the table.
//
// Why middleware and not vercel.json rewrites: vercel.json rewrites are
// applied after the filesystem, so they cannot substitute a different
// robots.txt / llms.txt / sitemap.xml per host (those files exist).
// Routing Middleware runs before the filesystem, which is what the
// per-door machine identity requires. Hosts that are not a named door
// always return "next": www, the apex, and preview deployments behave
// exactly as before this ship.

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
// nothing else exists there at all.
const OPS_STATIC_ASSET =
  /\.(?:png|jpe?g|svg|ico|webp|gif|css|js|map|woff2?|ttf|mp3|mp4|webm|json|txt)$/;

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
  if (OPS_STATIC_ASSET.test(pathname)) return NEXT;
  return NOT_FOUND;
}

export function doorAction(hostname: string, pathname: string): DoorAction {
  const host = hostname.toLowerCase();
  if (host === DEVELOPERS_HOST) return developersAction(pathname);
  if (host === OPS_HOST) return opsAction(pathname);
  return NEXT;
}
