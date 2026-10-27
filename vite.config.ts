import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Prerendering of public routes happens after the Vite build, in
// scripts/prerender.mjs, which server-renders the real React pages via
// src/entry-server.tsx (true SSR output). This config previously carried
// a plugin that baked hand-written stub text into a few route shells;
// the stubs drifted from the real pages (and one carried a city-specific
// claim the live copy does not make), so they were removed in favor of
// rendering the actual pages.

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  ssr: {
    // The prerender bundle runs in Node as ESM; react-helmet-async ships
    // CommonJS whose named exports Node cannot detect, so it must be
    // bundled rather than externalized.
    noExternal: ["react-helmet-async"],
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Leaflet reads `window` at import time and cannot load in Node.
      // The SSR (prerender) build swaps in an inert stub; the client
      // build always bundles the real package.
      ...(isSsrBuild
        ? [
            {
              find: /^leaflet$/,
              replacement: path.resolve(__dirname, "./src/ssr/leaflet-stub.ts"),
            },
          ]
        : []),
    ],
  },
}));
