// Build-time prerender + sitemap manifest.
//
// The route lists are derived from the app's real public routes and the
// blog content source (src/lib/blog.ts reads src/content/blog/*.md), not
// maintained by hand: adding a markdown file to src/content/blog adds
// both a prerendered page and a sitemap URL on the next build.

import { getAllPosts } from "@/lib/blog";

/** Public content routes rendered to static HTML at build time. */
export const STATIC_PRERENDER_PATHS = [
  "/",
  "/for-shops",
  "/for-shops/talk",
  "/for-dealers",
  "/faq",
  "/blog",
  "/about",
  "/privacy",
  "/warranty-guide",
  "/shops",
  "/nominate",
  "/partners/journey",
  "/subprocessors",
  "/developers",
  "/diy",
  // /garage is the signed-in account home. Its SSR output is the real
  // signed-out state (a sign-in prompt describing the Garage), which is
  // the honest raw HTML for the route: no-JS fetchers must not receive
  // the homepage shell for it. The client still boots over it exactly
  // as before, so signed-in behavior is unchanged.
  "/garage",
] as const;

/**
 * Routes whose app behavior is a client-side redirect. The prerendered
 * file carries the destination page's rendered content (its canonical
 * points at the destination), so no-JS fetchers land on real content
 * while the SPA keeps redirecting exactly as before.
 */
export const REDIRECT_PRERENDER_PATHS: Record<string, string> = {
  "/for-shops/onboarding": "/for-shops",
};

/**
 * Paths with no content page of their own in the app today. /partners
 * has no route (the partner page is /partners/journey, prerendered
 * above) and /for-shops/talk's page arrives with the shop inbound
 * build, so the SPA currently answers both with its 404 page.
 * Prerendering that real 404 output keeps no-JS fetchers from
 * receiving the homepage shell for these URLs, without changing what
 * browsers see. Deliberately excluded from the sitemap: a 404 URL is
 * not a page to advertise. When the inbound build ships the talk page,
 * move /for-shops/talk into STATIC_PRERENDER_PATHS.
 */
export const NOTFOUND_PRERENDER_PATHS = ["/partners", "/for-shops/talk"] as const;

const blogPrerenderPaths = () => getAllPosts().map((post) => `/blog/${post.slug}`);

export function getPrerenderPaths(): string[] {
  return [
    ...STATIC_PRERENDER_PATHS,
    ...blogPrerenderPaths(),
    ...Object.keys(REDIRECT_PRERENDER_PATHS),
    ...NOTFOUND_PRERENDER_PATHS,
  ];
}

/** Every URL in the generated sitemap: the public prerendered routes. */
export function getSitemapPaths(): string[] {
  return [
    ...STATIC_PRERENDER_PATHS,
    ...blogPrerenderPaths(),
    ...Object.keys(REDIRECT_PRERENDER_PATHS),
  ];
}
