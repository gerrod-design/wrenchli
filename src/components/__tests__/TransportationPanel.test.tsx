/**
 * Render-state tests for the Mobility Brief 1 transportation panel.
 *
 * States covered (the brief's gate): no shop (unprefilled variant),
 * shop known with no attributes, shop with attributes set and
 * unset, and the Garage "getting your car back" variant
 * (directions home by ZIP once an outcome exists). Copy guards:
 * the banned word "diagnose" never appears, no partnership or
 * endorsement wording, no prices.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TransportationPanel, { MobilityAttributeChips } from "../TransportationPanel";
import type { MobilityShop } from "@/lib/transportationLinks";

const SHOP_WITH_ATTRS: MobilityShop = {
  id: "shop-1",
  name: "Test Auto Repair",
  address: "123 Main St",
  city: "Detroit",
  state: "MI",
  zip_code: "48201",
  lat: 42.35,
  lng: -83.06,
  offers_loaner: true,
  offers_shuttle: false,
  offers_pickup_delivery: true,
  mobility_notes: "Loaner with any repair over $500",
};

const SHOP_NO_ATTRS: MobilityShop = {
  ...SHOP_WITH_ATTRS,
  id: "shop-2",
  offers_loaner: false,
  offers_shuttle: false,
  offers_pickup_delivery: false,
  mobility_notes: null,
};

function allLinks(container: HTMLElement): HTMLAnchorElement[] {
  return Array.from(container.querySelectorAll("a"));
}

function linkByText(container: HTMLElement, text: string): HTMLAnchorElement {
  const link = allLinks(container).find((a) => a.textContent?.includes(text));
  if (!link) throw new Error(`no link containing "${text}"`);
  return link;
}

describe("TransportationPanel — no shop known", () => {
  it("renders the unprefilled variant: every option is a live outbound link", () => {
    const { container } = render(<TransportationPanel shop={null} />);

    expect(screen.getByText("Other ways to get around")).toBeInTheDocument();
    expect(screen.getByText("Ride services")).toBeInTheDocument();
    expect(screen.getByText("Public transit")).toBeInTheDocument();
    expect(screen.getByText("Car rentals")).toBeInTheDocument();

    const links = allLinks(container);
    expect(links.length).toBe(6);
    for (const link of links) {
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }

    // No destination prefill anywhere.
    expect(linkByText(container, "Uber").getAttribute("href")).not.toContain("dropoff");
    expect(linkByText(container, "Transit directions").getAttribute("href")).not.toContain(
      "destination"
    );
    // No shop section.
    expect(screen.queryByText(/This shop offers/)).not.toBeInTheDocument();
  });
});

describe("TransportationPanel — shop known, no attributes", () => {
  it("points the ride and transit links at the shop and renders no shop-offers section", () => {
    const { container } = render(<TransportationPanel shop={SHOP_NO_ATTRS} />);

    const toShop = linkByText(container, "Uber — ride to the shop");
    expect(toShop.getAttribute("href")).toContain("dropoff[latitude]=42.35");
    expect(toShop.getAttribute("href")).toContain("pickup[latitude]=my_location");

    const home = linkByText(container, "Uber — ride home from the shop");
    expect(home.getAttribute("href")).toContain("pickup[latitude]=42.35");
    expect(home.getAttribute("href")).not.toContain("dropoff");

    const transit = linkByText(container, "Transit directions to the shop");
    expect(transit.getAttribute("href")).toContain("travelmode=transit");
    expect(transit.getAttribute("href")).toContain(
      "destination=123%20Main%20St%2C%20Detroit%2C%20MI%2048201"
    );

    expect(screen.queryByText(/This shop offers/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Shop-reported/)).not.toBeInTheDocument();
  });
});

describe("TransportationPanel — shop with attributes", () => {
  it("shows only the set attributes, under the shop-reported heading, plus the shop's note", () => {
    render(<TransportationPanel shop={SHOP_WITH_ATTRS} />);

    expect(
      screen.getByText("This shop offers, as reported by the shop")
    ).toBeInTheDocument();
    expect(screen.getByText("Loaner cars")).toBeInTheDocument();
    expect(screen.getByText("Pickup and delivery")).toBeInTheDocument();
    // Unset attributes render nothing — no "no shuttle" claim.
    expect(screen.queryByText("Shuttle service")).not.toBeInTheDocument();
    expect(screen.queryByText(/no shuttle/i)).not.toBeInTheDocument();
    expect(screen.getByText("Loaner with any repair over $500")).toBeInTheDocument();
  });
});

describe("TransportationPanel — Garage return variant", () => {
  it("adds directions home by ZIP only when the outcome window is active", () => {
    const { container, rerender } = render(
      <TransportationPanel shop={SHOP_NO_ATTRS} homeZip="48201" />
    );
    expect(screen.queryByText("Transit directions home")).not.toBeInTheDocument();

    rerender(
      <TransportationPanel shop={SHOP_NO_ATTRS} homeZip="48201" showHomeDirections />
    );
    const home = linkByText(container, "Transit directions home");
    expect(home.getAttribute("href")).toContain("destination=48201");
  });

  it("without a ZIP, the home variant stays off even when requested", () => {
    render(<TransportationPanel shop={SHOP_NO_ATTRS} showHomeDirections />);
    expect(screen.queryByText("Transit directions home")).not.toBeInTheDocument();
  });
});

describe("TransportationPanel — copy discipline", () => {
  it("never uses the banned word, partnership wording, or prices", () => {
    // SHOP_NO_ATTRS: the panel's own copy is what is guarded here —
    // a shop's own note is the shop's words, not panel copy.
    const { container } = render(
      <TransportationPanel shop={SHOP_NO_ATTRS} homeZip="48201" showHomeDirections />
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/diagnose/i);
    expect(text).not.toMatch(/partner/i);
    expect(text).not.toMatch(/\$\s?\d/);
    expect(text).not.toMatch(/garage pro/i);
  });
});

describe("MobilityAttributeChips", () => {
  it("chip framing carries the shop-reported attribution in the chip", () => {
    render(<MobilityAttributeChips shop={SHOP_WITH_ATTRS} />);
    expect(screen.getByText("Shop-reported: loaner cars")).toBeInTheDocument();
    expect(screen.getByText("Shop-reported: pickup and delivery")).toBeInTheDocument();
    expect(screen.queryByText(/shuttle/i)).not.toBeInTheDocument();
  });

  it("renders nothing at all when no attribute is set", () => {
    const { container } = render(<MobilityAttributeChips shop={SHOP_NO_ATTRS} />);
    expect(container).toBeEmptyDOMElement();
  });
});
