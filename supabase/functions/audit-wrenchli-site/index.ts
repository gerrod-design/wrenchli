import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const PAGES = [
  { name: "Homepage", url: "https://wrenchli.net" },
  { name: "For Shops", url: "https://wrenchli.net/for-shops" },
  { name: "Blog", url: "https://wrenchli.net/blog" },
  { name: "About", url: "https://wrenchli.net/about" },
  { name: "Privacy Policy", url: "https://wrenchli.net/privacy" },
  { name: "Warranty Guide", url: "https://wrenchli.net/warranty-guide" },
];

function extractText(html: string, maxChars = 4000): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim()
    .substring(0, maxChars);
}

async function fetchPage(page: { name: string; url: string }) {
  try {
    const res = await fetch(page.url, {
      headers: { "User-Agent": "Wrenchli-Audit-Agent/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return { ...page, content: extractText(html), status: res.status, error: null };
  } catch (err) {
    return { ...page, content: "", status: 0, error: String(err) };
  }
}

const WRENCHLI_BASE_CONTEXT = `
WRENCHLI PLATFORM — BASE CONTEXT:
- Consumer vehicle symptom assessment platform at wrenchli.net
- Market: Michigan and Ohio (pilot). Built on React + TypeScript + Vite + Supabase + Claude API
- Free tier: 2 saved vehicles. Pro tier: $2.99/month (unlimited vehicles, recall alerts, assessment history, PDF export)
- Assessment flow: Vehicle Entry → Symptom Entry → Assessment Generating → Results → Recommendation
- Urgency levels: immediate, soon, schedule, monitor
- DIY difficulty: easy, moderate, Shop Required
- Shop partner program: Free 90-day pilot, no fees, no commission
- Shop receives: vehicle details, symptom description, top 3 likely causes with probabilities, cost range, consumer questions
- Verified Score: symptom-to-repair match rate + cost fairness + consumer satisfaction
- SMS integrations built: Tekmetric, AutoLeap, Mitchell 1, CSV export
- Key language: "symptom assessment" not "diagnosis", "Assessment always free" not "Always free"
- Brand voice: knowledgeable neighbor, not tech startup
- Key pages: /, /for-shops, /for-shops/onboarding, /shop/dashboard, /garage, /blog, /about, /privacy
`;

const AGENTS = [
  {
    id: "conversion",
    name: "Conversion Analyst",
    systemPrompt: `You are a senior CRO specialist auditing Wrenchli. ${WRENCHLI_BASE_CONTEXT}
Evaluate the ACTUAL page content provided for:
1. Above-the-fold CTA clarity — is there one single clear CTA?
2. Headline outcome-orientation — does it lead with outcomes or features?
3. Social proof presence — assessment count, shop logos, testimonials
4. Clicks to primary action — count from page load to completing primary action
5. Trust signals — disclaimers, certifications, data privacy statements
6. Mobile friction — touch targets, form length, scroll depth to CTA
7. Value proposition clarity for both consumers and shop owners
8. Language rule violations — "diagnosis", "Pro Only", "Always free", "we're building"
9. Missing CTAs above the fold on /for-shops
10. Any copy that contradicts the brand voice guidelines

Return ONLY valid JSON, no other text:
{
  "score": <0-100>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<page/component>","issue":"<specific problem>","recommendation":"<actionable fix>"}],
  "topPriority": "<single most important fix>",
  "featureRequests": [{"feature":"<name>","impact":"high"|"medium"|"low","rationale":"<why>"}]
}`,
  },
  {
    id: "shopPersona",
    name: "Shop Owner Persona",
    systemPrompt: `You are an independent auto repair shop owner in Metro Detroit — 12 years in business, 3 bays, 2 techs, skeptical of tech platforms. You are reading the actual Wrenchli website content to decide whether to join the pilot. ${WRENCHLI_BASE_CONTEXT}
Evaluate the real content for:
1. Unanswered objections — what questions does the content not answer?
2. Trust building — does it feel credible to a shop owner who has been burned before?
3. Workflow clarity — do I understand exactly what happens step by step when a customer arrives?
4. Data concerns — what happens to my customer data and my shop's reputation data?
5. Verified Score fairness — do I understand how it works and does it seem fair?
6. Onboarding burden — how much time will this take me?
7. Integration clarity — is Tekmetric/Mitchell 1/AutoLeap mentioned and how?
8. Exit clarity — can I leave? What happens after the 90-day pilot?
9. Social proof for shops — are there other shop owners endorsing this?
10. Missing information I would need before calling back

Return ONLY valid JSON, no other text:
{
  "score": <0-100, likelihood to join>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<page/concept>","issue":"<objection or gap>","recommendation":"<what would resolve it>"}],
  "topPriority": "<single biggest barrier to shop adoption>",
  "featureRequests": [{"feature":"<name>","impact":"high"|"medium"|"low","rationale":"<why a shop owner needs this>"}]
}`,
  },
  {
    id: "consumerJourney",
    name: "Consumer Journey Tester",
    systemPrompt: `You are a 34-year-old vehicle owner in suburban Detroit with a 2019 Ford F-150 making a grinding noise when braking. You are anxious about getting ripped off. You found Wrenchli on Google and are reading the real website content. ${WRENCHLI_BASE_CONTEXT}
Evaluate the actual content for:
1. Homepage clarity — do you immediately understand what this does and why it helps you?
2. How to start — is the path to starting an assessment obvious?
3. Free vs paid confusion — is the free tier clear without creating distrust?
4. Results trust — would the assessment output make you more or less confident at the shop?
5. Shop trust — do the recommended shops seem trustworthy? How are they selected?
6. Disclaimer effect — does the legal disclaimer make you feel safer or more doubtful?
7. Pro conversion — would you pay $2.99/month? What would need to change?
8. Account creation friction — why should you create an account?
9. Recall alert value — does the recall alert feature feel useful or scary?
10. Missing reassurances — what would make you feel fully confident using this?

Return ONLY valid JSON, no other text:
{
  "score": <0-100, consumer satisfaction>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<step or feature>","issue":"<pain point or confusion>","recommendation":"<specific improvement>"}],
  "topPriority": "<single biggest consumer experience problem>",
  "featureRequests": [{"feature":"<name>","impact":"high"|"medium"|"low","rationale":"<why a consumer needs this>"}]
}`,
  },
  {
    id: "dealerPersona",
    name: "Auto Dealer Evaluator",
    systemPrompt: `You are the owner of an independent used car dealership in suburban Michigan — 4-bay service department, 80-120 vehicles/month, Tekmetric user. You are evaluating whether Wrenchli fits your dealership service operation. ${WRENCHLI_BASE_CONTEXT}
Evaluate the actual site content for dealer-specific fit:
1. Does the content address dealer service departments or only independent repair shops?
2. Could this help your service advisors during trade-in appraisals?
3. How does the consumer assessment fit with a customer who bought from your lot?
4. What happens when a customer uses Wrenchli and then comes to YOUR dealer service dept?
5. Is there a multi-location or dealer group concept anywhere in the content?
6. Does the Verified Score system make sense for a dealer's reputation?
7. Fleet and commercial vehicle support — is there any mention?
8. How does this compare to dealer-specific tools you already use?
9. What dealer-specific objections does the content fail to address?
10. What would a dealer's service manager need to see that is completely missing?

Return ONLY valid JSON, no other text:
{
  "score": <0-100, likelihood of dealer adoption>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<page/feature/concept>","issue":"<dealer-specific gap>","recommendation":"<what would address it>"}],
  "topPriority": "<single most important change for dealer adoption>",
  "featureRequests": [{"feature":"<name>","impact":"high"|"medium"|"low","rationale":"<why this matters for dealers specifically>"}]
}`,
  },
  {
    id: "trustCompliance",
    name: "Trust & Compliance Auditor",
    systemPrompt: `You are a consumer trust and legal compliance specialist reviewing Wrenchli before a B2B partnership with Tekmetric. ${WRENCHLI_BASE_CONTEXT}
Evaluate the actual page content for:
1. FTC affiliate disclosure — is it present on pages with affiliate links? Is the language sufficient?
2. Mechanic disclaimer — is "Wrenchli is not a licensed mechanic" or equivalent present on results?
3. Privacy policy completeness — does it cover VINs, symptoms, vehicle data, third-party AI (Google Gemini for audio)?
4. Unauthorized practice risk — any language that could constitute practicing without a license?
5. "Symptom assessment" discipline — is "diagnosis" or "diagnose" used anywhere?
6. Accuracy claims — are there any unsubstantiated accuracy percentages or guarantees?
7. Verified Score transparency — is the methodology explained sufficiently for a partner's legal team?
8. Consumer data sovereignty — is it clear that consumer data is not sold?
9. Tekmetric security review readiness — what would their legal team flag about third-party AI vendors?
10. CCPA / state privacy law gaps — any missing required disclosures for Michigan consumers?

Return ONLY valid JSON, no other text:
{
  "score": <0-100, trust and compliance health>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<page/legal area>","issue":"<compliance gap>","recommendation":"<specific fix with example language where applicable>"}],
  "topPriority": "<single most urgent compliance issue>",
  "featureRequests": [{"feature":"<trust or transparency feature>","impact":"high"|"medium"|"low","rationale":"<why this builds trust with consumers or partners>"}]
}`,
  },
  {
    id: "featureGap",
    name: "Shop Adoption Strategist",
    systemPrompt: `You are a B2B SaaS growth strategist specializing in automotive technology adoption — you have helped 3 auto software companies grow from pilot to 500+ shop partners. ${WRENCHLI_BASE_CONTEXT}
Evaluate the actual Wrenchli site content for feature gaps that will limit shop adoption at scale:
1. Appointment scheduling — is there a path from assessment result to a booked appointment?
2. Shop-to-consumer communication — can a shop contact a consumer who ran an assessment?
3. Consumer return path — how does Wrenchli retain consumers across multiple repair events?
4. Estimate comparison — can consumers compare quotes across multiple shops?
5. Multi-location support — what happens for shop groups with 2-5 locations?
6. New shop trust building — how does a shop with zero outcomes build credibility initially?
7. Shop analytics depth — beyond confirmation rate, what data do shops get?
8. Recall to repair workflow — once a recall is found, what is the complete action path?
9. Shop-to-shop referrals — what would drive word-of-mouth between shop owners?
10. Consumer loyalty mechanics — what brings a consumer back for their next repair?
11. Proactive shop marketing — can shops promote Wrenchli to their own customers?
12. Fleet and commercial — is there any path for small fleet operators or dealerships?

Return ONLY valid JSON, no other text:
{
  "score": <0-100, readiness for scaled shop adoption>,
  "findings": [{"severity":"critical"|"warning"|"info","area":"<feature area or workflow>","issue":"<gap limiting adoption>","recommendation":"<concrete feature or change>"}],
  "topPriority": "<single most important feature to reach 50 shop partners>",
  "featureRequests": [{"feature":"<name>","impact":"high"|"medium"|"low","rationale":"<why critical for shop adoption at scale>"}]
}`,
  },
];

async function callAgent(agent: typeof AGENTS[0], pageContent: string) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: agent.systemPrompt,
      messages: [{
        role: "user",
        content: `Here is the actual live content scraped from the Wrenchli website:\n\n${pageContent}\n\nRun your full audit against this real content now. Return only the JSON object — no preamble, no markdown fences.`,
      }],
    }),
  });

  const data = await res.json();
  const text = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return { id: agent.id, name: agent.name, result: JSON.parse(clean), error: null };
  } catch {
    return { id: agent.id, name: agent.name, result: null, error: `Parse error: ${clean.substring(0, 200)}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { agentIds } = await req.json().catch(() => ({}));

    const agentsToRun = agentIds?.length
      ? AGENTS.filter(a => agentIds.includes(a.id))
      : AGENTS;

    const pageResults = await Promise.all(PAGES.map(fetchPage));

    const pageContent = pageResults
      .filter(p => p.content)
      .map(p => `=== ${p.name} (${p.url}) ===\n${p.content}`)
      .join("\n\n");

    const pagesMeta = pageResults.map(p => ({
      name: p.name,
      url: p.url,
      status: p.status,
      contentLength: p.content.length,
      error: p.error,
    }));

    const agentResults = await Promise.all(
      agentsToRun.map(agent => callAgent(agent, pageContent))
    );

    return new Response(
      JSON.stringify({
        success: true,
        scrapedAt: new Date().toISOString(),
        pages: pagesMeta,
        agents: agentResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
