import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getVehiclePhotoSignedUrl,
  isVehiclePhotoStorageRef,
  photoDisplaySource,
  removeVehicleOwnerPhoto,
  setVehicleOwnerPhoto,
  type VehiclePhotoClient,
} from "@/lib/vehiclePhoto";

const signedUrlCache = new Map<string, string>();

export function useResolvedVehiclePhoto(
  photoUrl: string | null | undefined
): { url: string | null; loading: boolean } {
  const [signedUrl, setSignedUrl] = useState<string | null>(() => {
    if (photoUrl && isVehiclePhotoStorageRef(photoUrl)) {
      return signedUrlCache.get(photoUrl) ?? null;
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!photoUrl || !isVehiclePhotoStorageRef(photoUrl)) {
      return false;
    }
    return !signedUrlCache.has(photoUrl);
  });

  useEffect(() => {
    if (!photoUrl || !isVehiclePhotoStorageRef(photoUrl)) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    const cached = signedUrlCache.get(photoUrl);
    if (cached) {
      setSignedUrl(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSignedUrl(null);

    void getVehiclePhotoSignedUrl(supabase as unknown as VehiclePhotoClient, photoUrl)
      .then((url) => {
        if (cancelled) {
          return;
        }
        if (url) {
          signedUrlCache.set(photoUrl, url);
          setSignedUrl(url);
        } else {
          setSignedUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignedUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  const display = photoDisplaySource(photoUrl, signedUrl);
  const url = display.kind === "url" ? display.url : null;

  return { url, loading };
}

export function useVehicleOwnerPhoto(vehicleId: string | null | undefined): {
  setPhoto: (file: File) => Promise<string>;
  removePhoto: (currentPhotoUrl: string | null | undefined) => Promise<void>;
  busy: boolean;
} {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const setPhoto = useCallback(
    async (file: File): Promise<string> => {
      if (!user || !vehicleId) {
        throw new Error("Sign in and open a Garage vehicle first.");
      }
      setBusy(true);
      try {
        return await setVehicleOwnerPhoto(supabase as unknown as VehiclePhotoClient, {
          userId: user.id,
          vehicleId,
          file,
        });
      } finally {
        setBusy(false);
      }
    },
    [user, vehicleId]
  );

  const removePhoto = useCallback(
    async (currentPhotoUrl: string | null | undefined): Promise<void> => {
      if (!user || !vehicleId) {
        throw new Error("Sign in and open a Garage vehicle first.");
      }
      setBusy(true);
      try {
        await removeVehicleOwnerPhoto(supabase as unknown as VehiclePhotoClient, {
          vehicleId,
          currentPhotoUrl,
        });
      } finally {
        setBusy(false);
      }
    },
    [user, vehicleId]
  );

  return { setPhoto, removePhoto, busy };
}
