#!/usr/bin/env node
/**
 * check-bundle-leaks.mjs — pre-ship scan of the built client bundle.
 *
 * Why this exists (fix F1, 2026-10-31): an internal architecture note
 * (a vendor AI-gateway name and a model ID from an internal spec document
 * inlined via a `?raw` import) shipped in the production JS bundle, where
 * anyone could read it. Route gating does not protect bundle text — the
 * chunks are public static assets. This scan makes that leak class fail
 * the ship instead of shipping silently.
 *
 * Usage:  npm run build && npm run check:bundle
 * Scans:  dist/assets/**​/*.js (case-insensitive)
 * Exit:   0 = clean (warn-list hits are printed but do not fail)
 *         1 = a deny-list term was found
 *         2 = scan could not run (e.g. dist/assets missing — build first)
 *
 * Deny list = terms that must never appear in shipped client code:
 * internal vendor plumbing, model IDs, and secret-material identifiers.
 *
 * Warn list = terms that legitimately appear in public bundle content,
 * kept visible so a human notices if their count or context changes:
 *   - (none yet — terms land here only with a documented false positive)
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DENY_TERMS = [
  "lovable",
  "ai gateway",
  "google/gemini",
  "gemini-2.5",
  "internal_secret",
  "service_role",
];

const WARN_TERMS = [
  // Example of the bar for entry: the term matches text that is public by
  // design (e.g. the /developers pages' published API/GPT documentation),
  // so failing the ship on it would block legitimate content.
];

const root = fileURLToPath(new URL("..", import.meta.url));
const assetsDir = join(root, "dist", "assets");

function collectJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectJsFiles(full));
    else if (entry.endsWith(".js")) out.push(full);
  }
  return out;
}

let files;
try {
  files = collectJsFiles(assetsDir);
} catch {
  console.error(
    `check-bundle-leaks: cannot read ${assetsDir} — run \`npm run build\` first.`
  );
  process.exit(2);
}

if (files.length === 0) {
  console.error(`check-bundle-leaks: no .js files under ${assetsDir} — build first.`);
  process.exit(2);
}

function scan(terms, label) {
  const hits = [];
  for (const term of terms) {
    const needle = term.toLowerCase();
    for (const file of files) {
      const content = readFileSync(file, "utf8").toLowerCase();
      let idx = content.indexOf(needle);
      if (idx === -1) continue;
      let count = 0;
      while (idx !== -1) {
        count++;
        idx = content.indexOf(needle, idx + needle.length);
      }
      hits.push({ term, file: relative(root, file), count });
    }
  }
  for (const hit of hits) {
    console.log(
      `${label}: "${hit.term}" found ${hit.count}x in ${hit.file}`
    );
  }
  return hits;
}

const denyHits = scan(DENY_TERMS, "LEAK");
const warnHits = scan(WARN_TERMS, "WARN");

if (denyHits.length > 0) {
  console.error(
    `\ncheck-bundle-leaks: FAIL — ${denyHits.length} deny-list match(es) in the built bundle. ` +
      `Remove the internal text from the source before shipping.`
  );
  process.exit(1);
}

console.log(
  `\ncheck-bundle-leaks: PASS — scanned ${files.length} bundle file(s), ` +
    `${DENY_TERMS.length} deny terms, 0 matches` +
    (warnHits.length ? ` (${warnHits.length} warn-only match(es) above)` : "") +
    `.`
);
