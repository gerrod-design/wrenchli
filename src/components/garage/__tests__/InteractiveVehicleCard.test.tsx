import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InteractiveVehicleCard from "@/components/garage/InteractiveVehicleCard";
import type { CloudVehicle } from "@/hooks/useCloudVehicles";

vi.mock("@/hooks/useVehicleOwnerPhoto", () => ({
  useResolvedVehiclePhoto: (photoUrl: string | null) => ({
    url: !photoUrl ? null : photoUrl.startsWith("http") ? photoUrl : "https://signed.example/hero.jpg",
    loading: false,
  }),
  useVehicleOwnerPhoto: () => ({
    setPhoto: vi.fn(),
    removePhoto: vi.fn(),
    busy: false,
  }),
}));

const baseVehicle: CloudVehicle = {
  id: "veh-1",
  user_id: "user-1",
  year: 2022,
  make: "BMW",
  model: "M850i",
  trim: "xDrive GC",
  nickname: null,
  vin: "WBAGV8C0XNCH32006",
  current_mileage: 21000,
  is_active: true,
  is_primary: false,
  photo_url: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
} as CloudVehicle;

function renderCard(vehicle: CloudVehicle, onDelete = vi.fn(), onEdit = vi.fn()) {
  return render(
    <MemoryRouter>
      <InteractiveVehicleCard
        vehicle={vehicle}
        unreadRecalls={0}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </MemoryRouter>,
  );
}

describe("InteractiveVehicleCard photo rendering", () => {
  it("shows the fallback and an add-photo button when there is no owner photo", () => {
    const { container } = renderCard({ ...baseVehicle, photo_url: null });

    expect(screen.getByTestId("vehicle-photo-fallback")).toBeInTheDocument();
    expect(screen.getByText("Add a photo of your car")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders the owner photo directly when photo_url is a plain url", () => {
    const { container } = renderCard({
      ...baseVehicle,
      photo_url: "https://example.com/my-car.jpg",
    });

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/my-car.jpg");
    expect(screen.queryByTestId("vehicle-photo-fallback")).toBeNull();
  });

  it("renders the resolved signed url when photo_url is a storage path", () => {
    const { container } = renderCard({
      ...baseVehicle,
      photo_url: "user-1/veh-1/1792279882602-owner-photo.jpg",
    });

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://signed.example/hero.jpg");
    expect(screen.queryByTestId("vehicle-photo-fallback")).toBeNull();
  });

  it("calls onEdit with the vehicle when the add-photo button is clicked", () => {
    const onEdit = vi.fn();
    renderCard({ ...baseVehicle, photo_url: null }, vi.fn(), onEdit);

    fireEvent.click(screen.getByText("Add a photo of your car"));

    expect(onEdit).toHaveBeenCalledWith(baseVehicle);
  });
});
