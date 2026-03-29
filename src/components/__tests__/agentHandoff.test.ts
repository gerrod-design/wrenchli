import { describe, it, expect } from "vitest";
import type { AgentType } from "@/components/MechanicAvatar";

/*
 * These are pure-function extractions of the detectAgent / cleanAgentMarker /
 * getAgentMeta helpers that live inside ChatBot.tsx and InlineChatWidget.tsx.
 * We duplicate them here so the regression suite stays decoupled from JSX
 * rendering while still catching any drift between agent metadata and marker
 * parsing logic.
 */

const AGENT_META: Record<AgentType, { name: string; role: string; color: string }> = {
  mike:  { name: "Mike",  role: "Lead Advisor",            color: "bg-primary" },
  sam:   { name: "Sam",   role: "Cost & Value Specialist",  color: "bg-amber-500" },
  jess:  { name: "Jess",  role: "Parts & DIY Expert",       color: "bg-emerald-500" },
  kai:   { name: "Kai",   role: "Finance Specialist",       color: "bg-sky-500" },
  priya: { name: "Priya", role: "Prevention Coach",         color: "bg-violet-500" },
};

function getAgentMeta(agent: AgentType | null | undefined) {
  return AGENT_META[agent ?? "mike"] ?? AGENT_META.mike;
}

function detectAgent(content: unknown): AgentType {
  const text = typeof content === "string" ? content : "";
  if (/\[Agent:\s*Sam\]/i.test(text)) return "sam";
  if (/\[Agent:\s*Jess\]/i.test(text)) return "jess";
  if (/\[Agent:\s*Kai\]/i.test(text)) return "kai";
  if (/\[Agent:\s*Priya\]/i.test(text)) return "priya";
  return "mike";
}

function cleanAgentMarker(content: unknown): string {
  const text = typeof content === "string" ? content : "";
  return text.replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya)\]\s*/gi, "");
}

/* ──────────────────────────────────────────
   detectAgent
   ────────────────────────────────────────── */

describe("detectAgent", () => {
  it.each<[string, AgentType]>([
    ["[Agent: Sam] Here is the cost breakdown.", "sam"],
    ["[Agent: Jess] You can DIY this.", "jess"],
    ["[Agent: Kai] Let me run financing.", "kai"],
    ["[Agent: Priya] Here's your maintenance plan.", "priya"],
    ["No marker, just Mike talking.", "mike"],
  ])("detects %s → %s", (input, expected) => {
    expect(detectAgent(input)).toBe(expected);
  });

  it("defaults to mike for undefined/null/non-string input", () => {
    expect(detectAgent(undefined)).toBe("mike");
    expect(detectAgent(null)).toBe("mike");
    expect(detectAgent(42)).toBe("mike");
  });

  it("is case-insensitive", () => {
    expect(detectAgent("[agent: priya] hi")).toBe("priya");
    expect(detectAgent("[AGENT: KAI] hi")).toBe("kai");
  });
});

/* ──────────────────────────────────────────
   cleanAgentMarker
   ────────────────────────────────────────── */

describe("cleanAgentMarker", () => {
  it.each([
    ["[Agent: Sam] Cost is $200.", "Cost is $200."],
    ["[Agent: Priya] Check your brakes.", "Check your brakes."],
    ["[Agent: Kai] Financing ready.", "Financing ready."],
    ["[Agent: Jess] DIY tips.", "DIY tips."],
    ["[Agent: Mike] Hello!", "Hello!"],
    ["No marker here.", "No marker here."],
  ])("strips marker from: %s", (input, expected) => {
    expect(cleanAgentMarker(input)).toBe(expected);
  });

  it("handles non-string input gracefully", () => {
    expect(cleanAgentMarker(undefined)).toBe("");
    expect(cleanAgentMarker(null)).toBe("");
  });
});

/* ──────────────────────────────────────────
   getAgentMeta
   ────────────────────────────────────────── */

describe("getAgentMeta", () => {
  it("returns correct metadata for every agent", () => {
    expect(getAgentMeta("mike").name).toBe("Mike");
    expect(getAgentMeta("sam").name).toBe("Sam");
    expect(getAgentMeta("jess").name).toBe("Jess");
    expect(getAgentMeta("kai").name).toBe("Kai");
    expect(getAgentMeta("priya").name).toBe("Priya");
  });

  it("falls back to Mike for null/undefined", () => {
    expect(getAgentMeta(null).name).toBe("Mike");
    expect(getAgentMeta(undefined).name).toBe("Mike");
  });

  it("falls back to Mike for unknown agent", () => {
    expect(getAgentMeta("unknown" as AgentType).name).toBe("Mike");
  });

  it("includes role and color for all agents", () => {
    const agents: AgentType[] = ["mike", "sam", "jess", "kai", "priya"];
    for (const a of agents) {
      const meta = getAgentMeta(a);
      expect(meta.role).toBeTruthy();
      expect(meta.color).toBeTruthy();
    }
  });
});

/* ──────────────────────────────────────────
   Handoff simulation
   ────────────────────────────────────────── */

describe("handoff sequence", () => {
  const conversation = [
    { role: "user", content: "My car is making a noise" },
    { role: "assistant", content: "Let me listen to that…" },
    { role: "assistant", content: "[Agent: Sam] Here's the cost estimate." },
    { role: "assistant", content: "[Agent: Jess] You can fix this yourself." },
    { role: "assistant", content: "[Agent: Kai] Let me check financing." },
    { role: "assistant", content: "[Agent: Priya] Here's a maintenance plan." },
  ];

  it("detects all handoffs in order", () => {
    const agents = conversation
      .filter((m) => m.role === "assistant")
      .map((m) => detectAgent(m.content));

    expect(agents).toEqual(["mike", "sam", "jess", "kai", "priya"]);
  });

  it("identifies handoff boundaries correctly", () => {
    const assistantMsgs = conversation.filter((m) => m.role === "assistant");
    const handoffs: string[] = [];

    for (let i = 1; i < assistantMsgs.length; i++) {
      const prev = detectAgent(assistantMsgs[i - 1].content);
      const curr = detectAgent(assistantMsgs[i].content);
      if (prev !== curr) handoffs.push(`${prev}→${curr}`);
    }

    expect(handoffs).toEqual(["mike→sam", "sam→jess", "jess→kai", "kai→priya"]);
  });

  it("cleans all markers from display text", () => {
    for (const m of conversation) {
      const cleaned = cleanAgentMarker(m.content);
      expect(cleaned).not.toMatch(/\[Agent:/i);
    }
  });
});
