import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string | null>();

export function useVehiclePhoto(year: number, make: string, model: string) {
  const key = `${year} ${make} ${model}`;
  const [url, setUrl] = useState<string | null>(cache.get(key) ?? null);
  const [loading, setLoading] = useState(!cache.has(key));

  useEffect(() => {
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase.functions
      .invoke("unsplash-search", { body: { query: key } })
      .then(({ data, error }) => {
        if (cancelled) return;
        const photoUrl = error ? null : data?.url ?? null;
        cache.set(key, photoUrl);
        setUrl(photoUrl);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key]);

  return { url, loading };
}
