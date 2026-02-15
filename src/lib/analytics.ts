import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */

export interface TrackingEvent {
  event_type: "ad_impression" | "ad_click" | "ad_conversion" | "page_view" | "user_action";
  category: "diy_product" | "vehicle_listing" | "service_ad" | "finance_option" | "navigation";
  action: string;
  label?: string;
  value?: number;
  user_id?: string;
  session_id: string;
  user_agent: string;
  page_url: string;
  page_title: string;
  referrer?: string;
  ad_placement?: string;
  ad_position?: number;
  ad_source?: string;
  item_id?: string;
  item_title?: string;
  item_brand?: string;
  item_category?: string;
  item_price?: string;
  item_url?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  repair_diagnosis?: string;
  repair_cost_estimate?: number;
  zip_code?: string;
  city?: string;
  state?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/* ─── Session ─── */

let sessionId: string | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return sessionId;
};

/* ─── Core tracking ─── */

export const trackEvent = async (event: Partial<TrackingEvent>): Promise<void> => {
  try {
    const fullEvent: TrackingEvent = {
      event_type: event.event_type || "user_action",
      category: event.category || "navigation",
      action: event.action || "unknown",
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
      ...event,
    };

    const pending: TrackingEvent[] = JSON.parse(localStorage.getItem("pending_analytics") || "[]");
    pending.push(fullEvent);
    localStorage.setItem("pending_analytics", JSON.stringify(pending));

    // Flush immediately for high-priority events
    if (event.event_type === "ad_click" || event.event_type === "ad_conversion") {
      await flushEvents();
    }
  } catch (error) {
    console.warn("Tracking event failed:", error);
  }
};

export const trackAdImpression = (props: {
  item_id: string;
  item_title: string;
  item_category: string;
  ad_placement: string;
  ad_position: number;
  ad_source: string;
  repair_diagnosis?: string;
  repair_cost_estimate?: number;
}) =>
  trackEvent({ event_type: "ad_impression", category: "diy_product", action: "impression", ...props });

export const trackAnalyticsAdClick = (props: {
  item_id: string;
  item_title: string;
  item_category: string;
  item_price?: string;
  item_url?: string;
  ad_placement: string;
  click_type: "product" | "vehicle" | "service" | "browse_more";
  repair_diagnosis?: string;
  repair_cost_estimate?: number;
}) =>
  trackEvent({
    event_type: "ad_click",
    category:
      props.click_type === "product"
        ? "diy_product"
        : props.click_type === "vehicle"
          ? "vehicle_listing"
          : "service_ad",
    action: "click",
    label: props.item_title,
    value: props.item_price ? parseFloat(props.item_price.replace(/[^\d.]/g, "")) : undefined,
    ...props,
  });

export const trackConversion = (props: {
  conversion_type: "purchase" | "lead" | "signup" | "quote_request";
  value?: number;
  item_id?: string;
  source_ad?: string;
}) =>
  trackEvent({
    event_type: "ad_conversion",
    category: "navigation",
    action: props.conversion_type,
    value: props.value,
    item_id: props.source_ad,
    ...props,
  });

/* ─── Batch flush ─── */

export const flushEvents = async (): Promise<void> => {
  try {
    const raw = localStorage.getItem("pending_analytics");
    if (!raw) return;
    const pending: TrackingEvent[] = JSON.parse(raw);
    if (pending.length === 0) return;

    // Clear immediately to prevent double-sends
    localStorage.setItem("pending_analytics", "[]");

    const { error } = await supabase.from("analytics_events" as any).insert(pending as any);
    if (error) {
      console.error("Failed to flush analytics:", error);
      // Re-queue failed events
      const current = JSON.parse(localStorage.getItem("pending_analytics") || "[]");
      localStorage.setItem("pending_analytics", JSON.stringify([...pending, ...current]));
    }
  } catch (error) {
    console.warn("Flush analytics failed:", error);
  }
};

// Auto-flush every 30s and on page unload
if (typeof window !== "undefined") {
  setInterval(flushEvents, 30_000);
  window.addEventListener("beforeunload", () => void flushEvents());
}

/* ─── Performance tracking ─── */

export const trackPagePerformance = (): void => {
  if (typeof window === "undefined" || !("performance" in window)) return;
  window.addEventListener("load", () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;
      const start = nav.startTime;
      trackEvent({
        event_type: "page_view",
        category: "navigation",
        action: "page_load",
        value: nav.loadEventEnd - nav.loadEventStart,
        metadata: {
          dns_time: nav.domainLookupEnd - nav.domainLookupStart,
          ttfb: nav.responseStart - nav.requestStart,
          dom_interactive: nav.domInteractive - start,
          dom_complete: nav.domComplete - start,
          load_complete: nav.loadEventEnd - start,
        },
      });
    }, 0);
  });
};

/* ─── A/B Testing ─── */

interface ABVariant {
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

interface ABTestConfig {
  test_name: string;
  variants: ABVariant[];
}

const tests = new Map<string, ABTestConfig>();
const userVariants = new Map<string, string>();

export const ABTester = {
  registerTest(config: ABTestConfig) {
    tests.set(config.test_name, config);
  },

  getVariant(testName: string, userId?: string): string {
    const test = tests.get(testName);
    if (!test) return "control";

    const userKey = userId || getSessionId();
    const existing = userVariants.get(`${testName}_${userKey}`);
    if (existing) return existing;

    const random = Math.random();
    let cumulative = 0;
    for (const v of test.variants) {
      cumulative += v.weight;
      if (random <= cumulative) {
        userVariants.set(`${testName}_${userKey}`, v.name);
        trackEvent({
          event_type: "user_action",
          category: "navigation",
          action: "ab_test_assignment",
          label: `${testName}:${v.name}`,
          metadata: { test_name: testName, variant: v.name },
        });
        return v.name;
      }
    }
    return test.variants[0]?.name || "control";
  },

  getVariantConfig(testName: string, userId?: string): Record<string, unknown> {
    const test = tests.get(testName);
    if (!test) return {};
    const variant = this.getVariant(testName, userId);
    return test.variants.find((v) => v.name === variant)?.config || {};
  },

  trackOutcome(testName: string, outcome: "conversion" | "bounce" | "engagement", userId?: string) {
    const variant = this.getVariant(testName, userId);
    trackEvent({
      event_type: "ad_conversion",
      category: "navigation",
      action: "ab_test_outcome",
      label: `${testName}:${variant}:${outcome}`,
      metadata: { test_name: testName, variant, outcome },
    });
  },
};

// Register default tests
ABTester.registerTest({
  test_name: "ad_placement_test",
  variants: [
    { name: "control", weight: 0.33, config: { placement: "full_section" } },
    { name: "sidebar", weight: 0.33, config: { placement: "sidebar" } },
    { name: "mixed", weight: 0.34, config: { placement: "mixed" } },
  ],
});

ABTester.registerTest({
  test_name: "product_display_test",
  variants: [
    { name: "control", weight: 0.5, config: { show_prices: true, show_ratings: true } },
    { name: "minimal", weight: 0.5, config: { show_prices: true, show_ratings: false } },
  ],
});
