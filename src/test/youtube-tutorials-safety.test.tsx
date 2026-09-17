import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import YouTubeTutorials from "@/components/diagnosis/YouTubeTutorials";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const smart = [
  { query: "worn brake pads 2019 Honda Civic", label: "Your specific car", angle: "model_specific" as const },
  { query: "how to replace brake pads step by step", label: "Replace pads procedure", angle: "technique" as const },
  { query: "2019 Honda Civic brake pad troubleshooting", label: "Why they grind", angle: "troubleshooting" as const },
];

describe("YouTubeTutorials safety-critical handling", () => {
  it("renames the heading and drops the Step-by-Step angle for brake jobs", () => {
    render(
      <YouTubeTutorials diagnosisTitle="Worn brake pads" vehicle="2019 Honda Civic" smartQueries={smart} />
    );
    const heading = screen.getByRole("heading", { level: 4 });
    expect(heading.textContent).toContain("See what's involved");
    expect(heading.textContent).not.toContain("DIY Tutorials");
    expect(screen.queryByText("Step-by-Step")).not.toBeInTheDocument();
    expect(screen.getByText("Your Vehicle")).toBeInTheDocument();
    expect(screen.getByText("Troubleshooting")).toBeInTheDocument();
    expect(screen.queryByText("Replace pads procedure")).not.toBeInTheDocument();
    const more = screen.getByRole("link", { name: /Search YouTube for more videos/ });
    expect(more.getAttribute("href")).toContain("repair%20explained");
    expect(more.getAttribute("href")).not.toContain("DIY");
  });

  it("keeps tutorial language and all three angles for a non-safety title", () => {
    render(
      <YouTubeTutorials diagnosisTitle="Cabin air filter replacement" vehicle="2019 Honda Civic" smartQueries={smart} />
    );
    const heading = screen.getByRole("heading", { level: 4 });
    expect(heading.textContent).toContain("DIY Tutorials for Cabin air filter replacement");
    expect(screen.getByText("Step-by-Step")).toBeInTheDocument();
    expect(screen.getByText("Replace pads procedure")).toBeInTheDocument();
  });

  it("avoids DIY and step-by-step queries in the fallback list for a steering issue", () => {
    render(<YouTubeTutorials diagnosisTitle="Steering wheel play" vehicle="2019 Honda Civic" smartQueries={[]} />);
    const cards = screen.getAllByText(/^"/).map((n) => n.textContent ?? "");
    expect(cards).toHaveLength(2);
    cards.forEach((c) => {
      expect(c).not.toMatch(/DIY/i);
      expect(c).not.toMatch(/step by step/i);
    });
  });
});
