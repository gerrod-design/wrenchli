import { describe, it, expect } from "vitest";
import {
  evaluateE1,
  evaluateE2,
  evaluateE3,
  evaluateE4,
  evaluateE5Mileage,
  evaluateE5Seasonal,
  evaluateE6,
  evaluateE7,
  evaluateE8,
  evaluateE8Marker,
  evaluateE9,
  existingKeySet,
  type AssessmentRecord,
  type ExistingRow,
} from "@/lib/proactive/events";

const NOW = new Date("2026-10-26T15:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const keys = (rows: ExistingRow[]) => existingKeySet(rows);

function assessment(over: Partial<AssessmentRecord> = {}): AssessmentRecord {
  return {
    sessionId: "sess-1",
    userId: "user-1",
    status: "complete",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    vehicleName: "2021 Honda Accord",
    completedAt: daysAgo(3),
    urgency: "schedule",
    likelyCause: "a worn wheel bearing",
    actedOn: false,
    ...over,
  };
}

describe("E1 assessment follow-through", () => {
  it("fires once the assessment is 48h old with no next step", () => {
    const c = evaluateE1(assessment(), new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.eventType).toBe("E1");
    expect(c!.sourceKey).toBe("session:sess-1");
    expect(c!.payload.safety).toBe(false);
  });

  it("does not fire before 48 hours", () => {
    expect(evaluateE1(assessment({ completedAt: hoursAgo(47) }), new Set(), NOW)).toBeNull();
  });

  it("does not fire when the user acted on the assessment", () => {
    expect(evaluateE1(assessment({ actedOn: true }), new Set(), NOW)).toBeNull();
  });

  it("does not fire without a stated likely cause or a vehicle name", () => {
    expect(evaluateE1(assessment({ likelyCause: null }), new Set(), NOW)).toBeNull();
    expect(evaluateE1(assessment({ vehicleName: null }), new Set(), NOW)).toBeNull();
  });

  it("fires only once per assessment", () => {
    const existing = keys([{ eventType: "E1", sourceKey: "session:sess-1", state: "dismissed" }]);
    expect(evaluateE1(assessment(), existing, NOW)).toBeNull();
  });

  it("safety tier fires at 24 hours, not the standard 48", () => {
    const c = evaluateE1(assessment({ urgency: "immediate", completedAt: hoursAgo(25) }), new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.sourceKey).toBe("session:sess-1:safety");
    expect(c!.payload.safety).toBe(true);
    expect(evaluateE1(assessment({ urgency: "immediate", completedAt: hoursAgo(23) }), new Set(), NOW)).toBeNull();
  });

  it("safety tier re-fires once at 72 hours when the first touch exists", () => {
    const existing = keys([{ eventType: "E1", sourceKey: "session:sess-1:safety", state: "dismissed" }]);
    const c = evaluateE1(assessment({ urgency: "immediate", completedAt: hoursAgo(73) }), existing, NOW);
    expect(c).not.toBeNull();
    expect(c!.sourceKey).toBe("session:sess-1:safety:refire");
    // and never a third time
    const withRefire = keys([
      { eventType: "E1", sourceKey: "session:sess-1:safety", state: "dismissed" },
      { eventType: "E1", sourceKey: "session:sess-1:safety:refire", state: "shown" },
    ]);
    expect(evaluateE1(assessment({ urgency: "immediate", completedAt: hoursAgo(100) }), withRefire, NOW)).toBeNull();
  });

  it("safety tier does not re-fire before 72 hours", () => {
    const existing = keys([{ eventType: "E1", sourceKey: "session:sess-1:safety", state: "shown" }]);
    expect(evaluateE1(assessment({ urgency: "immediate", completedAt: hoursAgo(50) }), existing, NOW)).toBeNull();
  });
});

describe("E6 abandoned assessment", () => {
  it("fires after 24h of inactivity when the user entered something", () => {
    const c = evaluateE6({ ...assessment({ status: "intake", completedAt: null, updatedAt: hoursAgo(25) }), hasContent: true }, new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.eventType).toBe("E6");
  });

  it("does not fire for a bare session with nothing entered", () => {
    expect(evaluateE6({ ...assessment({ status: "intake", completedAt: null, updatedAt: hoursAgo(25) }), hasContent: false }, new Set(), NOW)).toBeNull();
  });

  it("fires for an explicitly abandoned session even without content rows", () => {
    const c = evaluateE6({ ...assessment({ status: "abandoned", completedAt: null, updatedAt: hoursAgo(25) }), hasContent: false }, new Set(), NOW);
    expect(c).not.toBeNull();
  });

  it("does not fire inside 24h or for completed sessions", () => {
    expect(evaluateE6({ ...assessment({ status: "intake", completedAt: null, updatedAt: hoursAgo(5) }), hasContent: true }, new Set(), NOW)).toBeNull();
    expect(evaluateE6({ ...assessment({ status: "complete" }), hasContent: true }, new Set(), NOW)).toBeNull();
  });
});

describe("E4 stale estimate", () => {
  const estimate = {
    sessionId: "sess-1",
    diagnosisId: "diag-1",
    userId: "user-1",
    vehicleName: "2021 Honda Accord",
    item: "wheel bearing replacement",
    costLow: 320,
    costHigh: 540,
    viewedAt: daysAgo(8),
    actedOn: false,
  };

  it("fires 7 days after the estimate was viewed with no action", () => {
    const c = evaluateE4(estimate, new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.sourceKey).toBe("diagnosis:diag-1");
  });

  it("does not fire before 7 days, after action, or twice", () => {
    expect(evaluateE4({ ...estimate, viewedAt: daysAgo(6) }, new Set(), NOW)).toBeNull();
    expect(evaluateE4({ ...estimate, actedOn: true }, new Set(), NOW)).toBeNull();
    const existing = keys([{ eventType: "E4", sourceKey: "diagnosis:diag-1", state: "shown" }]);
    expect(evaluateE4(estimate, existing, NOW)).toBeNull();
  });
});

describe("E2 repair status changed", () => {
  const change = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    kind: "repair_completed" as const,
    recordTable: "maintenance_records",
    recordId: "rec-1",
    occurredAt: hoursAgo(2),
    hasFinalCost: true,
  };

  it("fires for a fresh repair record", () => {
    const c = evaluateE2(change, new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.category).toBe("repair_updates");
  });

  it("does not fire for records older than 14 days", () => {
    expect(evaluateE2({ ...change, occurredAt: daysAgo(15) }, new Set(), NOW)).toBeNull();
  });

  it("batches two completions inside the same hour for one vehicle into one key", () => {
    const first = evaluateE2(change, new Set(), NOW)!;
    const second = evaluateE2(
      { ...change, recordId: "rec-2", occurredAt: hoursAgo(2) },
      keys([{ eventType: "E2", sourceKey: first.sourceKey, state: "pending" }]),
      NOW,
    );
    expect(second).toBeNull();
  });
});

