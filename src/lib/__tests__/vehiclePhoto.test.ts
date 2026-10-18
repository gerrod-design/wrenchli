import { describe, it, expect, vi } from "vitest";
import {
  HERO_PHOTO_MAX_DIMENSION,
  computeResizedDimensions,
  buildHeroPhotoPath,
  heroPhotoExtensionForContentType,
  isVehiclePhotoStorageRef,
  photoDisplaySource,
  uploadVehicleHeroPhoto,
  setVehicleOwnerPhoto,
  removeVehicleOwnerPhoto,
  attachVehiclePhotoIfSelected,
  getVehiclePhotoSignedUrl,
  type VehiclePhotoClient,
} from "@/lib/vehiclePhoto";

function makeFakeClient() {
  const upload = vi.fn(async (_path: string, _body: unknown, _options?: unknown) => ({
    data: {},
    error: null as unknown,
  }));
  const remove = vi.fn(async (_paths: string[]) => ({ data: {}, error: null as unknown }));
  const createSignedUrl = vi.fn(async (_path: string, _ttl: number) => ({
    data: { signedUrl: "https://signed.example/hero.jpg" },
    error: null as unknown,
  }));

  const eq = vi.fn(async (_column: string, _value: unknown) => ({ data: {}, error: null as unknown }));
  const update = vi.fn((_values: Record<string, unknown>) => ({ eq }));

  const storageFrom = vi.fn((_bucket: string) => ({
    upload,
    remove,
    createSignedUrl,
  }));

  const tableFrom = vi.fn((_table: string) => ({
    update,
  }));

  const client = {
    storage: {
      from: storageFrom,
    },
    from: tableFrom,
  };

  return { client, upload, remove, createSignedUrl, update, eq, storageFrom, tableFrom };
}

