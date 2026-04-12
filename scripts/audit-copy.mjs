#!/usr/bin/env node
/**
 * /audit-copy — Wrenchli Consumer Copy Auditor
 *
 * Scans all consumer-facing pages and components for language-rule
 * violations defined in .claude/SKILL.md.
 *
 * Usage:  node scripts/audit-copy.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Configuration ──────────────────────────────────────────────

const CONSUMER_DIRS = [
  "src/pages",
  "src/components",
  "src/content/blog",
];

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".md"];

// Files/dirs that are NOT consumer-facing
const SKIP_PATTERNS = [
  /\/ui\//,            // shadcn primitives
  /\/shop-portal\//,   // internal shop dashboard
  /\/agent\//,         // internal agent flow
  /__tests__/,
  /\.test\./,
  /AdminDashboard/,
  /AdminLogin/,
  /ShopPortal/,
  /ShopLogin/,
  /SecurityStatusPanel/,
];

// ── Rules ──────────────────────────────────────────────────────

const BANNED_WORDS = [
  { pattern: /\bdiagnos(?:is|e[sd]?|ing)\b/gi, label: "diagnosis/diagnose", fix: 'Use "symptom assessment" or "likely causes"' },
  { pattern: /\bPro Only\b/gi, label: "Pro Only", fix: 'Use "Shop Required"' },
  { pattern: /\bProfessional Only\b/gi, label: "Professional Only", fix: 'Use "Shop Required"' },
  { pattern: /\bAlways free\b/gi, label: "Always free", fix: 'Use "Assessment always free"' },
  { pattern: /\bvetted shops?\b/gi, label: "vetted shops", fix: 'Use "trusted shops"' },
  { pattern: /\bwe(?:'re| are) building\b/gi, label: "we're building", fix: 'Use "we built" — product is live' },
  { pattern: /\bour platform\b/gi, label: "our platform", fix: 'Use "Wrenchli"' },
  { pattern: /\bAutoZone\b/g, label: "AutoZone", fix: "AutoZone was removed — omit entirely" },
  { pattern: /\bAI[- ]powered diagnos/gi, label: "AI-powered diagnosis", fix: "Avoid technical jargon in consumer copy" },
  { pattern: /\bmachine learning diagnos/gi, label: "machine learning diagnosis", fix: "Avoid technical jargon in consumer copy" },
  { pattern: /\bdiagnose your car\b/gi, label: "diagnose your car", fix: 'Use "assess your symptoms"' },
  { pattern: /\bbroken\b/gi, label: '"broken" (repair experience)', fix: 'Use "harder than it needs to be"', contextCheck: true },
];

// Words that make "broken" OK in technical context (e.g. "broken hose")
const BROKEN_OK_CONTEXT = /\bbroken\s+(?:hose|belt|part|sensor|wire|cable|spring|mount|bolt|link|arm|line|pipe|clip|bracket|seal|gasket|valve|pump|rotor|caliper|strut|bushing|joint)\b/i;

const PASSIVE_CTA_PATTERN = /(?:Learn more|More info|Details|Information|Click here|Submit|Next)\b/i;

const AMAZON_LINK = /amazon\.com/i;
const FTC_DISCLOSURE = /affiliate\s+link|wrenchli\s+may\s+earn/i;

const AFFILIATE_TAG_WRONG = /wrenchli20-20/g;

// ── Helpers ────────────────────────────────────────────────────

function collectFiles() {
  const files = [];
  for (const dir of CONSUMER_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    walk(abs, files);
  }
  return files;
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (SKIP_PATTERNS.some((p) => p.test(rel))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
}

/** Extract string literals and JSX text from TSX/TS, or raw lines from MD. */
function extractConsumerText(content, ext) {
  if (ext === ".md") {
    // Skip frontmatter
    const body = content.replace(/^---[\s\S]*?---/, "");
    return body.split("\n").map((l) => l.trim()).filter(Boolean);
  }
  // For TSX: extract string contents and JSX text nodes
  const strings = [];
  // Double-quoted strings
  for (const m of content.matchAll(/"([^"]{4,})"/g)) strings.push(m[1]);
  // Single-quoted strings
  for (const m of content.matchAll(/'([^']{4,})'/g)) strings.push(m[1]);
  // Template literals
  for (const m of content.matchAll(/`([^`]{4,})`/g)) strings.push(m[1]);
  // JSX text nodes (lines between > and <)
  for (const m of content.matchAll(/>\s*([^<>{}\n]{4,})\s*</g)) strings.push(m[1]);
  return strings;
}

function countWords(sentence) {
  return sentence.split(/\s+/).filter(Boolean).length;
}

function extractSentences(text) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Extract CTA text from buttons and links */
function extractCTAs(content) {
  const ctas = [];
  // <Button...>text</Button>
  for (const m of content.matchAll(/<Button[^>]*>\s*([^<]+)\s*<\/Button>/gi)) ctas.push(m[1].trim());
  // <button...>text</button>
  for (const m of content.matchAll(/<button[^>]*>\s*([^<]+)\s*<\/button>/gi)) ctas.push(m[1].trim());
  // <Link...>text</Link> or <a...>text</a>
  for (const m of content.matchAll(/<(?:Link|a)[^>]*>\s*([^<]+)\s*<\/(?:Link|a)>/gi)) ctas.push(m[1].trim());
  return ctas.filter((t) => t.length > 2 && !t.startsWith("{") && !t.startsWith("<"));
}

// ── Main Scan ──────────────────────────────────────────────────

const SEVERITY = { error: 1, warning: 2, info: 3 };

function scan() {
  const findings = [];
  const files = collectFiles();

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const ext = path.extname(file);
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    const texts = extractConsumerText(content, ext);

    // 1. Banned words — only scan extracted consumer-facing text, not code
    for (const rule of BANNED_WORDS) {
      if (ext === ".md") {
        // For markdown, scan full lines (they're all consumer-facing)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (/^---/.test(line.trim())) continue; // skip frontmatter delimiters
          const matches = [...line.matchAll(rule.pattern)];
          for (const match of matches) {
            if (rule.contextCheck && rule.label.includes("broken") && BROKEN_OK_CONTEXT.test(line)) continue;
            findings.push({ severity: "error", category: "Banned word", file: rel, line: i + 1, text: `"${match[0]}"`, fix: rule.fix });
          }
        }
      } else {
        // For TSX/TS: only scan the extracted consumer text fragments
        for (const text of texts) {
          const matches = [...text.matchAll(rule.pattern)];
          for (const match of matches) {
            if (rule.contextCheck && rule.label.includes("broken") && BROKEN_OK_CONTEXT.test(text)) continue;
            const lineNum = lines.findIndex((l) => l.includes(text.slice(0, 30))) + 1;
            findings.push({ severity: "error", category: "Banned word", file: rel, line: lineNum || "?", text: `"${match[0]}"`, fix: rule.fix });
          }
        }
      }
    }
    }

    // 2. Sentence length (marketing copy only — skip code lines)
    for (const text of texts) {
      for (const sentence of extractSentences(text)) {
        const wc = countWords(sentence);
        if (wc > 25) {
          const lineNum = lines.findIndex((l) => l.includes(sentence.slice(0, 40))) + 1;
          findings.push({
            severity: "warning",
            category: "Sentence too long",
            file: rel,
            line: lineNum || "?",
            text: `${wc} words: "${sentence.slice(0, 80)}…"`,
            fix: `Split into sentences of ≤25 words`,
          });
        }
      }
    }

    // 3. Passive CTAs
    if (ext !== ".md") {
      for (const cta of extractCTAs(content)) {
        if (PASSIVE_CTA_PATTERN.test(cta)) {
          const lineNum = lines.findIndex((l) => l.includes(cta)) + 1;
          findings.push({
            severity: "warning",
            category: "Passive CTA",
            file: rel,
            line: lineNum || "?",
            text: `"${cta}"`,
            fix: "Start CTAs with an action verb: Get, Start, Run, Apply, Save, See, Try, Find",
          });
        }
      }
    }

    // 4. Amazon links without FTC disclosure
    if (AMAZON_LINK.test(content) && !FTC_DISCLOSURE.test(content)) {
      findings.push({
        severity: "error",
        category: "Missing FTC disclosure",
        file: rel,
        line: "-",
        text: "Page contains Amazon links but no affiliate disclosure",
        fix: 'Add: "Some links on this page are affiliate links…"',
      });
    }

    // 5. Wrong affiliate tag
    for (let i = 0; i < lines.length; i++) {
      if (AFFILIATE_TAG_WRONG.test(lines[i])) {
        findings.push({
          severity: "error",
          category: "Wrong affiliate tag",
          file: rel,
          line: i + 1,
          text: '"wrenchli20-20" (missing hyphen)',
          fix: "Use wrenchli-20 (with hyphen)",
        });
      }
    }
  }

  // Sort by severity
  findings.sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity]);
  return findings;
}

// ── Output ─────────────────────────────────────────────────────

const findings = scan();

if (findings.length === 0) {
  console.log("\n✅  No copy violations found. All clear.\n");
  process.exit(0);
}

const errors = findings.filter((f) => f.severity === "error");
const warnings = findings.filter((f) => f.severity === "warning");
const infos = findings.filter((f) => f.severity === "info");

console.log(`\n🔍  WRENCHLI COPY AUDIT — ${findings.length} finding(s)\n`);
console.log(`   ❌ ${errors.length} error(s)   ⚠️  ${warnings.length} warning(s)   ℹ️  ${infos.length} info(s)\n`);
console.log("─".repeat(72));

for (const f of findings) {
  const icon = f.severity === "error" ? "❌" : f.severity === "warning" ? "⚠️ " : "ℹ️ ";
  console.log(`\n${icon} [${f.category}] ${f.file}:${f.line}`);
  console.log(`   Found: ${f.text}`);
  console.log(`   Fix:   ${f.fix}`);
}

console.log("\n" + "─".repeat(72));
console.log(`\nTotal: ${findings.length} finding(s) across ${new Set(findings.map((f) => f.file)).size} file(s)\n`);

process.exit(errors.length > 0 ? 1 : 0);