describe("E7 post-repair check-in", () => {
  const repair = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    recordTable: "repair_history" as const,
    recordId: "rec-1",
    repairLabel: "brake pad replacement",
    completedDate: daysAgo(11),
    outcomeAlreadyReported: false,
  };

  it("fires 10 days after completion", () => {
    expect(evaluateE7(repair, new Set(), NOW)).not.toBeNull();
  });

  it("does not fire at 9 days, after 60 days, or when the outcome is already reported", () => {
    expect(evaluateE7({ ...repair, completedDate: daysAgo(9) }, new Set(), NOW)).toBeNull();
    expect(evaluateE7({ ...repair, completedDate: daysAgo(61) }, new Set(), NOW)).toBeNull();
    expect(evaluateE7({ ...repair, outcomeAlreadyReported: true }, new Set(), NOW)).toBeNull();
  });

  it("fires only once per repair", () => {
    const existing = keys([{ eventType: "E7", sourceKey: "repair:repair_history:rec-1", state: "shown" }]);
    expect(evaluateE7(repair, existing, NOW)).toBeNull();
  });
});

describe("E3 new recall", () => {
  const finding = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    campaigns: [
      { campaignNumber: "24V064000", title: "Fuel pump", foundAt: hoursAgo(3) },
      { campaignNumber: "24V100000", title: "Seat belt buckle", foundAt: hoursAgo(2) },
    ],
  };

  it("batches same-day campaigns into one message", () => {
    const out = evaluateE3(finding, new Set());
    expect(out).toHaveLength(1);
    expect(out[0].payload.campaignCount).toBe(2);
    expect(out[0].payload.firstCampaignTitle).toBe("Fuel pump");
  });

  it("splits campaigns found on different days", () => {
    const out = evaluateE3(
      { ...finding, campaigns: [finding.campaigns[0], { ...finding.campaigns[1], foundAt: daysAgo(2) }] },
      new Set(),
    );
    expect(out).toHaveLength(2);
  });

  it("fires nothing when the same campaign set already queued", () => {
    const first = evaluateE3(finding, new Set());
    const existing = keys(first.map((c) => ({ eventType: "E3", sourceKey: c.sourceKey, state: "pending" })));
    expect(evaluateE3(finding, existing)).toHaveLength(0);
  });
});

