/**
 * Public /financing page — honesty and sentinel render tests.
 *
 * With no live partner, the page must say partners are being
 * onboarded and present NO partner as available. When the public
 * query returns a partner (the SQL predicate guarantees it is a
 * real, active, ceiling-qualifying partner), it renders with the
 * apply-on-partner-site disclosure. Mock partner names must never
 * render: the mocked public query mirrors the data layer, which
 * excludes mocks even when active (proven against real Postgres in
 * financingMigration.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Financing from "@/pages/Financing";

const fetchMock = vi.fn();

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("@/components/WaitlistForm", () => ({
  default: () => <div data-testid="waitlist-form" />,
}));

vi.mock("@/components/SectionReveal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/financing", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/financing")>();
  return {
    ...original,
    fetchPublicFinancingPartners: (...args: unknown[]) => fetchMock(...args),
    createFinancingReferral: vi.fn(),
  };
});

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/financing?repair=850&diagnosis=Brake%20repair"]}>
        <Financing />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Financing page", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("is honest when no partner is live: onboarding copy, no partner presented", async () => {
    fetchMock.mockResolvedValue([]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Financing partners are being onboarded/i)).toBeTruthy(),
    );
    expect(screen.getByText(/No financing partner is live on Wrenchli yet/i)).toBeTruthy();
    expect(screen.queryByText(/Mock/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Apply on/i })).toBeNull();
  });

  it("renders a qualifying real partner with the partner-site disclosure", async () => {
    fetchMock.mockResolvedValue([
      {
        id: "p1",
        name: "Example Credit Union",
        partner_type: "credit_union",
        zero_percent_tier: false,
        apr_percent: 11.99,
        term_months: 12,
        min_amount_cents: 25000,
        max_amount_cents: 120000,
        rank_order: 10,
      },
    ]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Example Credit Union")).toBeTruthy(),
    );
    expect(screen.getByText(/11.99% APR · 12 months/)).toBeTruthy();
    expect(
      screen.getByText(/Your name and contact details are never sent by Wrenchli/i),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Apply on Example Credit Union's site/i }),
    ).toBeTruthy();
    expect(screen.queryByText(/Mock/)).toBeNull();
  });
});
