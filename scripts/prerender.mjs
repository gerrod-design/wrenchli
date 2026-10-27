// Build-time prerender step (runs as part of `npm run build`).
//
// Renders each public route with the app's own React components via the
// SSR bundle (src/entry-server.tsx), merges the page's helmet head tags
// into the client shell template, embeds the route's JSON-LD, and writes
// one static HTML file per route under dist/. Also generates
// dist/sitemap.xml from the app's route + blog manifest.
//
// Production serves these files statically and falls back to the SPA
// shell for everything else, so app routes (Garage, assessment flow)
// behave exactly as before while public content routes carry their real
// content in raw HTML.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const { render, getPrerenderPaths, getSitemapPaths, REDIRECT_PRERENDER_PATHS, jsonLdForRoute, SITE_BASE } =
  await import(pathToFileURL(ssrEntry).href);

const template = fs.readFileSync(path.join(dist, "index.html"), "utf-8");
if (!template.includes('<div id="root"></div>')) {
  throw new Error("prerender: dist/index.html has no empty #root to fill");
}

/** Replace same-key head tags in the template with the page's helmet tags; append the rest. */
function applyHead(tpl, headHtml) {
  let out = tpl;
  const tags =
    headHtml.match(/<title[^>]*>[\s\S]*?<\/title>|<meta[^>]*>|<link[^>]*>|<script[^>]*>[\s\S]*?<\/script>/g) || [];
  const extra = [];
  for (const tag of tags) {
    let replaced = false;
    if (tag.startsWith("<title")) {
      if (/<title>[\s\S]*?<\/title>/.test(out)) {
        out = out.replace(/<title>[\s\S]*?<\/title>/, tag);
        replaced = true;
      }
    } else if (tag.startsWith("<meta")) {
      const key = tag.match(/(?:name|property)="([^"]+)"/);
      if (key) {
        const re = new RegExp(`<meta[^>]*(?:name|property)="${key[1].replace(/[:]/g, "\\:")}"[^>]*>`);
        if (re.test(out)) {
          out = out.replace(re, tag);
          replaced = true;
        }
      }
    } else if (tag.startsWith("<link") && tag.includes('rel="canonical"')) {
      const re = /<link[^>]*rel="canonical"[^>]*>/;
      if (re.test(out)) {
        out = out.replace(re, tag);
        replaced = true;
      }
    }
    if (!replaced) extra.push(tag);
  }
  if (extra.length) out = out.replace("</head>", `${extra.join("\n")}\n</head>`);
  return out;
}

function jsonLdScripts(routePath) {
  return jsonLdForRoute(routePath)
    .map(
      (obj) =>
        `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`
    )
    .join("\n");
}

const written = [];
for (const routePath of getPrerenderPaths()) {
  const renderUrl = REDIRECT_PRERENDER_PATHS[routePath] ?? routePath;
  const { html, head } = render(renderUrl);
  if (!html || html.length < 200) {
    throw new Error(`prerender: ${routePath} rendered suspiciously little HTML (${html?.length ?? 0} bytes)`);
  }
  let page = applyHead(template, head);
  const ld = jsonLdScripts(renderUrl);
  if (ld) page = page.replace("</head>", `${ld}\n</head>`);
  page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  const rel = routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page, "utf-8");
  written.push({ route: routePath, file: rel, bytes: Buffer.byteLength(page, "utf8") });
  console.log(`[prerender] ${routePath} -> ${rel} (${written[written.length - 1].bytes} bytes)`);
}

// Sitemap, generated from the same manifest (routes + blog content source).
const lastmod = new Date().toISOString().slice(0, 10);
const urls = getSitemapPaths()
  .map((p) => `  <url><loc>${SITE_BASE}${p === "/" ? "/" : p}</loc><lastmod>${lastmod}</lastmod></url>`)
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap, "utf-8");
console.log(`[prerender] sitemap.xml -> ${getSitemapPaths().length} URLs`);
