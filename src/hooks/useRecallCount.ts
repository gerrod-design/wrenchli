import { useState, useEffect } from "react";

interface RecallCache {
  [key: string]: { count: number; fetchedAt: number };
}

const cache: RecallCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useRecallCount(make: string, model: string, year: string | number) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!make || !model || !year) return;

    const key = `${year}_${make}_${model}`;
    const cached = cache[key];

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      setCount(cached.count);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(String(year))}`
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (cancelled) return;
        const c = data?.results?.length ?? 0;
        cache[key] = { count: c, fetchedAt: Date.now() };
        setCount(c);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Failed to fetch recall count:", err);
          setCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [make, model, year]);

  return { count, loading };
}
