// Door host detection for the segmented site (segmentation Phase 1,
// 2026-11-19). One build serves every door; a small set of behaviors
// (the developer door's root-relative routes and its canonical URLs)
// depends on which host the app is running on. Hosts that are not a
// named door (www, the apex, preview deployments) always get the
// standard behavior, so nothing changes on the existing site.

export const DEVELOPERS_DOOR_HOST = "developers.wrenchli.net";
export const OPS_DOOR_HOST = "ops.wrenchli.net";

let ssrDoorHost: string | null = null;

/**
 * Build-time only: the SSR entry sets this while prerendering a door
 * variant (scripts/prerender.mjs renders the developer door's pages
 * with the door host so their canonicals are self-referential), and
 * clears it immediately after the render.
 */
export function setSsrDoorHost(host: string | null): void {
  ssrDoorHost = host;
}

export function currentDoorHost(): string | null {
  if (ssrDoorHost) return ssrDoorHost;
  if (typeof window !== "undefined") return window.location.hostname.toLowerCase();
  return null;
}

export function isDevelopersDoor(): boolean {
  return currentDoorHost() === DEVELOPERS_DOOR_HOST;
}

export function isOpsDoor(): boolean {
  return currentDoorHost() === OPS_DOOR_HOST;
}
