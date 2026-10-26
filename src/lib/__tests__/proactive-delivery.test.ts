import { describe, it, expect } from "vitest";
import {
  selectDelivery,
  DEFAULT_PREFS,
  type PendingMessage,
  type ProactivePrefs,
  type ShownRecord,
} from "@/lib/proactive/delivery";

// Mon Oct 26, 2026, 15:00 UTC = 11:00 AM in America/Detroit (EDT).
const NOW = new Date("2026-10-26T15:00:00Z");
const TZ = "America/Detroit";
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

let seq = 0;
function msg(over: Partial<PendingMessage> = {}): PendingMessage {
  seq += 1;
  return {
    id: `m-${seq}`,
    eventType: "E5",
    category: "service_prompts",
    sourceKey: `k-${seq}`,
    payload: {},
    eligibleAt: hoursAgo(1),
    createdAt: hoursAgo(2),
    ...over,
  };
}

function decide(
  pending: PendingMessage[],
  over: { shown?: ShownRecord[]; prefs?: Partial<ProactivePrefs>; now?: Date; acted?: Set<string> } = {},
) {
  return selectDelivery({
    pending,
    shownHistory: over.shown ?? [],
    prefs: { ...DEFAULT_PREFS, ...(over.prefs ?? {}) },
    now: over.now ?? NOW,
    timeZone: TZ,
    actedKeys: over.acted ?? new Set<string>(),
  });
}

describe("delivery gate — basics", () => {
  it("shows the single pending message", () => {
    const m = msg();
    expect(decide([m]).show?.id).toBe(m.id);
  });

  it("shows nothing with an empty queue", () => {
    expect(decide([]).show).toBeNull();
  });

  it("does not show a message before its eligible time", () => {
    const m = msg({ eligibleAt: hoursAgo(-3) });
    expect(decide([m]).show).toBeNull();
  });
});

describe("delivery gate — quiet hours (21:00-08:00 user local)", () => {
  it("blocks delivery at 10 PM local", () => {
    // 2026-10-27T02:00Z = 22:00 EDT Oct 26
    expect(decide([msg()], { now: new Date("2026-10-27T02:00:00Z") }).show).toBeNull();
  });

  it("blocks delivery at 7 AM local", () => {
    // 2026-10-26T11:00Z = 07:00 EDT
    expect(decide([msg()], { now: new Date("2026-10-26T11:00:00Z") }).show).toBeNull();
  });

  it("allows delivery at 8 AM local", () => {
    // 2026-10-26T12:00Z = 08:00 EDT; the message was queued and eligible earlier.
    const early = msg({ eligibleAt: "2026-10-26T10:00:00Z", createdAt: "2026-10-26T09:00:00Z" });
    expect(decide([early], { now: new Date("2026-10-26T12:00:00Z") }).show).not.toBeNull();
  });
});

describe("delivery gate — caps", () => {
  it("48h cap: a message shown 10h ago blocks ordinary events", () => {
    const shown: ShownRecord[] = [{ eventType: "E5", payload: {}, shownAt: hoursAgo(10) }];
    expect(decide([msg()], { shown }).show).toBeNull();
  });

  it("48h cap: an E3 recall may break the cap once", () => {
    const shown: ShownRecord[] = [{ eventType: "E5", payload: {}, shownAt: hoursAgo(10) }];
    const recall = msg({ eventType: "E3", category: "recalls" });
    expect(decide([recall], { shown }).show?.id).toBe(recall.id);
  });

  it("48h cap: an E2 repair completion may break the cap once", () => {
    const shown: ShownRecord[] = [{ eventType: "E1", payload: {}, shownAt: hoursAgo(10) }];
    const completion = msg({ eventType: "E2", category: "repair_updates", payload: { kind: "repair_completed" } });
    expect(decide([completion], { shown }).show?.id).toBe(completion.id);
    const pkg = msg({ eventType: "E2", category: "repair_updates", payload: { kind: "package_created" } });
    expect(decide([pkg], { shown }).show).toBeNull();
  });

  it("48h cap: no second break — a cap-breaker inside the window ends breaks", () => {
    const shown: ShownRecord[] = [{ eventType: "E3", payload: {}, shownAt: hoursAgo(10) }];
    const recall = msg({ eventType: "E3", category: "recalls" });
    expect(decide([recall], { shown }).show).toBeNull();
  });

  it("weekly cap: 3 shown inside 7 days blocks everything, recalls included", () => {
    const shown: ShownRecord[] = [
      { eventType: "E5", payload: {}, shownAt: daysAgo(1) },
      { eventType: "E1", payload: {}, shownAt: daysAgo(3) },
      { eventType: "E7", payload: {}, shownAt: daysAgo(5) },
    ];
    const recall = msg({ eventType: "E3", category: "recalls" });
    expect(decide([recall], { shown }).show).toBeNull();
  });

  it("weekly cap: messages shown more than 7 days ago do not count", () => {
    const shown: ShownRecord[] = [
      { eventType: "E5", payload: {}, shownAt: daysAgo(8) },
      { eventType: "E1", payload: {}, shownAt: daysAgo(9) },
      { eventType: "E7", payload: {}, shownAt: daysAgo(10) },
    ];
    expect(decide([msg()], { shown }).show).not.toBeNull();
  });
});

