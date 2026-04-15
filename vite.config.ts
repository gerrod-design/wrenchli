import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerenderStatic from "vite-plugin-prerender-static";

const prerenderRoutes = [
  {
    path: "/",
    tags: {
      title: "Free Vehicle Symptom Assessment | Wrenchli — Michigan & Ohio",
      description: "Describe what's wrong with your car and get a structured report with likely causes, cost ranges, and questions to ask your shop. Free. No account required.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
  {
    path: "/for-shops",
    tags: {
      title: "Free Pilot Program for Independent Repair Shops | Wrenchli",
      description: "Join Wrenchli's free 90-day pilot. Your customers arrive pre-assessed — vehicle details, likely causes, and fair cost range before they walk in. No fees, no commission.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
  {
    path: "/blog",
    tags: {
      title: "Vehicle Repair Guides & Symptom Articles | Wrenchli",
      description: "Plain-language guides on common car symptoms, OBD codes, and DIY repairs — written for Michigan and Ohio vehicle owners.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
  {
    path: "/about",
    tags: {
      title: "About Wrenchli | Built to Fix Vehicle Repair in Michigan",
      description: "Wrenchli helps vehicle owners understand what is likely wrong before paying for a repair. Built in Michigan by Gerrod Parchmon.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
  {
    path: "/privacy",
    tags: {
      title: "Privacy Policy | Wrenchli",
      description: "How Wrenchli collects, uses, and protects your vehicle and assessment data.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
  {
    path: "/warranty-guide",
    tags: {
      title: "Manufacturer Warranty Guide | Wrenchli",
      description: "Understand what your vehicle manufacturer warranty covers before you pay for a repair out of pocket.",
      image: "https://wrenchli.net/og-default.png",
    },
  },
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && prerenderStatic({
      routes: prerenderRoutes,
      render: (route) => `<div id="root"></div>`,
      headTags: "",
    }),
  ].filter(Boolean),
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
