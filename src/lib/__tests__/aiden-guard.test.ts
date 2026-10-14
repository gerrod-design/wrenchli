/**
 * Acceptance tests for the Aiden combined guard
 * (supabase/functions/chat/aiden-guard.ts), per the 2026-10-13 combined
 * guard brief:
 *   (i)  a name ask on a symptom turn is blocked/converted so the
 *        preliminary assessment is delivered;
 *   (ii) legitimate name collection still works;
 *   (iii) the deploy-pipeline smoke test's two-turn scenario passes;
 *   plus Guard 1 (persona markers / handoff announcements stripped, Aiden
 *   delivers the content himself).
 *
 * The guard functions are pure; the model is represented by scripted
 * `regenerate` stubs, exactly as the chat handler uses them.
 */
import { describe, expect, it } from "vitest";
import {
  buildGuardContext,
  containsNameAsk,
  containsPreliminaryAssessment,
  enforceAidenGuards,
  evaluateReply,
  fallbackAssessment,
  REQUIRED_DISCLAIMER,
  stripPersonaHandoffs,
  TAKEOVER_LINE,
} from "../../../supabase/functions/chat/aiden-guard";

// The verbatim draft that failed the deploy-pipeline smoke test
// (run 38330226195, attempt 3, production, 2026-10-13).
const SMOKE_FAILING_DRAFT =
  "Got it — that's really helpful detail! What's your name so I can keep things personal as we dig into this?";

// The exact message set scripts/smoke-production.mjs sends.
const SMOKE_TURN1_MESSAGES = [
  { role: "user", content: "My 2018 Honda Civic is making a squealing noise when I brake." },
];
const smokeTurn2Messages = (reply1: string) => [
  ...SMOKE_TURN1_MESSAGES,
  { role: "assistant", content: reply1 },
  {
    role: "user",
    content:
      "It only squeals when I'm braking at low speed, started about two " +
      "weeks ago, and the car has 62,000 miles on it. No grinding noise, " +
      "no vibration.",
  },
];

// A compliant regeneration for the smoke scenario: Rule 0 Shop Required
// framing, exact phrase, mandated disclaimer, no name ask.
const COMPLIANT_ASSESSMENT =
  "Based on a preliminary assessment of what you're describing, that squealing under braking is most likely worn brake pads. " +
  "Brake work is a Shop Required job — a qualified technician should inspect them in person before you keep driving on it. " +
  "Pads for a 2018 Civic typically run $150 to $310 fitted.\n" +
  REQUIRED_DISCLAIMER;

const shopCtx = (messages: { role: string; content: string }[]) =>
  buildGuardContext({ messages, toolsCalled: [] });

describe("Guard 1 — persona markers and handoff announcements", () => {
  it("strips an [Agent: Sam] marker and keeps the content for Aiden to deliver", () => {
    const draft =
      "[Agent: Sam] For a 2018 Honda Civic in the Ann Arbor area, you're looking at $430-$620 for alternator replacement, parts and labor included.";
    const { text, changed } = stripPersonaHandoffs(draft);
    expect(changed).toBe(true);
    expect(text).not.toContain("[Agent:");
    expect(text).toContain("$430-$620");
    expect(text).toContain("alternator replacement");
  });

  it("removes a handoff announcement sentence but keeps the substance", () => {
    const draft =
      "Let me bring in Sam — she handles all things cost-related and knows the most about this. For your Civic, an alternator replacement usually runs $430-$620.";
    const { text } = stripPersonaHandoffs(draft);
    expect(text.toLowerCase()).not.toContain("bring in");
    expect(text.toLowerCase()).not.toContain("sam");
    expect(text).toContain("$430-$620");
  });

  it("returns a compliant reply byte-identical (no reformatting)", () => {
    const draft = "Happy to help with that.  Tell me more about when it happens?";
    const { text, changed } = stripPersonaHandoffs(draft);
    expect(changed).toBe(false);
    expect(text).toBe(draft);
  });

  it("a reply that is ONLY a handoff announcement falls back to Aiden's takeover line", async () => {
    const ctx = shopCtx([
      { role: "user", content: "How much does an alternator replacement cost for a 2018 Honda Civic?" },
    ]);
    const { text } = await enforceAidenGuards(
      "Let me bring in Sam — she handles all things cost-related.",
      ctx,
    );
    expect(text).toBe(TAKEOVER_LINE);
    expect(text).not.toContain("[Agent:");
  });
});

