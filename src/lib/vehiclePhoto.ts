import { GARAGE_MEDIA_BUCKET } from "@/lib/garageRecord";

/**
 * Vehicle hero photo helpers.
 *
 * Storage convention: owner-uploaded vehicle photos live in the private
 * "garage-vehicle-media" bucket at `<owner-user-id>/<vehicle-id>/<filename>`.
 * Row Level Security on the bucket grants an owner full access to objects
 * whose first path segment matches their own user id.
 *
 * Because the bucket is private, the raw storage path stored in
 * `user_vehicles.photo_url` can never be rendered directly as an <img src>.
 * Instead, a short-lived signed URL must be requested from Supabase Storage
 * at display time (the same pattern used for evidence media elsewhere in the
 * app). Legacy or externally-provided photo URLs (http(s):// or data: URIs)
 * are rendered as-is since they are not references into our private bucket.
 */

export const HERO_PHOTO_MAX_DIMENSION = 1600;
export const HERO_PHOTO_SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Minimal structural surface of the Supabase JS client used by this module.
 * Defined explicitly (rather than importing the generated client type) so
 * tests can inject a lightweight fake implementation.
 */
export interface VehiclePhotoClient {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: any,
        options?: { contentType?: string; upsert?: boolean }
      ): Promise<{ data?: any; error?: any }>;
      remove(paths: string[]): Promise<{ data?: any; error?: any }>;
      createSignedUrl(
        path: string,
        expiresIn: number
      ): Promise<{ data?: any; error?: any }>;
    };
  };
  from(table: string): {
    update(values: any): {
      eq(column: string, value: any): Promise<{ data?: any; error?: any }>;
    };
  };
}

/**
 * Compute output dimensions for a resize operation that caps the longest
 * side at `maxDimension` while preserving aspect ratio. Pure / side-effect
 * free so it is trivially unit-testable.
 */
export function computeResizedDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= 0 || height <= 0 || maxDimension <= 0) {
    return { width: 0, height: 0 };
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = width >= height ? maxDimension / width : maxDimension / height;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Build the canonical storage path for a vehicle hero photo upload.
 */
export function buildHeroPhotoPath(
  userId: string,
  vehicleId: string,
  timestamp: number,
  extension = "jpg"
): string {
  return `${userId}/${vehicleId}/${timestamp}-owner-photo.${extension}`;
}

/**
 * Map a MIME content type to a reasonable file extension for storage.
 */
export function heroPhotoExtensionForContentType(contentType: string): string {
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/png") return "png";
  return "jpg";
}

/**
 * Determine whether a `photo_url` value is a reference into our private
 * storage bucket (as opposed to a legacy/external absolute URL or data URI).
 */
export function isVehiclePhotoStorageRef(
  value: string | null | undefined
): boolean {
  if (!value) return false;
  if (value.startsWith("http://")) return false;
  if (value.startsWith("https://")) return false;
  if (value.startsWith("data:")) return false;
  return true;
}

/**
 * Pure helper to decide what, if anything, should be rendered for a vehicle
 * photo given the raw `photo_url` column value and a (possibly already
 * resolved) signed URL for storage-backed references.
 */
export function photoDisplaySource(
  photoUrl: string | null | undefined,
  signedUrl: string | null
): { kind: "none" } | { kind: "url"; url: string } {
  if (!photoUrl) {
    return { kind: "none" };
  }

  if (isVehiclePhotoStorageRef(photoUrl)) {
    return signedUrl ? { kind: "url", url: signedUrl } : { kind: "none" };
  }

  return { kind: "url", url: photoUrl };
}

/**
 * Resize an image file/blob down to `maxDimension` on its longest side,
 * re-encoding as JPEG. This is a best-effort browser-only operation: if any
 * required API is missing or decoding/encoding fails for any reason, the
 * original file is returned unchanged so uploads never hard-fail on this
 * step.
 */
export async function resizeImageFile(
  file: Blob,
  maxDimension: number = HERO_PHOTO_MAX_DIMENSION
): Promise<Blob> {
  try {
    if (typeof document === "undefined") {
      return file;
    }

    let sourceWidth = 0;
    let sourceHeight = 0;
    let drawable: CanvasImageSource | null = null;
    let bitmap: ImageBitmap | null = null;
    let objectUrl: string | null = null;

    try {
      if (typeof createImageBitmap === "function") {
        bitmap = await createImageBitmap(file);
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawable = bitmap;
      } else if (typeof Image !== "undefined" && typeof URL !== "undefined") {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("image decode failed"));
          img.src = objectUrl as string;
        });
        sourceWidth = img.naturalWidth || img.width;
        sourceHeight = img.naturalHeight || img.height;
        drawable = img;
      } else {
        return file;
      }

      if (!drawable || sourceWidth <= 0 || sourceHeight <= 0) {
        return file;
      }

      const { width, height } = computeResizedDimensions(
        sourceWidth,
        sourceHeight,
        maxDimension
      );

      if (width <= 0 || height <= 0) {
        return file;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return file;
      }

      ctx.drawImage(drawable, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob(
            (result) => resolve(result),
            "image/jpeg",
            0.85
          );
        } catch {
          resolve(null);
        }
      });

      return blob ?? file;
    } finally {
      if (bitmap && typeof bitmap.close === "function") {
        try {
          bitmap.close();
        } catch {
          // ignore
        }
      }
      if (objectUrl && typeof URL !== "undefined") {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    }
  } catch {
    return file;
  }
}

