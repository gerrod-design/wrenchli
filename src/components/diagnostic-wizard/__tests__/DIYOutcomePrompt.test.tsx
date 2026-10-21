/**
 * Batch 8 (wizard fix, from Batch 7 report §6 item 5):
 * DIYOutcomePrompt must NOT show "Thanks" when the outcome submission fails.
 * On failure it shows an honest error state with a retry path; the success
 * path is unchanged.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DIYOutcomePrompt from "@/components/diagnostic-wizard/steps/DIYOutcomePrompt";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const THANKS = /thanks/i;

describe("DIYOutcomePrompt submission honesty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("network failure: shows an error state with retry, NOT thanks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(<DIYOutcomePrompt sessionId="sess-1" />);
    fireEvent.click(screen.getByRole("button", { name: /yes, fixed it/i }));
    await waitFor(() =>
      expect(screen.getByText(/couldn't send your answer/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(THANKS)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again|retry/i })).toBeInTheDocument();
  });

  it("HTTP 500 from the function: shows an error state, NOT thanks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    render(<DIYOutcomePrompt sessionId="sess-1" />);
    fireEvent.click(screen.getByRole("button", { name: /tried, no luck/i }));
    await waitFor(() =>
      expect(screen.getByText(/couldn't send your answer/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(THANKS)).not.toBeInTheDocument();
  });

  it("success: shows thanks exactly as before", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }),
    );
    render(<DIYOutcomePrompt sessionId="sess-1" />);
    fireEvent.click(screen.getByRole("button", { name: /yes, fixed it/i }));
    await waitFor(() => expect(screen.getByText(THANKS)).toBeInTheDocument());
  });

  it("retry after a failure can succeed and then shows thanks", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<DIYOutcomePrompt sessionId="sess-1" />);
    fireEvent.click(screen.getByRole("button", { name: /yes, fixed it/i }));
    const retry = await screen.findByRole("button", { name: /try again|retry/i });
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByText(THANKS)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