describe("Guard 2 context — the smoke scenario is an owed assessment", () => {
  it("builds an assessment-owed context from the exact smoke messages", () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    expect(ctx.vehicleKnown).toBe(true);
    expect(ctx.symptomPresent).toBe(true);
    expect(ctx.shopRequired).toBe(true);
    expect(ctx.categoryPhrase).toBe("your brakes");
    expect(ctx.assessmentAlreadyDelivered).toBe(false);
    expect(ctx.assessmentOwed).toBe(true);
  });

  it("flags the verbatim smoke-failing draft as a name-gate violation", () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const verdict = evaluateReply(SMOKE_FAILING_DRAFT, ctx);
    expect(verdict.ok).toBe(false);
    expect(verdict.violations).toContain("name-ask-preempts-assessment");
  });

  it("flags unframed likely-cause discussion in a Shop Required turn", () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more."));
    const verdict = evaluateReply(
      "That squealing is most likely worn brake pads, which usually run $150 to $310.",
      ctx,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.violations).toContain("missing-assessment-framing");
  });

  it("passes a compliant Shop Required turn that asks a follow-up instead", () => {
    const ctx = shopCtx(SMOKE_TURN1_MESSAGES);
    const verdict = evaluateReply(
      "Squealing under braking is worth taking seriously — brakes are a Shop Required job, so a qualified technician should inspect them. Does it happen every time you slow down?",
      ctx,
    );
    expect(verdict.ok).toBe(true);
  });
});

describe("(i) name ask on a symptom turn is blocked/converted — assessment delivered", () => {
  it("regeneration path: final reply carries the assessment, not the name ask", async () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const { text, actions } = await enforceAidenGuards(
      SMOKE_FAILING_DRAFT,
      ctx,
      async () => COMPLIANT_ASSESSMENT,
    );
    expect(containsPreliminaryAssessment(text)).toBe(true);
    expect(containsNameAsk(text)).toBe(false);
    expect(actions).toContain("regenerated");
  });

  it("stubborn-model path: deterministic fallback still delivers a compliant assessment", async () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const { text, actions } = await enforceAidenGuards(
      SMOKE_FAILING_DRAFT,
      ctx,
      async () => "Sorry, but first — what's your name?",
    );
    expect(containsPreliminaryAssessment(text)).toBe(true);
    expect(containsNameAsk(text)).toBe(false);
    expect(text).toContain(REQUIRED_DISCLAIMER);
    expect(text).toContain("your brakes");
    expect(actions).toContain("deterministic-repair");
  });

  it("no-regeneration path: pure deflection draft converts to the fallback assessment", async () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const { text } = await enforceAidenGuards(SMOKE_FAILING_DRAFT, ctx);
    expect(containsPreliminaryAssessment(text)).toBe(true);
    expect(containsNameAsk(text)).toBe(false);
  });

  it("unframed cause content is rescued with its content intact, framing restored", async () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const { text } = await enforceAidenGuards(
      "That squealing is most likely worn brake pads, which usually run $150 to $310.",
      ctx,
    );
    expect(containsPreliminaryAssessment(text)).toBe(true);
    expect(text).toContain("worn brake pads");
    expect(text).toContain("$150 to $310");
  });
});

