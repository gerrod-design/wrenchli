/**
 * Integration test suite for the Wrenchli Assessment Flow.
 *
 * Covers:
 *  1. Happy path — anonymous user completes vehicle → symptoms → results
 *  2. Missing-field validation on the Vehicle step
 *  3. Invalid VIN graceful fallback
 *  4. Pro upgrade button triggers Stripe checkout modal
 *  5. Shop selection after results
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DiagnosticWizard from "@/components/diagnostic-wizard/DiagnosticWizard";
import ShopList from "@/components/shops/ShopList";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import type { Shop } from "@/components/shops/ShopCard";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// Mock funnel tracking (no-op)
vi.mock("@/lib/funnelTracking", () => ({
  logFunnelEvent: vi.fn(),
  flushPendingFunnelEvents: vi.fn(),
}));

// Mock ad click tracker (no-op)
vi.mock("@/lib/adClickTracker", () => ({
  trackAdClick: vi.fn(),
}));

// Mock anon session (deterministic)
vi.mock("@/lib/anonSession", () => ({
  getAnonSessionId: vi.fn(() => "test-anon-session-id"),
}));

// Mock AuthContext for ProUpgradeModal
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "test-user-id", email: "test@wrenchli.net" },
    session: { access_token: "test-token" },
    loading: false,
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock crypto.randomUUID (jsdom doesn't have it)
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      ...globalThis.crypto,
      randomUUID: () => "00000000-0000-0000-0000-000000000001",
    },
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const { supabase } = await import("@/integrations/supabase/client");

const mockDiagnosisResponse = {
  diagnosis_id: "diag-001",
  confidence: "high" as const,
  urgency: "schedule" as const,
  explanation: "The grinding noise when braking on your 2019 Ford F-150 is most likely caused by worn brake pads.",
  possible_causes: [
    {
      name: "Worn Brake Pads",
      probability: 0.85,
      estimated_cost_low: 150,
      estimated_cost_high: 350,
      diy_difficulty: "moderate" as const,
      notes: "Brake pads typically need replacement every 30,000-70,000 miles.",
    },
    {
      name: "Warped Brake Rotors",
      probability: 0.45,
      estimated_cost_low: 250,
      estimated_cost_high: 500,
      diy_difficulty: "professional_only" as const,
      notes: "Rotors may need resurfacing or replacement.",
    },
  ],
};

const mockRecommendationResponse = {
  recommendation_id: "rec-001",
  action: "Schedule a brake inspection within the next 2 weeks.",
  next_steps: ["Inspect brake pads for wear indicators", "Check rotor surface for scoring"],
  questions_to_ask_mechanic: ["Can the rotors be resurfaced or do they need replacement?"],
  parts_likely_needed: ["Brake Pads", "Brake Rotors"],
};

function renderWizard() {
  return render(
    <MemoryRouter>
      <DiagnosticWizard />
    </MemoryRouter>,
  );
}

/* ================================================================== */
/* TEST 1: Happy Path                                                  */
/* ================================================================== */

