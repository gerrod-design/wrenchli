import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  const optionsResp = handleCorsOptions(req);
  if (optionsResp) return optionsResp;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const anthropicModel = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Step 1: Run the audit ──
    console.log("[auto-fix] Step 1 — calling audit-wrenchli-site");
    const auditRes = await fetch(`${supabaseUrl}/functions/v1/audit-wrenchli-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!auditRes.ok) {
      const errText = await auditRes.text();
      throw new Error(`Audit function failed [${auditRes.status}]: ${errText}`);
    }

    const auditData = await auditRes.json();
    if (!auditData.success) throw new Error("Audit returned success=false");

    const agentResults = auditData.agents ?? [];
    console.log(`[auto-fix] Audit complete — ${agentResults.length} agents returned`);

    // Compute overall score and critical count
    let totalScore = 0;
    let scoredCount = 0;
    let criticalCount = 0;

    for (const agent of agentResults) {
      if (agent.result?.score != null) {
        totalScore += agent.result.score;
        scoredCount++;
      }
      if (agent.result?.findings) {
        criticalCount += agent.result.findings.filter(
          (f: { severity: string }) => f.severity === "critical"
        ).length;
      }
    }

    const overallScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    // ── Step 2: Generate fixes via Claude ──
    console.log("[auto-fix] Step 2 — generating fixes via Claude");

    const fixSystemPrompt = `You are a senior engineering assistant for Wrenchli (wrenchli.net), a vehicle symptom assessment platform built on React + TypeScript + Vite + Supabase. Given the following audit findings from 6 specialist agents, identify the top 5 most impactful fixable issues and generate specific, paste-ready prompts for Lovable.dev to fix each one.

Rules:
- Focus on issues affecting real users or legal compliance
- Write each prompt as if instructing Lovable directly
- Be specific about file and component names
- Never suggest SSR, Next.js migration, or prerendering
- Never duplicate a fix already suggested

Output ONLY a valid JSON array, no other text:
[{
  "priority": 1,
  "title": "short description",
  "severity": "critical",
  "agent": "which agent flagged this",
  "prompt": "the full Lovable prompt text"
}]`;

    const claudeRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: 8000,
        system: fixSystemPrompt,
        messages: [{
          role: "user",
          content: `Here are the full audit results from all 6 agents:\n\n${JSON.stringify(agentResults, null, 2)}\n\nGenerate the top 5 fixes now. Return only the JSON array.`,
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const claudeText = claudeData.content?.map((b: { text?: string }) => b.text || "").join("") || "";
    const cleanJson = claudeText.replace(/```json|```/g, "").trim();

    let generatedPrompts: Array<{
      priority: number;
      title: string;
      severity: string;
      agent: string;
      prompt: string;
    }> = [];

    try {
      generatedPrompts = JSON.parse(cleanJson);
    } catch {
      console.error("[auto-fix] Failed to parse Claude response:", cleanJson.substring(0, 300));
    }

    console.log(`[auto-fix] Claude generated ${generatedPrompts.length} fix prompts`);

    // ── Step 3: Store in audit_runs ──
    console.log("[auto-fix] Step 3 — storing in audit_runs");

    const { error: insertError } = await supabase.from("audit_runs").insert({
      overall_score: overallScore,
      critical_count: criticalCount,
      agent_results: agentResults,
      generated_prompts: generatedPrompts,
      status: "pending_review",
    });

    if (insertError) console.error("[auto-fix] Insert error:", insertError);

    // ── Step 4: Create GitHub issues ──
    console.log("[auto-fix] Step 4 — creating GitHub issues");

    const ghResults: Array<{ title: string; url?: string; error?: string }> = [];

    for (const fix of generatedPrompts) {
      try {
        const ghRes = await fetch(
          "https://api.github.com/repos/gerrod-design/wrenchli/issues",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: `[Audit Fix] ${fix.title}`,
              body: `**Severity:** ${fix.severity}\n**Agent:** ${fix.agent}\n**Priority:** ${fix.priority}\n\n---\n\n**Lovable Prompt — paste this directly into Lovable:**\n\n${fix.prompt}`,
              labels: ["audit-fix"],
            }),
          }
        );

        const ghData = await ghRes.json();
        if (!ghRes.ok) {
          ghResults.push({ title: fix.title, error: `GitHub ${ghRes.status}: ${JSON.stringify(ghData)}` });
        } else {
          ghResults.push({ title: fix.title, url: ghData.html_url });
        }
      } catch (err) {
        ghResults.push({ title: fix.title, error: String(err) });
      }
    }

    console.log("[auto-fix] GitHub issues created:", ghResults.length);

    // ── Step 5: Send summary email ──
    console.log("[auto-fix] Step 5 — sending summary email");

    const topPriorities = agentResults
      .map((a: { name: string; result?: { topPriority?: string } }) =>
        `- ${a.name}: ${a.result?.topPriority ?? "N/A"}`
      )
      .join("\n");

    const emailSubject = `Wrenchli weekly audit — ${overallScore}/100, ${criticalCount} critical issues`;
    const emailHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1E3A5F,#2563EB);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🔍 Wrenchli Weekly Audit</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="display:flex;gap:24px;margin:0 0 24px;">
            <div style="background:#DBEAFE;border-radius:8px;padding:20px;flex:1;text-align:center;">
              <p style="margin:0;color:#6B7280;font-size:13px;">Overall Score</p>
              <p style="margin:4px 0 0;color:#1E3A5F;font-size:32px;font-weight:800;">${overallScore}/100</p>
            </div>
            <div style="background:${criticalCount > 0 ? '#FEE2E2' : '#ECFDF5'};border-radius:8px;padding:20px;flex:1;text-align:center;">
              <p style="margin:0;color:#6B7280;font-size:13px;">Critical Issues</p>
              <p style="margin:4px 0 0;color:${criticalCount > 0 ? '#991B1B' : '#059669'};font-size:32px;font-weight:800;">${criticalCount}</p>
            </div>
          </div>
          <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Agents run: 6</p>
          <h3 style="margin:20px 0 12px;color:#1E3A5F;font-size:16px;">Top Priority Per Agent</h3>
          <pre style="background:#F9FAFB;border-radius:8px;padding:16px;font-size:13px;color:#374151;line-height:1.6;white-space:pre-wrap;margin:0 0 24px;">${topPriorities}</pre>
          <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">${generatedPrompts.length} fix prompts generated → GitHub issues created</p>
          <a href="https://github.com/gerrod-design/wrenchli/issues?q=label%3Aaudit-fix+is%3Aopen" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;margin:16px 0 0;">Review & Paste Fixes →</a>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0;color:#9CA3AF;font-size:12px;">Automated weekly audit by Wrenchli Engineering</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Wrenchli <onboarding@resend.dev>",
          to: ["gerrod@wrenchli.net"],
          subject: emailSubject,
          html: emailHtml,
        }),
      });
      const emailResult = await emailRes.json();
      console.log("[auto-fix] Email sent:", emailRes.ok, emailResult?.id);
    } else {
      console.warn("[auto-fix] RESEND_API_KEY not set — skipping email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        overallScore,
        criticalCount,
        fixesGenerated: generatedPrompts.length,
        githubIssues: ghResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[auto-fix] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
