// Amara Oduya — Regulatory Intelligence Agent worker v1.
// Trigger: weekly schedule (pg_cron) + manual invoke.
// Does: scans the Federal Register for new federal documents (rules,
//       proposed rules, notices) matching Wrenchli-relevant terms over the
//       last 7 days; flags matches; writes a weekly synthesis.
// Writes: agent_flags (regulatory_watch), briefing_items (weekly synthesis).
// Never: gives legal conclusions — flags for Evelyn Marchetti (GC) review.
// Scope note: state AG press releases have no unified API; tracked as pending.
import { withAgent } from "../_shared/agent.ts";

const TERMS = [
  "data broker",
  "consumer privacy",
  "unfair or deceptive",
  "artificial intelligence",
  "auto dealer",
];

// Relevance gate: the term must appear in the title or abstract, not just
// somewhere in the full text. The Federal Register's term search is full-text
// and returns noise (e.g. options-market notices) without this gate.

interface FRDoc {
  title: string;
  type: string;
  publication_date: string;
  html_url: string;
  abstract?: string;
}

async function fetchTerm(term: string, since: string): Promise<FRDoc[]> {
  const params = new URLSearchParams({
    per_page: "25",
    order: "newest",
    "conditions[term]": term,
    "conditions[publication_date][gte]": since,
    "fields[]": "title",
  });
  // URLSearchParams mangles the repeated fields[] key; build manually.
  const q =
    `per_page=25&order=newest&conditions%5Bterm%5D=${encodeURIComponent(term)}` +
    `&conditions%5Bpublication_date%5D%5Bgte%5D=${since}` +
    `&fields%5B%5D=title&fields%5B%5D=type&fields%5B%5D=publication_date&fields%5B%5D=html_url&fields%5B%5D=abstract`;
  void params;
  const res = await fetch(`https://www.federalregister.gov/api/v1/documents.json?${q}`, {
    headers: { "User-Agent": "Wrenchli-Amara/1.0 (regulatory monitoring)" },
  });
  if (!res.ok) throw new Error(`Federal Register API ${res.status} for term "${term}"`);
  const body = await res.json();
  return (body.results ?? []) as FRDoc[];
}

Deno.serve(
  withAgent("Amara Oduya", ["regulatory_scan", "flag_write", "briefing_write"], async ({ supabase, agent }) => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const seen = new Map<string, { doc: FRDoc; term: string }>();
    const errors: string[] = [];

    for (const term of TERMS) {
      try {
        const docs = await fetchTerm(term, since);
        for (const doc of docs) {
          const haystack = `${doc.title} ${doc.abstract ?? ""}`.toLowerCase();
          if (!haystack.includes(term.toLowerCase())) continue;
          if (!seen.has(doc.html_url)) seen.set(doc.html_url, { doc, term });
        }
      } catch (e) {
        errors.push(`${term}: ${(e as Error).message}`);
      }
    }

    // Dedupe against flags raised in the last 30 days
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: recent } = await supabase.from("agent_flags")
      .select("message")
      .eq("category", "regulatory_watch")
      .gte("created_at", monthAgo);
    const recentText = ((recent ?? []) as Array<{ message: string }>).map((r) => r.message).join("\n");

    let flagged = 0;
    const highlights: string[] = [];
    for (const { doc, term } of seen.values()) {
      if (recentText.includes(doc.html_url)) continue;
      const sev = doc.type === "Rule" || doc.type === "Proposed Rule" ? "medium" : "low";
      await supabase.from("agent_flags").insert({
        agent_id: agent.id,
        severity: sev,
        category: "regulatory_watch",
        message: `[${doc.type}] ${doc.title} (${doc.publication_date}) — matched "${term}". ${doc.html_url} — for Evelyn Marchetti review; not a legal conclusion.`,
      });
      flagged++;
      if (highlights.length < 5) highlights.push(`${doc.type}: ${doc.title}`);
    }

    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("briefing_items").insert({
      agent_id: agent.id,
      briefing_date: today,
      section: "regulatory_watch",
      content:
        `Amara weekly regulatory scan (Federal Register, ${since}→${today}, ${TERMS.length} terms): ` +
        `${seen.size} new document(s), ${flagged} flagged.` +
        (highlights.length ? ` Top: ${highlights.join(" | ")}` : "") +
        (errors.length ? ` Source errors: ${errors.join("; ")}` : "") +
        ` Scope note: state AG press releases pending (no unified API); FTC/CFPB/NHTSA direct feeds pending.`,
    });

    return {
      summary: `${seen.size} documents, ${flagged} flagged${errors.length ? `, ${errors.length} source error(s)` : ""}`,
      data: { documents: seen.size, flagged, errors: errors.length },
    };
  }),
);