describe("delivery gate — priority", () => {
  it("E3 beats E5; E2 beats E1 safety; E1 safety beats E4; E4 beats E7; E7 beats E9", () => {
    const e5 = msg({ eventType: "E5" });
    const e3 = msg({ eventType: "E3", category: "recalls" });
    expect(decide([e5, e3]).show?.id).toBe(e3.id);

    const e1s = msg({ eventType: "E1", category: "assessment_followups", payload: { safety: true } });
    const e2 = msg({ eventType: "E2", category: "repair_updates", payload: { kind: "repair_completed" } });
    expect(decide([e1s, e2]).show?.id).toBe(e2.id);

    const e4 = msg({ eventType: "E4", category: "assessment_followups" });
    expect(decide([e4, e1s]).show?.id).toBe(e1s.id);

    const e7 = msg({ eventType: "E7", category: "post_repair_checkins" });
    expect(decide([e7, e4]).show?.id).toBe(e4.id);

    const e9 = msg({ eventType: "E9", category: "service_prompts" });
    expect(decide([e9, e7]).show?.id).toBe(e7.id);
  });

  it("within one tier, the earliest eligible message wins", () => {
    const later = msg({ eligibleAt: hoursAgo(1) });
    const earlier = msg({ eligibleAt: hoursAgo(5) });
    expect(decide([later, earlier]).show?.id).toBe(earlier.id);
  });
});

describe("delivery gate — opt-out at delivery time", () => {
  it("a category toggled off after queueing blocks that category now", () => {
    const m = msg({ eventType: "E5" });
    expect(decide([m], { prefs: { servicePrompts: false } }).show).toBeNull();
  });

  it("the recall safety toggle gates E3 and E8", () => {
    const recall = msg({ eventType: "E3", category: "recalls" });
    expect(decide([recall], { prefs: { recallAlertsEnabled: false } }).show).toBeNull();
    const e8 = msg({ eventType: "E8", category: "recalls" });
    expect(decide([e8], { prefs: { recallAlertsEnabled: false } }).show).toBeNull();
  });

  it("master switch off blocks everything but cancellations still apply", () => {
    const acted = msg({ eventType: "E1", category: "assessment_followups", sourceKey: "session:s1" });
    const d = decide([acted, msg()], { prefs: { masterEnabled: false }, acted: new Set(["E1:session:s1"]) });
    expect(d.show).toBeNull();
    expect(d.cancelIds).toContain(acted.id);
  });
});

describe("delivery gate — cancellation and expiry", () => {
  it("a pending message for an acted-on record is cancelled, never shown", () => {
    const acted = msg({ eventType: "E1", category: "assessment_followups", sourceKey: "session:s1" });
    const other = msg({ eventType: "E5" });
    const d = decide([acted, other], { acted: new Set(["E1:session:s1"]) });
    expect(d.cancelIds).toEqual([acted.id]);
    expect(d.show?.id).toBe(other.id);
  });

  it("pending messages older than 14 days expire instead of showing", () => {
    const stale = msg({ createdAt: daysAgo(15), eligibleAt: daysAgo(15) });
    const d = decide([stale]);
    expect(d.show).toBeNull();
    expect(d.expireIds).toEqual([stale.id]);
  });
});
