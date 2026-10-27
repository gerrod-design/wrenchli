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
  "/for-dealers",
  "/faq",
  "/blog",
  "/about",
  "/privacy",
  "/warranty-guide",
  "/shops",
  "/partners/journey",
  "/subprocessors",
  "/developers",
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

export function getPrerenderPaths(): string[] {
  const blogPaths = getAllPosts().map((post) => `/blog/${post.slug}`);
  return [...STATIC_PRERENDER_PATHS, ...blogPaths, ...Object.keys(REDIRECT_PRERENDER_PATHS)];
}

/** Every URL in the generated sitemap: prerendered routes plus /garage. */
export function getSitemapPaths(): string[] {
  return [...getPrerenderPaths(), "/garage"];
}
