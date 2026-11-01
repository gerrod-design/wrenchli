import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  trackEvent: trackEventMock,
  trackPlausibleEvent: vi.fn(),
}));

import PageViewTracker from "../PageViewTracker";

function NavButtons() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate("/garage")}>go-garage</button>
      <button onClick={() => navigate("/garage?tab=history")}>go-garage-history</button>
      <button onClick={() => navigate("/faq")}>go-faq</button>
    </div>
  );
}

function Harness() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <PageViewTracker />
      <NavButtons />
      <Routes>
        <Route path="*" element={<div>page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const pageViewCalls = () =>
  trackEventMock.mock.calls.filter(
    ([arg]) => arg?.event_type === "page_view" && arg?.action === "page_view"
  );

beforeEach(() => {
  trackEventMock.mockClear();
});

describe("PageViewTracker", () => {
  it("records exactly one page_view for the landing route", () => {
    render(<Harness />);
    expect(pageViewCalls()).toHaveLength(1);
  });

  it("records one page_view per route change, including query changes", () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText("go-garage"));
    expect(pageViewCalls()).toHaveLength(2);
    fireEvent.click(getByText("go-garage-history"));
    expect(pageViewCalls()).toHaveLength(3);
    fireEvent.click(getByText("go-faq"));
    expect(pageViewCalls()).toHaveLength(4);
  });

  it("does not re-fire when the same route is navigated to again", () => {
    const { getByText } = render(<Harness />);
    fireEvent.click(getByText("go-garage"));
    fireEvent.click(getByText("go-garage"));
    expect(pageViewCalls()).toHaveLength(2);
  });

  it("sends the standard home-built page_view shape", () => {
    render(<Harness />);
    const [arg] = pageViewCalls()[0];
    expect(arg).toEqual({
      event_type: "page_view",
      category: "navigation",
      action: "page_view",
    });
  });
});
