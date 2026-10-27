// Server entry for build-time prerendering (see scripts/prerender.mjs).
//
// Renders the real React app for a URL with react-dom/server inside a
// StaticRouter, using the same provider stack and the same AppLayout as
// the client entry (src/main.tsx) — minus the interactive-only chrome
// AppLayout skips when `ssr` is set. The client still boots with
// createRoot and replaces this HTML on load, so routing and behavior are
// unchanged; the prerendered markup exists so no-JS fetchers (search and
// AI crawlers) read the real page content.

import "./ssr-shims";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { VoiceChatProvider } from "@/contexts/VoiceChatContext";
import { AppLayout } from "./App";

export function render(url: string): { html: string; head: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const helmetContext: any = {};
  const queryClient = new QueryClient();
  const html = renderToString(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <LocationProvider>
                <VoiceChatProvider>
                  <StaticRouter location={url}>
                    <AppLayout ssr />
                  </StaticRouter>
                </VoiceChatProvider>
              </LocationProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
  const helmet = helmetContext.helmet;
  const head = helmet
    ? [
        helmet.title.toString(),
        helmet.meta.toString(),
        helmet.link.toString(),
        helmet.script.toString(),
      ].join("\n")
    : "";
  return { html, head };
}

export { getPrerenderPaths, getSitemapPaths, REDIRECT_PRERENDER_PATHS } from "@/lib/prerenderManifest";
export { jsonLdForRoute, SITE_BASE } from "@/lib/structuredData";
