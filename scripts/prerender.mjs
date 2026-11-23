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
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const {
  render,
  getPrerenderPaths,
  getSitemapPaths,
  REDIRECT_PRERENDER_PATHS,
  SITEMAP_SOURCE_FILES,
  getAllPosts,
  jsonLdForRoute,
  SITE_BASE,
} = await import(pathToFileURL(ssrEntry).href);

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
    // An unset helmet title stringifies to an empty <title data-rh="true">
    // (emitted whenever a page renders Helmet children, e.g. JSON-LD
    // scripts, without declaring a title). Never let it blank out the
    // template's title (front-door fix 1).
    if (tag.startsWith("<title") && !tag.replace(/<[^>]*>/g, "").trim()) continue;
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

// /design-preview static shell with a noindex meta (leftover from the
// Nov 14, 2026 ships, carried at the Brief 5 gate). The SPA redirects
// /design-preview to /, and production's rewrite serves it the prerendered
// homepage file, so the preview surface presented itself to crawlers as an
// indexable copy of the homepage (robots.txt already Disallows it; this is
// the belt-and-braces meta the ship note asked for). Writing the homepage's
// prerendered file under design-preview/ with the meta injected gives the
// route its own shell: the static file wins over the rewrite, browsers
// still boot the SPA and redirect exactly as before, and the homepage
// itself is untouched. Deliberately excluded from the sitemap.
{
  const homeShell = fs.readFileSync(path.join(dist, "index.html"), "utf-8");
  const previewShell = homeShell.replace(
    "</head>",
    '<meta name="robots" content="noindex">\n</head>'
  );
  if (previewShell === homeShell) {
    throw new Error("prerender: could not inject noindex meta into the /design-preview shell");
  }
  const previewFile = path.join(dist, "design-preview", "index.html");
  fs.mkdirSync(path.dirname(previewFile), { recursive: true });
  fs.writeFileSync(previewFile, previewShell, "utf-8");
  console.log(
    `[prerender] /design-preview -> design-preview/index.html (${Buffer.byteLength(previewShell, "utf8")} bytes, noindex)`
  );
}

// Developer-door variants (segmentation Phase 1, 2026-11-19). The
// developer door (developers.wrenchli.net) serves the Developers page
// at its root and the GPT guide at /gpt-actions, with canonicals that
// point at the door itself. One build serves every door, so the
// prerender emits door variants of both pages alongside the standard
// files: the same routes rendered with the door host set (see
// src/lib/doorHost.ts), written under dist/door-developers/. The edge
// middleware rewrites the door's / and /gpt-actions to these files;
// the standard /developers files above are untouched and keep serving
// on www exactly as before.
{
  const doorHost = "developers.wrenchli.net";
  const doorPages = [
    { renderUrl: "/", file: "door-developers/index.html", label: "developers door /" },
    {
      renderUrl: "/developers/gpt-actions",
      file: "door-developers/gpt-actions/index.html",
      label: "developers door /gpt-actions",
    },
    {
      renderUrl: "/developers/price-check",
      file: "door-developers/price-check/index.html",
      label: "developers door /price-check",
    },
    {
      renderUrl: "/developers/code-lookup",
      file: "door-developers/code-lookup/index.html",
      label: "developers door /code-lookup",
    },
  ];
  for (const doorPage of doorPages) {
    const { html, head } = render(doorPage.renderUrl === "/" ? "/" : doorPage.renderUrl, doorHost);
    if (!html || html.length < 200) {
      throw new Error(
        `prerender: ${doorPage.label} rendered suspiciously little HTML (${html?.length ?? 0} bytes)`
      );
    }
    let page = applyHead(template, head);
    page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    const file = path.join(dist, doorPage.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page, "utf-8");
    console.log(
      `[prerender] ${doorPage.label} -> ${doorPage.file} (${Buffer.byteLength(page, "utf8")} bytes)`
    );
  }
}

// Sitemap, generated from the same manifest (routes + blog content source).
// Each URL's <lastmod> is that page's real last-changed date (front-door
// fix 6): blog posts carry their content date, other routes use the
// newest commit touching their source files. A route whose date cannot
// be determined (e.g. git history unavailable in the build environment)
// omits <lastmod> rather than stamping a fabricated build date.
function gitLastChanged(files) {
  let best = null;
  for (const file of files) {
    try {
      const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
        cwd: root,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(out) && (!best || out > best)) best = out;
    } catch {
      // git unavailable for this file — fall through with no date.
    }
  }
  return best;
}

const blogDates = new Map(getAllPosts().map((post) => [`/blog/${post.slug}`, post.date]));
const newestBlogDate = [...blogDates.values()].sort().at(-1) ?? null;

function sitemapLastmod(p) {
  if (blogDates.has(p)) return blogDates.get(p) || null;
  if (p === "/blog") return newestBlogDate;
  const sourcePath = REDIRECT_PRERENDER_PATHS[p] ?? p;
  const files = SITEMAP_SOURCE_FILES[sourcePath];
  return files ? gitLastChanged(files) : null;
}

let datedCount = 0;
const urls = getSitemapPaths()
  .map((p) => {
    const lastmod = sitemapLastmod(p);
    if (lastmod) datedCount += 1;
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
    return `  <url><loc>${SITE_BASE}${p === "/" ? "/" : p}</loc>${lm}</url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap, "utf-8");
console.log(
  `[prerender] sitemap.xml -> ${getSitemapPaths().length} URLs (${datedCount} with lastmod)`
);
