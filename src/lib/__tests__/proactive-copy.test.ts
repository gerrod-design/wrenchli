import { describe, it, expect } from "vitest";
import {
  messageFor,
  reasonFor,
  actionLabelFor,
  SETTINGS_TITLE,
  SETTINGS_DESCRIPTION,
  MASTER_LABEL,
  MASTER_DESCRIPTION,
  CATEGORY_COPY,
  RECALL_TOGGLE_LABEL,
  RECALL_TOGGLE_DESCRIPTION,
  RECALL_SAFETY_WARNING,
  DISMISS_LABEL,
} from "@/lib/proactive/copy";

// The copy sweep: every string this feature can put in front of a user is
// generated here from representative payloads and checked against the
// spec's hard rules. If a future edit breaks a rule, this file fails.

const SAMPLES: { eventType: string; payload: Record<string, unknown> }[] = [
  { eventType: "E1", payload: { vehicleName: "2021 Honda Accord", completedAt: "2026-10-23T15:00:00Z", likelyCause: "a worn wheel bearing", safety: false } },
  { eventType: "E1", payload: { vehicleName: "2021 Honda Accord", completedAt: "2026-10-23T15:00:00Z", likelyCause: "failing brakes", safety: true } },
  { eventType: "E2", payload: { vehicleName: "2021 Honda Accord", kind: "repair_completed", hasFinalCost: true } },
  { eventType: "E2", payload: { vehicleName: "2021 Honda Accord", kind: "repair_completed", hasFinalCost: false } },
  { eventType: "E2", payload: { vehicleName: "2021 Honda Accord", kind: "package_created", hasFinalCost: false } },
  { eventType: "E3", payload: { vehicleName: "2021 Honda Accord", campaignCount: 1, firstCampaignTitle: "Fuel pump" } },
  { eventType: "E3", payload: { vehicleName: "2021 Honda Accord", campaignCount: 3, firstCampaignTitle: "Fuel pump" } },
  { eventType: "E4", payload: { vehicleName: "2021 Honda Accord", item: "wheel bearing replacement", costLow: 320, costHigh: 540 } },
  { eventType: "E5", payload: { subType: "seasonal", vehicleName: "2021 Honda Accord", season: "fall", lastCheckedAt: "2026-03-04" } },
  { eventType: "E5", payload: { subType: "seasonal", vehicleName: "2021 Honda Accord", season: "fall", lastCheckedAt: null } },
  { eventType: "E5", payload: { subType: "seasonal", vehicleName: "2021 Honda Accord", season: "spring", lastCheckedAt: null } },
  { eventType: "E5", payload: { subType: "mileage", vehicleName: "2021 Honda Accord", serviceLabel: "Oil Change", readingMiles: 61250, readingDate: "2026-10-20", overdue: false } },
  { eventType: "E5", payload: { subType: "mileage", vehicleName: "2021 Honda Accord", serviceLabel: "Oil Change", readingMiles: 61250, readingDate: "2026-10-20", overdue: true } },
  { eventType: "E6", payload: { vehicleName: "2021 Honda Accord" } },
  { eventType: "E6", payload: { vehicleName: null } },
  { eventType: "E7", payload: { vehicleName: "2021 Honda Accord", repairLabel: "brake pad replacement" } },
  { eventType: "E8", payload: { vehicleName: "2021 Honda Accord" } },
  { eventType: "E9", payload: { vehicleName: "2021 Honda Accord", lastReadingMiles: 58000, lastReadingDate: "2026-04-01" } },
  { eventType: "E9", payload: { vehicleName: "2021 Honda Accord", lastReadingMiles: null, lastReadingDate: null } },
];

function allStrings(): string[] {
  const out: string[] = [
    SETTINGS_TITLE, SETTINGS_DESCRIPTION, MASTER_LABEL, MASTER_DESCRIPTION,
    RECALL_TOGGLE_LABEL, RECALL_TOGGLE_DESCRIPTION, RECALL_SAFETY_WARNING, DISMISS_LABEL,
    ...Object.values(CATEGORY_COPY).flatMap((c) => [c.label, c.description]),
  ];
  for (const s of SAMPLES) {
    out.push(messageFor(s.eventType, s.payload));
    out.push(reasonFor(s.eventType, s.payload));
    out.push(actionLabelFor(s.eventType, s.payload));
  }
  return out;
}

