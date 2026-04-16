import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

async function computeHmacAsync(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function successPage(message: string): Response {
  return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fix Queued — Wrenchli</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0F1117; font-family:'Plus Jakarta Sans',sans-serif; color:#F8F8F6; padding:24px; }
  .card { background:#1A1B23; border-radius:16px; padding:48px; max-width:480px; text-align:center; box-shadow:0 8px 32px rgba(0,0,0,0.4); }
  .icon { font-size:48px; margin:0 0 20px; }
  h1 { font-size:24px; font-weight:800; color:#E07B39; margin:0 0 16px; }
  p { font-size:15px; line-height:1.6; color:#9CA3AF; margin:0 0 12px; }
  .highlight { color:#F8F8F6; font-weight:700; }
  .link { display:inline-block; margin:20px 0 0; color:#E07B39; text-decoration:none; font-weight:700; font-size:14px; }
  .link:hover { text-decoration:underline; }
</style>
</head><body>
<div class="card">
  <div class="icon">🚀</div>
  <h1>Fix Queued for Deployment</h1>
  <p>${message}</p>
  <p>Lovable will pick up the change from GitHub within <span class="highlight">60 seconds</span>.</p>
  <p>Check <a href="https://wrenchli.net" style="color:#E07B39;">wrenchli.net</a> in <span class="highlight">2 minutes</span>.</p>
  <a class="link" href="https://github.com/gerrod-design/wrenchli/issues?q=label%3Aaudit-fix+is%3Aopen">View Issues on GitHub →</a>
</div>
</body></html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function errorPage(message: string, status = 403): Response {
  return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Error — Wrenchli</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0F1117; font-family:'Plus Jakarta Sans',sans-serif; color:#F8F8F6; padding:24px; }
  .card { background:#1A1B23; border-radius:16px; padding:48px; max-width:480px; text-align:center; }
  h1 { font-size:22px; color:#EF4444; margin:0 0 12px; }
  p { font-size:14px; color:#9CA3AF; }
</style>
</head><body>
<div class="card">
  <h1>⚠️ Deployment Failed</h1>
  <p>${message}</p>
</div>
</body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";
    const isAll = url.searchParams.get("all") === "true";
    const issueNumber = url.searchParams.get("issue") ?? "";
    const runId = url.searchParams.get("run_id") ?? "";
    const priorityParam = url.searchParams.get("priority") ?? "";

    const approvalSecret = Deno.env.get("APPROVAL_SECRET") ?? "";
    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!approvalSecret) return errorPage("Server misconfigured.", 500);

    // ── Step 1: Verify HMAC token ──
    let expectedToken: string;
    if (isAll) {
      expectedToken = await computeHmacAsync(`all:${runId}`, approvalSecret);
    } else {
      expectedToken = await computeHmacAsync(issueNumber, approvalSecret);
    }

    if (token !== expectedToken) {
      return errorPage("Invalid or expired approval token.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Step 2: Get prompts ──
    let prompts: Array<{ priority: number; title: string; severity: string; agent: string; prompt: string }> = [];

    if (isAll && runId) {
      const { data } = await supabase.from("audit_runs").select("generated_prompts").eq("id", runId).single();
      if (data?.generated_prompts) {
        prompts = data.generated_prompts as typeof prompts;
      }
    } else if (runId && priorityParam) {
      const { data } = await supabase.from("audit_runs").select("generated_prompts").eq("id", runId).single();
      if (data?.generated_prompts) {
        const all = data.generated_prompts as typeof prompts;
        const match = all.find(p => String(p.priority) === priorityParam);
        if (match) prompts = [match];
      }
    }

    if (prompts.length === 0) {
      return errorPage("No prompts found for this fix.");
    }

    // ── Step 3: Label GitHub issues as approved ──
    if (!isAll && issueNumber) {
      try {
        await fetch(
          `https://api.github.com/repos/gerrod-design/wrenchli/issues/${issueNumber}/labels`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ labels: ["approved"] }),
          }
        );
      } catch (e) {
        console.error("[deploy-audit-fix] Failed to label issue:", e);
      }
    }

    // ── Step 4: Commit .lovable-prompts files to GitHub ──
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const commitResults: string[] = [];

    for (const fix of prompts) {
      const filename = `${timestamp}-fix-${fix.priority}.md`;
      const path = `.lovable-prompts/${filename}`;
      const content = `# Wrenchli Auto-Fix — Priority ${fix.priority}\n\nAgent: ${fix.agent}\nSeverity: ${fix.severity}\n\n## Prompt\n\n${fix.prompt}\n`;
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      try {
        const putRes = await fetch(
          `https://api.github.com/repos/gerrod-design/wrenchli/contents/${path}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `[auto-fix] Deploy priority ${fix.priority}: ${fix.title}`,
              content: base64Content,
            }),
          }
        );

        if (putRes.ok) {
          commitResults.push(`✅ Priority ${fix.priority}: ${fix.title}`);
        } else {
          const err = await putRes.text();
          console.error(`[deploy-audit-fix] GitHub PUT failed for ${path}:`, err);
          commitResults.push(`⚠️ Priority ${fix.priority}: failed to commit`);
        }
      } catch (e) {
        console.error(`[deploy-audit-fix] Error committing ${path}:`, e);
        commitResults.push(`⚠️ Priority ${fix.priority}: error`);
      }
    }

    const summary = prompts.length === 1
      ? `Priority ${prompts[0].priority} fix "<strong>${prompts[0].title}</strong>" has been committed to the repository.`
      : `All ${prompts.length} fixes have been committed to the repository.`;

    return successPage(summary);
  } catch (err) {
    console.error("[deploy-audit-fix] Fatal error:", err);
    return errorPage("An unexpected error occurred. Please try again.", 500);
  }
});