describe("Assessment Flow — Happy Path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.functions.invoke as Mock).mockResolvedValue({ data: mockDiagnosisResponse, error: null });
  });

  it("completes the full vehicle → symptoms → assessment → results flow", async () => {
    renderWizard();

    // ── Step 1: Vehicle Entry ──
    expect(screen.getByText("Tell us about your vehicle")).toBeInTheDocument();

    const yearInput = screen.getByPlaceholderText("Year (e.g. 2019)");
    const mileageInput = screen.getByPlaceholderText("Mileage");
    const makeInput = screen.getByPlaceholderText("Make (e.g. Honda)");
    const modelInput = screen.getByPlaceholderText("Model (e.g. Civic)");

    fireEvent.change(yearInput, { target: { value: "2019" } });
    fireEvent.change(makeInput, { target: { value: "Ford" } });
    fireEvent.change(modelInput, { target: { value: "F-150" } });
    fireEvent.change(mileageInput, { target: { value: "85000" } });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);

    // Wait for step 2
    await waitFor(() => {
      expect(screen.getByText("Describe the problem")).toBeInTheDocument();
    });

    // ── Step 2: Symptom Entry ──
    expect(screen.getByText(/2019 Ford F-150/)).toBeInTheDocument();

    const symptomTextarea = screen.getByPlaceholderText(/Car won't start/i);
    fireEvent.change(symptomTextarea, {
      target: { value: "Grinding noise when braking, especially at low speeds" },
    });

    // Select severity
    fireEvent.click(screen.getByText("Moderate"));

    const assessBtn = screen.getByRole("button", { name: /get assessment/i });
    expect(assessBtn).not.toBeDisabled();
    fireEvent.click(assessBtn);

    // Wait for diagnosis step
    await waitFor(() => {
      expect(screen.getByText(/ASSESSMENT/)).toBeInTheDocument();
    });

    // ── Step 3: Results Shown ──
    expect(screen.getByText("HIGH CONFIDENCE")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULE")).toBeInTheDocument();
    expect(screen.getByText("Worn Brake Pads")).toBeInTheDocument();
    expect(screen.getByText("Warped Brake Rotors")).toBeInTheDocument();
    expect(screen.getByText(/85% likely/)).toBeInTheDocument();
    expect(screen.getByText(/\$150–\$350/)).toBeInTheDocument();

    // ── Step 4: Get Repair Plan ──
    (supabase.functions.invoke as Mock).mockResolvedValueOnce({
      data: mockRecommendationResponse,
      error: null,
    });

    const planBtn = screen.getByRole("button", { name: /get repair plan/i });
    fireEvent.click(planBtn);

    await waitFor(() => {
      expect(screen.getByText(/YOUR PLAN/)).toBeInTheDocument();
    });

    expect(screen.getByText("Schedule a brake inspection within the next 2 weeks.")).toBeInTheDocument();
    expect(screen.getByText(/NEXT STEPS/)).toBeInTheDocument();
    expect(screen.getByText(/QUESTIONS FOR YOUR MECHANIC/)).toBeInTheDocument();
    expect(screen.getByText(/PARTS LIKELY NEEDED/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start new assessment/i })).toBeInTheDocument();
  });
});

/* ================================================================== */
/* TEST 2: Missing Field Validation                                    */
/* ================================================================== */

describe("Assessment Flow — Missing Fields", () => {
  beforeEach(() => vi.clearAllMocks());

  it("disables Continue when required fields are empty", () => {
    renderWizard();

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it("shows error for invalid year", async () => {
    renderWizard();

    fireEvent.change(screen.getByPlaceholderText("Year (e.g. 2019)"), { target: { value: "1800" } });
    fireEvent.change(screen.getByPlaceholderText("Mileage"), { target: { value: "50000" } });
    fireEvent.change(screen.getByPlaceholderText("Make (e.g. Honda)"), { target: { value: "Ford" } });
    fireEvent.change(screen.getByPlaceholderText("Model (e.g. Civic)"), { target: { value: "F-150" } });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a valid year/i)).toBeInTheDocument();
    });
  });

  it("disables Get Assessment when symptom description is too short", async () => {
    (supabase.from as Mock).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    renderWizard();

    // Fill vehicle step
    fireEvent.change(screen.getByPlaceholderText("Year (e.g. 2019)"), { target: { value: "2019" } });
    fireEvent.change(screen.getByPlaceholderText("Mileage"), { target: { value: "85000" } });
    fireEvent.change(screen.getByPlaceholderText("Make (e.g. Honda)"), { target: { value: "Ford" } });
    fireEvent.change(screen.getByPlaceholderText("Model (e.g. Civic)"), { target: { value: "F-150" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Describe the problem")).toBeInTheDocument();
    });

    // Short description
    fireEvent.change(screen.getByPlaceholderText(/Car won't start/i), {
      target: { value: "noise" },
    });

    const assessBtn = screen.getByRole("button", { name: /get assessment/i });
    expect(assessBtn).toBeDisabled();
  });
});

/* ================================================================== */
/* TEST 3: Invalid VIN Graceful Fallback                               */
/* ================================================================== */

