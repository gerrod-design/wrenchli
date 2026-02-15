import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/data/adRecommendations", () => {
  const localProducts = [
    {
      id: "test-1",
      title: "Test Product",
      description: "desc",
      price: "$10",
      rating: 4.5,
      reviewCount: 100,
      brand: "TestBrand",
      asin: "B000TEST",
      link: "https://amazon.com/test",
      category: "part",
      prime: true,
    },
  ];

  const localServices = [
    {
      id: "svc-1",
      company: "TestCo",
      service: "Test Service",
      description: "desc",
      price: "Free",
      rating: 4.0,
      reviewCount: 50,
      cta: "Get Quote",
      link: "https://example.com",
    },
  ];

  return {
    getLocalRecommendations: vi.fn((diagnosis: string) => {
      if (diagnosis === "brake pad replacement") {
        return { products: localProducts, services: localServices, source: "local" };
      }
      return null;
    }),
    getServiceRecommendations: vi.fn(() => localServices),
    buildAmazonSearchLink: vi.fn((query: string) => `https://amazon.com/s?k=${query}`),
  };
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

const vehicleInfo = { year: 2020, make: "Honda", model: "Civic" };

// Minimal renderHook replacement to avoid @testing-library/react import issues
function renderHookManual<T>(hookFn: () => T) {
  const React = require("react");
  const ReactDOM = require("react-dom");

  let hookResult: { current: T } = { current: undefined as T };

  function TestComponent() {
    hookResult.current = hookFn();
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);

  // Use ReactDOM.render (React 18 compat via legacy API)
  const root = (ReactDOM as any).createRoot
    ? (ReactDOM as any).createRoot(container)
    : null;

  if (root) {
    const { act } = require("react");
    act(() => {
      root.render(React.createElement(TestComponent));
    });
  }

  return {
    result: hookResult,
    cleanup: () => {
      if (root) root.unmount();
      container.remove();
    },
  };
}

async function waitForValue(cb: () => void, timeout = 3000) {
  const start = Date.now();
  while (true) {
    try {
      cb();
      return;
    } catch (e) {
      if (Date.now() - start > timeout) throw e;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
}

describe("useProductRecommendations", () => {
  it("returns local data immediately when available", async () => {
    const { useProductRecommendations } = await import(
      "@/hooks/useProductRecommendations"
    );

    const { result, cleanup } = renderHookManual(() =>
      useProductRecommendations("brake pad replacement", undefined, vehicleInfo)
    );

    await waitForValue(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.source).toBe("local");
    expect(result.current.data?.products).toHaveLength(1);
    expect(result.current.data?.products[0].title).toBe("Test Product");
    expect(mockFetch).not.toHaveBeenCalled();
    cleanup();
  });

  it("fetches from AI when no local data is found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            title: "AI Product",
            description: "AI desc",
            price: "$20",
            brand: "AIBrand",
            search_query: "ai part",
            category: "part",
            rating: 4.2,
            review_count: 500,
          },
        ],
        diy_time_range: "1-2 hours",
        total_parts_range: "$50-$100",
      }),
    });

    const { useProductRecommendations } = await import(
      "@/hooks/useProductRecommendations"
    );

    const { result, cleanup } = renderHookManual(() =>
      useProductRecommendations("some unknown issue", "P9999", vehicleInfo)
    );

    await waitForValue(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.source).toBe("ai");
    expect(result.current.data?.products).toHaveLength(1);
    expect(result.current.data?.products[0].title).toBe("AI Product");
    expect(result.current.data?.products[0].id).toBe("ai-0");
    expect(result.current.data?.diyEstimate).toEqual({
      timeRange: "1-2 hours",
      totalPartsRange: "$50-$100",
    });
    cleanup();
  });

  it("falls back to local data when AI fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { useProductRecommendations } = await import(
      "@/hooks/useProductRecommendations"
    );

    const { result, cleanup } = renderHookManual(() =>
      useProductRecommendations("some unknown issue", undefined, vehicleInfo)
    );

    await waitForValue(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.source).toBe("local");
    expect(result.current.data?.services).toHaveLength(1);
    cleanup();
  });

  it("falls back when AI returns non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { useProductRecommendations } = await import(
      "@/hooks/useProductRecommendations"
    );

    const { result, cleanup } = renderHookManual(() =>
      useProductRecommendations("some unknown issue", "P1234", vehicleInfo)
    );

    await waitForValue(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.source).toBe("local");
    cleanup();
  });

  it("handles AI response without diy_time_range", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            title: "Simple Part",
            description: "desc",
            price: "$15",
            brand: "Brand",
            search_query: "simple part",
          },
        ],
      }),
    });

    const { useProductRecommendations } = await import(
      "@/hooks/useProductRecommendations"
    );

    const { result, cleanup } = renderHookManual(() =>
      useProductRecommendations("rare issue", undefined, vehicleInfo)
    );

    await waitForValue(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.diyEstimate).toBeUndefined();
    expect(result.current.data?.products[0].rating).toBe(4.4);
    expect(result.current.data?.products[0].reviewCount).toBe(1000);
    cleanup();
  });
});
