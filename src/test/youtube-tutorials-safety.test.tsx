import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import YouTubeTutorials from "@/components/diagnosis/YouTubeTutorials";

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const smart = [
  { query: "brake pads 2019 Civic DIY", label: "Your Vehicle", angle: "model_specific" as const },
  { query: "how to replace brake pads step by step", label: "Step-by-Step", angle: "technique" as const },
  { query: "2019 Civic brake pads troubleshooting", label: "Troubleshooting", angle: "troubleshooting" as const },
];

describe("YouTubeTutorials safety-critical handling", () => {
  it("renames the heading and drops the Step-by-Step angle for brake jobs", () => {
    render(
      <YouTubeTutorials diagnosisTitle="Worn brake pads" vehicle="2019 Honda Civic" smartQueries={smart} />
    );
    expect(screen.getByText("See what's involved")).toBeInTheDocument();
    expect(screen.queryByText("DIY Tutorials for Worn brake pads")).not.toBeInTheDocument();
    expect(screen.queryByText("Step-by-Step")).not.toBeInTheDocument();
    expect(screen.getByText("Your Vehicle")).toBeInTheDocument();
    expect(screen.getByText("Troubleshooting")).toBeInTheDocument();
    const more = screen.getByRole("link", { name: /Search YouTube for more videos/ });
    expect(more.getAttribute("href")).toContain("repair+explained");
    expect(more.getAttribute("href")).not.toContain("DIY");
  });

  it("keeps tutorial language and all three angles for a non-safety title", () => {
    render(
      <YouTubeTutorials diagnosisTitle="Cabin air filter replacement" vehicle="2019 Honda Civic" smartQueries={smart} />
    );
    expect(screen.getByText("DIY Tutorials for Cabin air filter replacement")).toBeInTheDocument();
    expect(screen.getByText("Step-by-Step")).toBeInTheDocument();
  });

  it("avoids DIY and step-by-step queries in the fallback list for a steering issue", () => {
    render(<YouTubeTutorials diagnosisTitle="Steering wheel play" vehicle="2019 Honda Civic" smartQueries={[]} />);
    const cards = screen.getAllByText(/^"/).map((n) => n.textContent);
    expect(cards).toHaveLength(2);
    cards.forEach((c) => {
      expect(c).not.toMatch(/DIY/i);
      expect(c).not.toMatch(/step by step/i);
    });
  });
});
