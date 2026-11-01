import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ insert: vi.fn(async () => ({ error: null })) })),
    auth: { getSession: vi.fn() },
  },
}));

import { trackEvent, trackPlausibleEvent, type PlausibleEventName } from "../analytics";

const ALL_EVENTS: PlausibleEventName[] = [
  "garage_signup",
  "assessment_started",
  "assessment_completed",
  "handoff_sent",
  "shop_page_cta_click",
  "diy_guide_open",
  "video_play",
];

let plausibleMock: Mock;

beforeEach(() => {
  localStorage.clear();
  plausibleMock = vi.fn();
  window.plausible = plausibleMock as unknown as Window["plausible"];
});

afterEach(() => {
  delete window.plausible;
});

describe("trackPlausibleEvent", () => {
  it("forwards each of the seven funnel events of record, exactly once per call", () => {
    for (const name of ALL_EVENTS) {
      trackPlausibleEvent(name);
    }
    expect(plausibleMock).toHaveBeenCalledTimes(7);
    ALL_EVENTS.forEach((name, i) => {
      expect(plausibleMock.mock.calls[i][0]).toBe(name);
    });
  });

  it("passes allowlisted props through", () => {
    trackPlausibleEvent("assessment_completed", { vehicle_make: "Ford" });
    expect(plausibleMock).toHaveBeenCalledWith("assessment_completed", {
      props: { vehicle_make: "Ford" },
    });
  });

  it("strips anything not on the allowlist — symptoms, emails, VINs, free text", () => {
    const dirty = {
      vehicle_make: "Ford",
      symptom_text: "grinding noise when I brake",
      email: "driver@example.com",
      vin: "1HGBH41JXMN109186",
      name: "Some Driver",
      diagnosis: "worn brake pads",
    } as unknown as Parameters<typeof trackPlausibleEvent>[1];
    trackPlausibleEvent("assessment_completed", dirty);
    expect(plausibleMock).toHaveBeenCalledTimes(1);
    const [, options] = plausibleMock.mock.calls[0];
    expect(options).toEqual({ props: { vehicle_make: "Ford" } });
    const sent = JSON.stringify(options);
    expect(sent).not.toContain("grinding");
    expect(sent).not.toContain("example.com");
    expect(sent).not.toContain("1HGBH41JXMN109186");
    expect(sent).not.toContain("brake pads");
  });

  it("is a no-op when the Plausible script is absent", () => {
    delete window.plausible;
    expect(() => trackPlausibleEvent("garage_signup")).not.toThrow();
  });

  it("never throws even if the plausible implementation throws", () => {
    window.plausible = (() => {
      throw new Error("blocked");
    }) as unknown as Window["plausible"];
    expect(() => trackPlausibleEvent("garage_signup")).not.toThrow();
  });
});

describe("trackEvent with plausible forwarding", () => {
  it("forwards the mapped event once and keeps plausible_* out of the stored row", async () => {
    await trackEvent({
      event_type: "user_action",
      category: "navigation",
      action: "assessment_results_shown",
      plausible_event: "assessment_completed",
      plausible_props: { vehicle_make: "Ford" },
    });

    expect(plausibleMock).toHaveBeenCalledTimes(1);
    expect(plausibleMock).toHaveBeenCalledWith("assessment_completed", {
      props: { vehicle_make: "Ford" },
    });

    const pending = JSON.parse(localStorage.getItem("pending_analytics") || "[]");
    expect(pending).toHaveLength(1);
    expect(pending[0].action).toBe("assessment_results_shown");
    expect(pending[0]).not.toHaveProperty("plausible_event");
    expect(pending[0]).not.toHaveProperty("plausible_props");
  });

  it("does not call Plausible for ordinary events", async () => {
    await trackEvent({
      event_type: "user_action",
      category: "navigation",
      action: "some_click",
    });
    expect(plausibleMock).not.toHaveBeenCalled();
    const pending = JSON.parse(localStorage.getItem("pending_analytics") || "[]");
    expect(pending).toHaveLength(1);
  });
});
