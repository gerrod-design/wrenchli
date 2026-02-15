import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mocks ── */

const mockProducts = [
  {
    id: "p1",
    title: "Brake Pad Set",
    description: "Premium ceramic pads",
    price: "$32.99",
    rating: 4.6,
    reviewCount: 14289,
    brand: "Bosch",
    asin: "B001TEST",
    link: "https://amazon.com/test",
    category: "part",
    prime: true,
    badge: "Best Seller",
  },
];

const mockServices = [
  {
    id: "svc1",
    company: "SafeAuto",
    service: "Insurance",
    description: "Coverage quote",
    price: "Free Quote",
    rating: 4.2,
    reviewCount: 1200,
    cta: "Get Quote",
    link: "https://example.com",
  },
];

let hookReturn = { data: null as any, loading: true };

vi.mock("@/hooks/useProductRecommendations", () => ({
  useProductRecommendations: () => hookReturn,
}));

vi.mock("@/lib/adClickTracker", () => ({
  trackAdClick: vi.fn(),
}));

vi.mock("@/data/adRecommendations", () => ({
  getLocalRecommendations: vi.fn(),
  getServiceRecommendations: vi.fn(() => mockServices),
  buildAmazonSearchLink: vi.fn((q: string) => `https://amazon.com/s?k=${q}`),
}));

const vehicleInfo = { year: 2020, make: "Honda", model: "Civic" };

beforeEach(() => {
  vi.clearAllMocks();
  hookReturn = { data: null, loading: true };
  document.body.innerHTML = "";
});

async function mount(props: Record<string, any> = {}) {
  const React = await import("react");
  const ReactDOM = await import("react-dom/client");
  const { default: ContextualAdvertising } = await import(
    "@/components/ContextualAdvertising"
  );

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const { act } = React;
  await act(async () => {
    root.render(
      React.createElement(ContextualAdvertising, {
        diagnosis: "Brake pad replacement",
        vehicleInfo,
        repairCost: 500,
        repairRecommendation: "repair",
        ...props,
      })
    );
  });

  return {
    text: () => container.textContent || "",
    html: () => container.innerHTML,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("ContextualAdvertising integration", () => {
  it("renders loading skeletons while data is loading", async () => {
    hookReturn = { data: null, loading: true };
    const { text, cleanup } = await mount();
    expect(text()).not.toContain("Brake Pad Set");
    cleanup();
  });

  it("renders nothing when data is null and not loading", async () => {
    hookReturn = { data: null, loading: false };
    const { text, cleanup } = await mount();
    expect(text()).toBe("");
    cleanup();
  });

  it("renders DIY section for low-cost easy repairs with products", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({
      repairCost: 500,
      diyFeasibility: "easy",
    });
    expect(text()).toContain("DIY Repair Option");
    expect(text()).toContain("Brake Pad Set");
    cleanup();
  });

  it("hides DIY section when cost exceeds threshold", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({
      repairCost: 6000,
      diyFeasibility: "easy",
    });
    expect(text()).not.toContain("DIY Repair Option");
    cleanup();
  });

  it("renders vehicle replacement section for replace recommendation", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({
      repairRecommendation: "replace",
      repairCost: 5000,
      userZipCode: "48201",
    });
    // The section renders with async vehicle search — shows loading or heading
    expect(text()).toContain("Finding Better Options");
    cleanup();
  });

  it("renders vehicle replacement for consider_both", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({
      repairRecommendation: "consider_both",
      repairCost: 4000,
      userZipCode: "48201",
    });
    expect(text()).toContain("Finding Better Options");
    cleanup();
  });

  it("hides vehicle replacement for repair-only", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({ repairRecommendation: "repair" });
    expect(text()).not.toContain("Consider Upgrading Instead");
    cleanup();
  });

  it("always renders service section in full placement", async () => {
    hookReturn = {
      data: { products: [], services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount();
    expect(text()).toContain("Protect Your Investment");
    expect(text()).toContain("SafeAuto");
    cleanup();
  });

  it("renders footer placement with vehicle heading", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({ placement: "footer" });
    expect(text()).toContain("More Options For Your 2020 Honda Civic");
    cleanup();
  });

  it("renders sidebar with featured product", async () => {
    hookReturn = {
      data: { products: mockProducts, services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({ placement: "sidebar" });
    expect(text()).toContain("Featured Product");
    expect(text()).toContain("Brake Pad Set");
    cleanup();
  });

  it("sidebar hides featured product when products empty", async () => {
    hookReturn = {
      data: { products: [], services: mockServices, source: "local" },
      loading: false,
    };
    const { text, cleanup } = await mount({ placement: "sidebar" });
    expect(text()).not.toContain("Featured Product");
    expect(text()).toContain("SafeAuto");
    cleanup();
  });
});