describe("E8 recall status corrected", () => {
  const state = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    status: "ok" as const,
    checkedAt: hoursAgo(1),
    campaignsFound: 0,
  };

  it("records a suppressed marker when a failed check is observed", () => {
    const m = evaluateE8Marker({ ...state, status: "failed" });
    expect(m).not.toBeNull();
    expect(m!.initialState).toBe("suppressed");
    expect(evaluateE8Marker(state)).toBeNull();
  });

  it("fires only when a failure was observed before and the new check is clean", () => {
    const existing = keys([{ eventType: "E8", sourceKey: "veh:veh-1:failed-observed", state: "suppressed" }]);
    expect(evaluateE8(state, existing)).not.toBeNull();
    expect(evaluateE8(state, new Set())).toBeNull();
    expect(evaluateE8({ ...state, campaignsFound: 2 }, existing)).toBeNull();
    expect(evaluateE8({ ...state, status: "failed" }, existing)).toBeNull();
  });
});

describe("E5 seasonal and mileage prompts", () => {
  const seasonal = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    batteryLastCheckedAt: "2026-03-04",
    acLastCheckedAt: null,
  };

  it("fires the fall prompt inside the fall window (Oct 26)", () => {
    const c = evaluateE5Seasonal(seasonal, new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.payload.season).toBe("fall");
    expect(c!.payload.lastCheckedAt).toBe("2026-03-04");
  });

  it("does not fire outside a season window", () => {
    const jan = new Date("2027-01-15T15:00:00Z");
    expect(evaluateE5Seasonal(seasonal, new Set(), jan)).toBeNull();
  });

  it("fires once per user per season", () => {
    const existing = keys([{ eventType: "E5", sourceKey: "user:user-1:season:fall:2026", state: "shown" }]);
    expect(evaluateE5Seasonal(seasonal, existing, NOW)).toBeNull();
  });

  const due = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    alertId: "alert-1",
    serviceLabel: "Oil Change",
    readingMiles: 61250,
    readingDate: "2026-10-20",
    overdue: false,
    alertCreatedAt: hoursAgo(5),
    dismissedWithin90d: false,
    serviceCompletedSince: false,
  };

  it("mileage prompt fires for a fresh due alert on a sourced reading", () => {
    const c = evaluateE5Mileage(due, new Set(), NOW);
    expect(c).not.toBeNull();
    expect(c!.payload.subType).toBe("mileage");
  });

  it("mileage prompt stays silent when dismissed within 90 days, completed, or stale", () => {
    expect(evaluateE5Mileage({ ...due, dismissedWithin90d: true }, new Set(), NOW)).toBeNull();
    expect(evaluateE5Mileage({ ...due, serviceCompletedSince: true }, new Set(), NOW)).toBeNull();
    expect(evaluateE5Mileage({ ...due, alertCreatedAt: daysAgo(8) }, new Set(), NOW)).toBeNull();
  });
});

describe("E9 stale mileage", () => {
  const rec = {
    userId: "user-1",
    vehicleId: "veh-1",
    vehicleName: "2021 Honda Accord",
    latestReading: { miles: 58000, date: daysAgo(181).slice(0, 10) },
    vehicleCreatedAt: daysAgo(400),
  };

  it("fires when the newest reading is over 180 days old", () => {
    expect(evaluateE9(rec, new Set(), NOW)).not.toBeNull();
  });

  it("does not fire at 179 days", () => {
    expect(evaluateE9({ ...rec, latestReading: { miles: 58000, date: daysAgo(179).slice(0, 10) } }, new Set(), NOW)).toBeNull();
  });

  it("does not re-fire inside the same 180-day bucket, but can next bucket", () => {
    const first = evaluateE9(rec, new Set(), NOW)!;
    const sameBucket = keys([{ eventType: "E9", sourceKey: first.sourceKey, state: "dismissed" }]);
    expect(evaluateE9(rec, sameBucket, NOW)).toBeNull();
    const nextPeriod = new Date(NOW.getTime() + 180 * 24 * 3600_000);
    expect(evaluateE9(rec, sameBucket, nextPeriod)).not.toBeNull();
  });

  it("fires for a vehicle with no reading 30 days after it was added, not before", () => {
    const noReading = { ...rec, latestReading: null, vehicleCreatedAt: daysAgo(31) };
    expect(evaluateE9(noReading, new Set(), NOW)).not.toBeNull();
    expect(evaluateE9({ ...noReading, vehicleCreatedAt: daysAgo(29) }, new Set(), NOW)).toBeNull();
  });
});
