import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { plausibleSpy, signInStub, signUpStub } = vi.hoisted(() => ({
  plausibleSpy: vi.fn(),
  signInStub: vi.fn(async () => ({ error: null as string | null })),
  signUpStub: vi.fn(async () => ({ error: null as string | null })),
}));

vi.mock("@/lib/analytics", () => ({
  trackPlausibleEvent: plausibleSpy,
  trackEvent: vi.fn(),
  trackAdImpression: vi.fn(),
  trackAnalyticsAdClick: vi.fn(),
  trackConversion: vi.fn(),
  flushEvents: vi.fn(async () => {}),
  trackPagePerformance: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isAdmin: false,
    loading: false,
    signIn: signInStub,
    signUp: signUpStub,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { token: "tok-abc" }, error: null })),
        })),
      })),
    })),
  },
}));

vi.mock("@/components/SectionReveal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/PhoneMockup", () => ({
  default: (props: { onPlayingChange: (playing: boolean) => void }) => (
    <div>
      <button onClick={() => props.onPlayingChange(true)}>mock-play</button>
      <button onClick={() => props.onPlayingChange(false)}>mock-stop</button>
    </div>
  ),
}));

import AuthGateModal from "../AuthGateModal";
import ShareWithShopButton from "../ShareWithShopButton";
import HowItWorksVideo from "../HowItWorksVideo";

beforeEach(() => {
  plausibleSpy.mockClear();
  signInStub.mockClear();
  signUpStub.mockClear();
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: vi.fn(async () => {}) },
    configurable: true,
  });
});

describe("garage_signup — AuthGateModal", () => {
  // The Radix dialog renders in a portal on document.body, not in the
  // render container — query the document for the form fields.
  function fillCredentials() {
    fireEvent.change(document.querySelector('input[type="email"]')!, {
      target: { value: "driver@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "secret123" },
    });
  }

  it("fires exactly once when a garage account is created", async () => {
    render(<AuthGateModal open onClose={() => {}} onAuthenticated={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await screen.findByText(/Check your email for a confirmation link/);
    expect(signUpStub).toHaveBeenCalledTimes(1);
    // Called with the event name only — no props, and never the email.
    expect(plausibleSpy.mock.calls).toEqual([["garage_signup"]]);
    expect(JSON.stringify(plausibleSpy.mock.calls)).not.toContain("example.com");
  });

  it("does not fire on sign-in", async () => {
    const onAuthenticated = vi.fn();
    render(<AuthGateModal open onClose={() => {}} onAuthenticated={onAuthenticated} />);
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await vi.waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(plausibleSpy).not.toHaveBeenCalled();
  });
});

describe("handoff_sent — ShareWithShopButton", () => {
  it("fires exactly once when the referral package is created, with only the vehicle make", async () => {
    render(
      <ShareWithShopButton
        diagnosisTitle="Worn brake pads"
        vehicleMake="Ford"
        vehicleModel="F-150"
        vin="1HGBH41JXMN109186"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Share with Shop/ }));

    await screen.findByText("Referral Package Created!");
    expect(plausibleSpy).toHaveBeenCalledTimes(1);
    expect(plausibleSpy).toHaveBeenCalledWith("handoff_sent", { vehicle_make: "Ford" });
    const sent = JSON.stringify(plausibleSpy.mock.calls);
    expect(sent).not.toContain("1HGBH41JXMN109186");
    expect(sent).not.toContain("tok-abc");
    expect(sent).not.toContain("brake pads");
  });
});

describe("video_play — HowItWorksVideo", () => {
  it("fires exactly once, the first time the walkthrough starts playing", () => {
    render(<HowItWorksVideo />);
    fireEvent.click(screen.getByText("mock-play"));
    expect(plausibleSpy).toHaveBeenCalledTimes(1);
    expect(plausibleSpy).toHaveBeenCalledWith("video_play", { placement: "how_it_works" });
    fireEvent.click(screen.getByText("mock-stop"));
    fireEvent.click(screen.getByText("mock-play"));
    expect(plausibleSpy).toHaveBeenCalledTimes(1);
  });

  it("does not fire before anything plays", () => {
    render(<HowItWorksVideo />);
    expect(plausibleSpy).not.toHaveBeenCalled();
  });
});