describe("computeResizedDimensions", () => {
  it("downscales landscape images larger than max dimension", () => {
    expect(computeResizedDimensions(3200, 2400, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it("downscales wide images", () => {
    expect(computeResizedDimensions(2000, 1000, 1600)).toEqual({ width: 1600, height: 800 });
  });

  it("leaves small images unchanged", () => {
    expect(computeResizedDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("handles zero width gracefully", () => {
    expect(computeResizedDimensions(0, 100, 1600)).toEqual({ width: 0, height: 0 });
  });

  it("exposes the default max dimension constant", () => {
    expect(HERO_PHOTO_MAX_DIMENSION).toBeGreaterThan(0);
  });
});

describe("buildHeroPhotoPath", () => {
  it("builds the expected jpg path", () => {
    expect(buildHeroPhotoPath("user-1", "veh-1", 1792279882602)).toBe(
      "user-1/veh-1/1792279882602-owner-photo.jpg",
    );
  });

  it("uses the provided extension", () => {
    const path = buildHeroPhotoPath("user-1", "veh-1", 1792279882602, "webp");
    expect(path.endsWith("-owner-photo.webp")).toBe(true);
  });
});

describe("heroPhotoExtensionForContentType", () => {
  it("maps webp", () => {
    expect(heroPhotoExtensionForContentType("image/webp")).toBe("webp");
  });

  it("maps png", () => {
    expect(heroPhotoExtensionForContentType("image/png")).toBe("png");
  });

  it("maps jpeg to jpg", () => {
    expect(heroPhotoExtensionForContentType("image/jpeg")).toBe("jpg");
  });

  it("defaults empty string to jpg", () => {
    expect(heroPhotoExtensionForContentType("")).toBe("jpg");
  });
});

describe("isVehiclePhotoStorageRef", () => {
  it("recognizes storage refs", () => {
    expect(isVehiclePhotoStorageRef("user-1/veh-1/1792279882602-owner-photo.jpg")).toBe(true);
  });

  it("rejects https urls", () => {
    expect(isVehiclePhotoStorageRef("https://example.com/x.jpg")).toBe(false);
  });

  it("rejects http urls", () => {
    expect(isVehiclePhotoStorageRef("http://example.com/x.jpg")).toBe(false);
  });

  it("rejects data urls", () => {
    expect(isVehiclePhotoStorageRef("data:image/jpeg;base64,xx")).toBe(false);
  });

  it("rejects null, undefined, and empty string", () => {
    expect(isVehiclePhotoStorageRef(null)).toBe(false);
    expect(isVehiclePhotoStorageRef(undefined)).toBe(false);
    expect(isVehiclePhotoStorageRef("")).toBe(false);
  });
});

describe("photoDisplaySource", () => {
  it("returns none when nothing is set", () => {
    expect(photoDisplaySource(null, null)).toEqual({ kind: "none" });
  });

  it("returns the signed url for a storage ref", () => {
    const signed = "https://signed.example/hero.jpg";
    expect(photoDisplaySource("user-1/veh-1/1792279882602-owner-photo.jpg", signed)).toEqual({
      kind: "url",
      url: signed,
    });
  });

  it("returns none when a storage ref has no resolved signed url yet", () => {
    expect(photoDisplaySource("user-1/veh-1/1792279882602-owner-photo.jpg", null)).toEqual({
      kind: "none",
    });
  });

  it("returns the direct url for non-storage-ref photo urls", () => {
    expect(photoDisplaySource("https://example.com/x.jpg", null)).toEqual({
      kind: "url",
      url: "https://example.com/x.jpg",
    });
  });
});

describe("setVehicleOwnerPhoto", () => {
  it("uploads and writes photo_url", async () => {
    const { client, upload, update, eq, storageFrom } = makeFakeClient();
    const file = new File(["img"], "car.jpg", { type: "image/jpeg" });

    const path = await setVehicleOwnerPhoto(client as unknown as VehiclePhotoClient, {
      userId: "user-1",
      vehicleId: "veh-1",
      file,
      resize: async (f) => f,
    });

    expect(path).toMatch(/^user-1\/veh-1\/\d+-owner-photo\.jpg$/);
    expect(storageFrom).toHaveBeenCalledWith("garage-vehicle-media");
    expect(upload).toHaveBeenCalledWith(
      path,
      expect.anything(),
      expect.objectContaining({ contentType: "image/jpeg", upsert: true }),
    );
    expect(update).toHaveBeenCalledWith({ photo_url: path });
    expect(eq).toHaveBeenCalledWith("id", "veh-1");
  });

  it("rejects and skips the db write when upload fails", async () => {
    const { client, upload, update } = makeFakeClient();
    upload.mockResolvedValueOnce({ data: null, error: new Error("boom") });
    const file = new File(["img"], "car.jpg", { type: "image/jpeg" });

    await expect(
      setVehicleOwnerPhoto(client as unknown as VehiclePhotoClient, {
        userId: "user-1",
        vehicleId: "veh-1",
        file,
        resize: async (f) => f,
      }),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
  });
});

describe("attachVehiclePhotoIfSelected", () => {
  it("skips all photo writes when no file is selected", async () => {
    const { client, storageFrom, tableFrom } = makeFakeClient();

    const result = await attachVehiclePhotoIfSelected(client as unknown as VehiclePhotoClient, {
      userId: "user-1",
      vehicleId: "veh-1",
      file: null,
      resize: async (f) => f,
    });

    expect(result).toBeNull();
    expect(storageFrom).not.toHaveBeenCalled();
    expect(tableFrom).not.toHaveBeenCalled();
  });

  it("delegates to setVehicleOwnerPhoto when a file is provided", async () => {
    const { client, update } = makeFakeClient();
    const file = new File(["img"], "car.jpg", { type: "image/jpeg" });

    const result = await attachVehiclePhotoIfSelected(client as unknown as VehiclePhotoClient, {
      userId: "user-1",
      vehicleId: "veh-1",
      file,
      resize: async (f) => f,
    });

    expect(result).toMatch(/^user-1\/veh-1\/\d+-owner-photo\.jpg$/);
    expect(update).toHaveBeenCalled();
  });
});

describe("removeVehicleOwnerPhoto", () => {
  it("removes storage object and clears photo_url for a storage ref", async () => {
    const { client, update, eq, remove } = makeFakeClient();
    const storageRef = "user-1/veh-1/1792279882602-owner-photo.jpg";

    await removeVehicleOwnerPhoto(client as unknown as VehiclePhotoClient, {
      vehicleId: "veh-1",
      currentPhotoUrl: storageRef,
    });

    expect(update).toHaveBeenCalledWith({ photo_url: null });
    expect(eq).toHaveBeenCalledWith("id", "veh-1");
    expect(remove).toHaveBeenCalledWith([storageRef]);
  });

  it("does not attempt storage removal for an external https url", async () => {
    const { client, remove } = makeFakeClient();

    await removeVehicleOwnerPhoto(client as unknown as VehiclePhotoClient, {
      vehicleId: "veh-1",
      currentPhotoUrl: "https://example.com/x.jpg",
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("still resolves when storage removal fails (best-effort cleanup)", async () => {
    const { client, remove } = makeFakeClient();
    remove.mockResolvedValueOnce({ data: null, error: new Error("remove failed") });

    await expect(
      removeVehicleOwnerPhoto(client as unknown as VehiclePhotoClient, {
        vehicleId: "veh-1",
        currentPhotoUrl: "user-1/veh-1/1792279882602-owner-photo.jpg",
      }),
    ).resolves.not.toThrow();
  });
});

describe("getVehiclePhotoSignedUrl", () => {
  it("returns the signed url on success", async () => {
    const { client } = makeFakeClient();
    const url = await getVehiclePhotoSignedUrl(client as unknown as VehiclePhotoClient, {
      path: "user-1/veh-1/1792279882602-owner-photo.jpg",
    });
    expect(url).toBe("https://signed.example/hero.jpg");
  });

  it("returns null on error", async () => {
    const { client, createSignedUrl } = makeFakeClient();
    createSignedUrl.mockResolvedValueOnce({ data: null, error: new Error("no") });

    const url = await getVehiclePhotoSignedUrl(client as unknown as VehiclePhotoClient, {
      path: "user-1/veh-1/1792279882602-owner-photo.jpg",
    });
    expect(url).toBeNull();
  });
});

describe("uploadVehicleHeroPhoto export", () => {
  it("is exported as a function", () => {
    expect(typeof uploadVehicleHeroPhoto).toBe("function");
  });
});