describe("proactive copy — verbatim strings", () => {
  it("E1 standard matches the spec intent", () => {
    expect(messageFor("E1", SAMPLES[0].payload)).toBe(
      "Your preliminary assessment for the 2021 Honda Accord from Friday pointed to a worn wheel bearing. You haven't picked a next step yet. Want me to lay out your options: what can wait, what can't, and what fair looks like?",
    );
  });

  it("E3 single matches the spec intent and promises no monitoring", () => {
    expect(messageFor("E3", SAMPLES[5].payload)).toBe(
      "A new recall was issued for your 2021 Honda Accord: Fuel pump. This is a manufacturer repair, done free at a dealer. The details are on the car's record in your Garage.",
    );
  });

  it("E4 presents the range as a snapshot, never a live quote", () => {
    expect(messageFor("E4", SAMPLES[7].payload)).toBe(
      "You looked at an estimate for wheel bearing replacement on the 2021 Honda Accord last week: $320–$540. Prices move, so treat that number as a snapshot. Want a fresh look, or help deciding what to do with it?",
    );
  });

  it("E5 mileage matches the spec intent", () => {
    expect(messageFor("E5", SAMPLES[11].payload)).toBe(
      "Based on the reading on record (61,250 miles, Oct 20, 2026), the 2021 Honda Accord is around due for Oil Change. This is a maintenance reminder, not a problem found.",
    );
  });

  it("E6, E7, E8, E9 match the spec intents", () => {
    expect(messageFor("E6", SAMPLES[13].payload)).toBe(
      "You started telling me about the 2021 Honda Accord yesterday and we didn't finish. Pick up where you left off? What you already entered is saved.",
    );
    expect(messageFor("E7", SAMPLES[15].payload)).toBe(
      "Ten days since the brake pad replacement on the 2021 Honda Accord was marked done. How is it holding up: fixed, partly, or is the problem back? Your answer goes on the car's record.",
    );
    expect(messageFor("E8", SAMPLES[16].payload)).toBe(
      "Recall status for the 2021 Honda Accord is now confirmed: no open recalls found.",
    );
    expect(messageFor("E9", SAMPLES[17].payload)).toBe(
      "I don't have a current mileage for the 2021 Honda Accord (last reading 58,000 miles, Apr 1, 2026). A fresh odometer photo keeps its service reminders and record accurate.",
    );
  });

  it("every event produces a non-empty message, reason, and action", () => {
    for (const s of SAMPLES) {
      expect(messageFor(s.eventType, s.payload).length).toBeGreaterThan(10);
      expect(reasonFor(s.eventType, s.payload).length).toBeGreaterThan(10);
      expect(actionLabelFor(s.eventType, s.payload).length).toBeGreaterThan(2);
    }
  });
});

describe("proactive copy — the sweep", () => {
  const BANNED: [RegExp, string][] = [
    [/diagnos/i, "the word 'diagnose' in any form"],
    [/keep an eye|we('| wi)ll (watch|monitor|track)|monitoring|watching (your|over)/i, "a promise of continuous monitoring"],
    [/matched with a shop|shop is waiting|a shop near you|book (a|your) (shop|appointment)/i, "a shop-matching or booking implication"],
    [/\b(Detroit|Columbus|Chicago|Houston|Dallas|Atlanta)\b/, "a city name"],
    [/\b(Sam|Mike|Jess|Kai|Priya)\b/, "a non-Aiden persona name"],
  ];

  it("no user-facing string breaks a hard rule", () => {
    for (const str of allStrings()) {
      for (const [pattern, label] of BANNED) {
        expect(str, `"${str}" contains ${label}`).not.toMatch(pattern);
      }
    }
  });
});
