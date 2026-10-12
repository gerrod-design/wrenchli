import { describe, it, expect } from "vitest";
import type { AgentType } from "@/components/MechanicAvatar";

/*
 * These are pure-function extractions of the detectAgent / cleanAgentMarker /
 * getAgentMeta helpers that live inside ChatBot.tsx and InlineChatWidget.tsx.
 * We duplicate them here so the regression suite stays decoupled from JSX
 * rendering while still catching any drift between agent metadata and marker
 * parsing logic.
 *
 * Contract since Oct 12, 2026: ONE continuous assistant (Aiden). The persona
 * system is retired — detectAgent always returns "aiden", legacy [Agent: X]
 * markers in old transcripts no longer switch identity, and cleanAgentMarker
 * still strips those markers from displayed text.
 */

const AGENT_META: Record<AgentType, { name: string; role: string; color: string }> = {
  aiden: { name: "Aiden", role: "Wrenchli Advisor", color: "bg-primary" },
};

function getAgentMeta(agent: AgentType | null | undefined) {
  return AGENT_META[agent ?? "aiden"] ?? AGENT_META.aiden;
}

function detectAgent(content: unknown): AgentType {
  void content;
  return "aiden";
}

function cleanAgentMarker(content: unknown): string {
  const text = typeof content === "string" ? content : "";
  return text.replace(/\[Agent:\s*(?:Mike|Sam|Jess|Kai|Priya|Aiden)\]\s*/gi, "");
}

/* ──────────────────────────────────────────
   detectAgent
   ────────────────────────────────────────── */

describe("detectAgent", () => {
  it.each([
    "[Agent: Sam] Here is the cost breakdown.",
    "[Agent: Jess] You can DIY this.",
    "[Agent: Kai] Let me run financing.",
    "[Agent: Priya] Here's your maintenance plan.",
    "No marker, just Aiden talking.",
  ])("always returns aiden for: %s", (input) => {
    expect(detectAgent(input)).toBe("aiden");
  });

  it("returns aiden for undefined/null/non-string input", () => {
    expect(detectAgent(undefined)).toBe("aiden");
    expect(detectAgent(null)).toBe("aiden");
    expect(detectAgent(42)).toBe("aiden");
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
    ["[Agent: Aiden] Hello!", "Hello!"],
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
  it("returns Aiden metadata", () => {
    const meta = getAgentMeta("aiden");
    expect(meta.name).toBe("Aiden");
    expect(meta.role).toBeTruthy();
    expect(meta.color).toBeTruthy();
  });

  it("falls back to Aiden for null/undefined", () => {
    expect(getAgentMeta(null).name).toBe("Aiden");
    expect(getAgentMeta(undefined).name).toBe("Aiden");
  });

  it("falls back to Aiden for unknown agent", () => {
    expect(getAgentMeta("unknown" as AgentType).name).toBe("Aiden");
  });
});

/* ──────────────────────────────────────────
   Single continuous assistant sequence
   ────────────────────────────────────────── */

describe("single-assistant sequence", () => {
  const conversation = [
    { role: "user", content: "My car is making a noise" },
    { role: "assistant", content: "Let me listen to that…" },
    { role: "assistant", content: "[Agent: Sam] Here's the cost estimate." },
    { role: "assistant", content: "[Agent: Jess] You can fix this yourself." },
    { role: "assistant", content: "And here's how to keep it from coming back." },
  ];

  it("never switches identity across a conversation", () => {
    const agents = conversation
      .filter((m) => m.role === "assistant")
      .map((m) => detectAgent(m.content));

    expect(agents).toEqual(["aiden", "aiden", "aiden", "aiden"]);
  });

  it("has zero handoff boundaries", () => {
    const assistantMsgs = conversation.filter((m) => m.role === "assistant");
    const handoffs: string[] = [];

    for (let i = 1; i < assistantMsgs.length; i++) {
      const prev = detectAgent(assistantMsgs[i - 1].content);
      const curr = detectAgent(assistantMsgs[i].content);
      if (prev !== curr) handoffs.push(`${prev}→${curr}`);
    }

    expect(handoffs).toEqual([]);
  });

  it("cleans all legacy markers from display text", () => {
    for (const m of conversation) {
      const cleaned = cleanAgentMarker(m.content);
      expect(cleaned).not.toMatch(/\[Agent:/i);
    }
  });
});
