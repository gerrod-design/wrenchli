import { useState, useCallback, useEffect } from "react";
import type { VehicleData } from "@/components/vehicle/VehicleIdentifier";
import type { DecodedVehicle } from "@/lib/vinDecoder";

const STORAGE_KEY = "wrenchli_vehicle";

export interface StoredVehicle extends VehicleData {
  /** If identified via VIN, store the decoded details */
  decoded?: DecodedVehicle;
}

function read(): StoredVehicle | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(v: StoredVehicle | null) {
  try {
    if (v) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota errors
  }
}

export function useVehicleSession() {
  const [vehicle, setVehicleState] = useState<StoredVehicle | null>(read);

  const setVehicle = useCallback((v: StoredVehicle | null) => {
    setVehicleState(v);
    write(v);
  }, []);

  const clear = useCallback(() => {
    setVehicleState(null);
    write(null);
  }, []);

  return { vehicle, setVehicle, clear } as const;
}

/** Read the stored vehicle without a hook (for initial values) */
export function getStoredVehicle(): StoredVehicle | null {
  return read();
}
