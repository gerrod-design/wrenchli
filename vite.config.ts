import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

/** Static content to bake into prerendered HTML for each route. */
const prerenderRoutes: {
  path: string;
  title: string;
  description: string;
  /** visible text blocks crawlers will see inside #root */
  content: string;
}[] = [
  {
    path: "/",
    title: "Free Vehicle Symptom Assessment | Wrenchli — Michigan & Ohio",
    description:
      "Describe what's wrong with your car and get a structured report with likely causes, cost ranges, and questions to ask your shop. Free. No account required.",
    content: `
      <h1>Vehicle Repair Finally Fixed</h1>
      <p>Affordable vehicle repair — transparent pricing, trusted shops.</p>
      <p>Assessment always free · DIY tutorials · Shop quotes · No account required</p>
      <a href="/#quote">Get Your Free Diagnosis</a>
      <p>This is a symptom assessment, not a professional inspection. Use it to ask better questions at the shop — not to skip one.</p>
      <h2>Check your vehicle for open safety recalls</h2>
      <p>Enter your VIN — free, instant, no account required.</p>
      <h2>Transparent Pricing</h2><p>See real prices upfront. No surprises, no hidden fees.</p>
      <h2>Instant Quotes</h2><p>Compare multiple shops in seconds. Book in minutes.</p>
      <h2>Flexible Financing</h2><p>Payment plans that fit your budget. All credit types welcome.</p>
    `,
  },
  {
    path: "/for-shops",
    title: "Free Pilot Program for Independent Repair Shops | Wrenchli",
    description:
      "Join Wrenchli's free 90-day pilot. Your customers arrive pre-assessed — vehicle details, likely causes, and fair cost range before they walk in. No fees, no commission.",
    content: `
      <h1>Customers Arrive Pre-Assessed</h1>
      <p>Vehicle details, likely causes, and a fair cost range — before they walk in. Free 90-day pilot for independent shops.</p>
      <a href="/pilot">Join the Free Pilot</a>
    `,
  },
  {
    path: "/blog",
    title: "Vehicle Repair Guides & Symptom Articles | Wrenchli",
    description:
      "Plain-language guides on common car symptoms, OBD codes, and DIY repairs — written for Michigan and Ohio vehicle owners.",
    content: `
      <h1>Wrenchli Blog</h1>
      <p>Repair tips, diagnostic guides, and industry insights.</p>
    `,
  },
  {
    path: "/about",
    title: "About Wrenchli | Built to Fix Vehicle Repair in Michigan",
    description:
      "Wrenchli helps vehicle owners understand what is likely wrong before paying for a repair. Built in Michigan by Gerrod Parchmon.",
    content: `
      <h1>About Wrenchli</h1>
      <p>Wrenchli helps vehicle owners understand what is likely wrong before paying for a repair. Built in Michigan by Gerrod Parchmon.</p>
    `,
  },
  {
    path: "/privacy",
    title: "Privacy Policy | Wrenchli",
    description:
      "How Wrenchli collects, uses, and protects your vehicle and assessment data.",
    content: `
      <h1>Privacy Policy</h1>
      <p>How Wrenchli collects, uses, and protects your vehicle and assessment data.</p>
    `,
  },
  {
    path: "/warranty-guide",
    title: "Manufacturer Warranty Guide | Wrenchli",
    description:
      "Understand what your vehicle manufacturer warranty covers before you pay for a repair out of pocket.",
    content: `
      <h1>Manufacturer Warranty Guide</h1>
      <p>Understand what your vehicle manufacturer warranty covers before you pay for a repair out of pocket.</p>
    `,
  },
];

/**
 * Custom prerender plugin: after Vite build, creates route-specific
 * HTML files with real text content baked in for crawlers / link previews.
 * React hydrates over this content on the client.
 */
function prerenderPlugin(): Plugin {
  return {
    name: "wrenchli-prerender",
    apply: "build",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(indexPath)) return;

      const baseHtml = fs.readFileSync(indexPath, "utf-8");

      for (const route of prerenderRoutes) {
        // Build per-route HTML by replacing title, meta description, and #root content
        let html = baseHtml;

        // Replace <title>
        html = html.replace(
          /<title>[^<]*<\/title>/,
          `<title>${route.title}</title>`
        );

        // Replace meta description
        html = html.replace(
          /<meta name="description" content="[^"]*"\s*\/?>/,
          `<meta name="description" content="${route.description}" />`
        );

        // Replace og:title and og:description
        html = html.replace(
          /<meta property="og:title" content="[^"]*"\s*\/?>/,
          `<meta property="og:title" content="${route.title}" />`
        );
        html = html.replace(
          /<meta property="og:description" content="[^"]*"\s*\/?>/,
          `<meta property="og:description" content="${route.description}" />`
        );

        // Inject content into #root so crawlers see real text
        html = html.replace(
          '<div id="root"></div>',
          `<div id="root">${route.content.trim()}</div>`
        );

        // Write the file
        const routePath = route.path === "/" ? "/index.html" : `${route.path}/index.html`;
        const filePath = path.join(dist, routePath);
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, html, "utf-8");
        console.log(`[prerender] ${route.path} → ${path.relative(dist, filePath)}`);
      }
    },
  };
}

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
    mode === "production" && prerenderPlugin(),
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