describe("(ii) legitimate name collection still works", () => {
  it("after the assessment is delivered, a name ask passes unchanged", async () => {
    const messages = [
      ...SMOKE_TURN1_MESSAGES,
      { role: "assistant", content: COMPLIANT_ASSESSMENT },
      { role: "user", content: "Okay, that makes sense. What should I ask the shop when I call?" },
    ];
    const ctx = shopCtx(messages);
    expect(ctx.assessmentAlreadyDelivered).toBe(true);
    expect(ctx.assessmentOwed).toBe(false);
    const draft =
      "Ask them to confirm the pad thickness before authorizing anything. By the way — what's your name, so I can keep these notes organized for you?";
    const { text } = await enforceAidenGuards(draft, ctx);
    expect(text).toBe(draft);
    expect(containsNameAsk(text)).toBe(true);
  });

  it("a name ask in the same reply AFTER the assessment is delivered in that reply is kept", async () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more about when it happens."));
    const draft =
      COMPLIANT_ASSESSMENT.split("\n")[0] +
      " And whenever you're ready — what's your name so I can personalize this?";
    const verdict = evaluateReply(draft, ctx);
    expect(verdict.ok).toBe(true);
  });

  it("in a no-assessment flow (prevention), an early name ask passes unchanged", async () => {
    const messages = [
      { role: "user", content: "My 2021 Toyota RAV4 is running great — what maintenance should I stay ahead of?" },
    ];
    const ctx = shopCtx(messages);
    expect(ctx.assessmentOwed).toBe(false);
    const draft = "Love that — staying ahead of it is the cheapest repair there is. First, what's your name?";
    const { text } = await enforceAidenGuards(draft, ctx);
    expect(text).toBe(draft);
  });
});

describe("(iii) deploy-pipeline smoke two-turn scenario", () => {
  it("turn 1 answers; turn 2 converges on 'preliminary assessment' even when the model first deflects", async () => {
    // Turn 1 — mirrors the smoke script's check (a): non-empty reply.
    const ctx1 = shopCtx(SMOKE_TURN1_MESSAGES);
    const reply1 = (
      await enforceAidenGuards(
        "Squealing when you brake is worth taking seriously. Does it happen every time you slow down, or only sometimes?",
        ctx1,
      )
    ).text;
    expect(reply1.trim().length).toBeGreaterThan(0);

    // Turn 2 — the model drafts the verbatim failing reply; the scripted
    // regeneration returns the compliant assessment. The smoke assertion is
    // reply2.toLowerCase().includes("preliminary assessment").
    const ctx2 = shopCtx(smokeTurn2Messages(reply1));
    const reply2 = (
      await enforceAidenGuards(SMOKE_FAILING_DRAFT, ctx2, async () => COMPLIANT_ASSESSMENT)
    ).text;
    expect(reply2.toLowerCase().includes("preliminary assessment")).toBe(true);

    // And if the model deflects twice, the deterministic fallback still
    // satisfies the smoke assertion.
    const reply2b = (
      await enforceAidenGuards(SMOKE_FAILING_DRAFT, ctx2, async () => SMOKE_FAILING_DRAFT)
    ).text;
    expect(reply2b.toLowerCase().includes("preliminary assessment")).toBe(true);
    expect(containsNameAsk(reply2b)).toBe(false);
  });
});

describe("guard-produced copy discipline", () => {
  it("fallback and takeover copy introduce no diagnose-family wording of their own", () => {
    const ctx = shopCtx(smokeTurn2Messages("Tell me more."));
    const fallback = fallbackAssessment(ctx);
    // The mandated disclaimer is pre-existing required text; outside it, the
    // guard's own copy must stay in assessment vocabulary.
    const withoutDisclaimer = fallback.replace(REQUIRED_DISCLAIMER, "");
    expect(/diagnos/i.test(withoutDisclaimer)).toBe(false);
    expect(/diagnos/i.test(TAKEOVER_LINE)).toBe(false);
  });
});
