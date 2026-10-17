import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import JourneyStepSection from "@/components/journey/JourneyStepSection";
import type { PlanStep } from "@/lib/journeyPlan";

const step: PlanStep = {
  step: "getting_around",
  title: "Getting around",
  items: [
    {
      key: "rideshare_slot",
      label: "Rideshare",
      kind: "real",
      description: "Rideshare can cover short hops while your vehicle is out.",
      links: [
        { label: "Open Uber", url: "https://www.uber.com" },
        { label: "Open Lyft", url: "https://www.lyft.com" },
      ],
    },
    {
      key: "tow_slot",
      label: "Towing",
      kind: "partner_slot",
      description: "Arrange a tow to get the vehicle from its current location to the shop.",
    },
  ],
};

describe("JourneyStepSection", () => {
  it("renders links for real items with target=_blank", () => {
    render(<JourneyStepSection step={step} surface="consumer" />);

    const uberLink = screen.getByRole("link", { name: "Open Uber" });
    expect(uberLink).toHaveAttribute("href", "https://www.uber.com");
    expect(uberLink).toHaveAttribute("target", "_blank");
    expect(uberLink).toHaveAttribute("rel", "noreferrer");

    const lyftLink = screen.getByRole("link", { name: "Open Lyft" });
    expect(lyftLink).toHaveAttribute("href", "https://www.lyft.com");
    expect(lyftLink).toHaveAttribute("target", "_blank");
    expect(lyftLink).toHaveAttribute("rel", "noreferrer");
  });

  it("still renders the partner slot badge for partner_slot items", () => {
    render(<JourneyStepSection step={step} surface="consumer" />);
    expect(screen.getByText(/Partner launching soon/i)).toBeInTheDocument();
  });
});