/**
 * Resize (best-effort) and upload a vehicle hero photo to the private
 * garage media bucket, returning the storage path to persist on the
 * vehicle row. Does not touch the `user_vehicles` table itself.
 */
export async function uploadVehicleHeroPhoto(
  client: VehiclePhotoClient,
  args: {
    userId: string;
    vehicleId: string;
    file: File;
    resize?: (file: File) => Promise<Blob>;
  }
): Promise<string> {
  const resize = args.resize ?? ((f: File) => resizeImageFile(f));
  const blob = await resize(args.file);
  const contentType = blob.type || "image/jpeg";
  const extension = heroPhotoExtensionForContentType(contentType);
  const path = buildHeroPhotoPath(
    args.userId,
    args.vehicleId,
    Date.now(),
    extension
  );

  const { error } = await client.storage.from(GARAGE_MEDIA_BUCKET).upload(
    path,
    blob,
    { contentType, upsert: true }
  );

  if (error) {
    throw error;
  }

  return path;
}

/**
 * Upload a new hero photo and persist its storage path on the vehicle row.
 */
export async function setVehicleOwnerPhoto(
  client: VehiclePhotoClient,
  args: {
    userId: string;
    vehicleId: string;
    file: File;
    resize?: (file: File) => Promise<Blob>;
  }
): Promise<string> {
  const path = await uploadVehicleHeroPhoto(client, args);

  const { error } = await client
    .from("user_vehicles")
    .update({ photo_url: path })
    .eq("id", args.vehicleId);

  if (error) {
    throw error;
  }

  return path;
}

/**
 * Clear a vehicle's photo reference and best-effort delete the underlying
 * storage object if it was one of ours. Storage cleanup failures are
 * swallowed since the authoritative state is the `photo_url` column.
 */
export async function removeVehicleOwnerPhoto(
  client: VehiclePhotoClient,
  args: { vehicleId: string; currentPhotoUrl: string | null | undefined }
): Promise<void> {
  const { error } = await client
    .from("user_vehicles")
    .update({ photo_url: null })
    .eq("id", args.vehicleId);

  if (error) {
    throw error;
  }

  if (isVehiclePhotoStorageRef(args.currentPhotoUrl)) {
    try {
      const { error: removeError } = await client.storage
        .from(GARAGE_MEDIA_BUCKET)
        .remove([args.currentPhotoUrl as string]);
      void removeError;
    } catch {
      // best-effort cleanup only; swallow any failure
    }
  }
}

/**
 * Convenience wrapper for the add-vehicle flow: if no file was selected,
 * skip storage/table writes entirely and return null.
 */
export async function attachVehiclePhotoIfSelected(
  client: VehiclePhotoClient,
  args: {
    userId: string;
    vehicleId: string;
    file: File | null;
    resize?: (file: File) => Promise<Blob>;
  }
): Promise<string | null> {
  if (!args.file) {
    return null;
  }

  return setVehicleOwnerPhoto(client, {
    userId: args.userId,
    vehicleId: args.vehicleId,
    file: args.file,
    resize: args.resize,
  });
}

/**
 * Resolve a signed, time-limited URL for a stored vehicle photo path.
 * Returns null on any error so callers can gracefully fall back to a
 * placeholder rather than throwing during render.
 */
export async function getVehiclePhotoSignedUrl(
  client: VehiclePhotoClient,
  path: string,
  ttlSeconds: number = HERO_PHOTO_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  try {
    const { data, error } = await client.storage
      .from(GARAGE_MEDIA_BUCKET)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      return null;
    }

    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
