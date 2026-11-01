import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { plausibleSpy } = vi.hoisted(() => ({ plausibleSpy: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  trackPlausibleEvent: plausibleSpy,
  trackEvent: vi.fn(),
  trackAdImpression: vi.fn(),
  trackAnalyticsAdClick: vi.fn(),
  trackConversion: vi.fn(),
  flushEvents: vi.fn(async () => {}),
  trackPagePerformance: vi.fn(),
}));

vi.mock("@/components/SectionReveal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/integrations/supabase/client", () => {
  const tutorialRow = {
    id: "t1",
    slug: "test-guide",
    title: "Test Guide: Change Your Oil",
    description: "A test guide.",
    difficulty: "beginner",
    estimated_time_minutes: 30,
    estimated_savings_cents: 5000,
    video_url: null,
    instructions: [],
    parts_needed: [],
    tools_needed: [],
    safety_warnings: [],
    vehicle_types: [],
  };
  return {
    supabase: {
      from: vi.fn(() => {
        const chain: Record<string, unknown> = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: tutorialRow, error: null }),
        };
        return chain;
      }),
      auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    },
  };
});

import ForShops from "../ForShops";
import DIYTutorialDetail from "../DIYTutorialDetail";

beforeEach(() => {
  plausibleSpy.mockClear();
});

describe("shop_page_cta_click — ForShops", () => {
  it("fires exactly once when the pilot CTA is clicked", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ForShops />
        </MemoryRouter>
      </HelmetProvider>
    );
    fireEvent.click(screen.getByRole("link", { name: /Join the free pilot/ }));
    expect(plausibleSpy).toHaveBeenCalledTimes(1);
    expect(plausibleSpy).toHaveBeenCalledWith("shop_page_cta_click", {
      placement: "for_shops_pilot",
    });
  });
});

describe("diy_guide_open — DIYTutorialDetail", () => {
  it("fires exactly once when a guide has loaded, with the public guide slug", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/diy/test-guide"]}>
            <Routes>
              <Route path="/diy/:slug" element={<DIYTutorialDetail />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
    await screen.findByText("Test Guide: Change Your Oil");
    await vi.waitFor(() =>
      expect(plausibleSpy).toHaveBeenCalledWith("diy_guide_open", { guide: "test-guide" })
    );
    const opens = plausibleSpy.mock.calls.filter(([n]) => n === "diy_guide_open");
    expect(opens).toHaveLength(1);
  });
});