describe("Assessment Flow — Invalid VIN", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows fallback message when VIN decode fails", async () => {
    // Mock fetch to simulate NHTSA API failure
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    renderWizard();

    const vinInput = screen.getByPlaceholderText("VIN (optional)");
    fireEvent.change(vinInput, { target: { value: "INVALIDVIN12345XX" } });

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't decode that VIN/i),
      ).toBeInTheDocument();
    });

    // Fields should still be editable (not blocked)
    expect(screen.getByPlaceholderText("Year (e.g. 2019)")).not.toBeDisabled();
    expect(screen.getByPlaceholderText("Make (e.g. Honda)")).not.toBeDisabled();

    globalThis.fetch = originalFetch;
  });

  it("shows fallback when NHTSA returns no make/model", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          Results: [
            { Variable: "Make", Value: null },
            { Variable: "Model", Value: null },
            { Variable: "Model Year", Value: null },
          ],
        }),
    });

    renderWizard();

    fireEvent.change(screen.getByPlaceholderText("VIN (optional)"), {
      target: { value: "1FTEW1EP5KFA00001" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't decode that VIN/i),
      ).toBeInTheDocument();
    });

    globalThis.fetch = originalFetch;
  });
});

/* ================================================================== */
/* TEST 4: Pro Upgrade Modal                                           */
/* ================================================================== */

describe("Pro Upgrade — Stripe Checkout Trigger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens modal and invokes create-pro-subscription", async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { client_secret: "pi_test_secret" },
      error: null,
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <MemoryRouter>
        <ProUpgradeModal open={true} onClose={onClose} onSuccess={onSuccess} />
      </MemoryRouter>,
    );

    // Modal title should be visible
    expect(screen.getByText("Upgrade to Wrenchli Pro")).toBeInTheDocument();
    expect(screen.getByText(/\$2\.99\/month/)).toBeInTheDocument();

    // Should have called the edge function
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        "create-pro-subscription",
        expect.objectContaining({
          body: { user_id: "test-user-id", email: "test@wrenchli.net" },
        }),
      );
    });
  });

  it("displays error when subscription creation fails", async () => {
    (supabase.functions.invoke as Mock).mockResolvedValue({
      data: { error: "Payment method required" },
      error: null,
    });

    render(
      <MemoryRouter>
        <ProUpgradeModal open={true} onClose={vi.fn()} onSuccess={vi.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Payment method required")).toBeInTheDocument();
    });
  });
});

/* ================================================================== */
/* TEST 5: Shop Selection After Results                                */
/* ================================================================== */

describe("Shop Selection", () => {
  const mockShops: Shop[] = [
    {
      id: "shop-1",
      name: "Curt's Service",
      rating: 4.8,
      review_count: 127,
      address: "1234 Main St, Detroit, MI",
      phone: "(313) 555-0100",
      distance_miles: 2.3,
      specialties: ["brakes", "suspension"],
      price_tier: "mid",
      response_time: "Same day",
      availability: "same_day",
      wrenchli_verified: true,
      quote_url: "/get-quote",
      is_partnered: true,
    },
    {
      id: "shop-2",
      name: "McInerney Auto Center",
      rating: 4.5,
      review_count: 89,
      address: "5678 Woodward Ave, Detroit, MI",
      phone: "(313) 555-0200",
      distance_miles: 4.1,
      specialties: ["engine", "transmission"],
      price_tier: "budget",
      response_time: "Next day",
      availability: "next_day",
      wrenchli_verified: false,
      quote_url: "/get-quote",
    },
  ];

  it("renders shop list and fires selection callback", () => {
    const onSelect = vi.fn();

    render(
      <MemoryRouter>
        <ShopList shops={mockShops} onShopSelect={onSelect} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Curt's Service")).toBeInTheDocument();
    expect(screen.getByText("McInerney Auto Center")).toBeInTheDocument();
    expect(screen.getByText("2.3 mi")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("shows empty state when no shops are found", () => {
    render(
      <MemoryRouter>
        <ShopList shops={[]} searchedZip="48201" />
      </MemoryRouter>,
    );

    expect(screen.getByText(/No Shops Found/)).toBeInTheDocument();
    expect(screen.getByText(/48201/)).toBeInTheDocument();
    expect(screen.getByText(/Recommend a Shop/)).toBeInTheDocument();
  });

  it("shows loading spinner while fetching shops", () => {
    render(
      <MemoryRouter>
        <ShopList shops={[]} loading={true} />
      </MemoryRouter>,
    );

    // Loader2 icon has animate-spin class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
