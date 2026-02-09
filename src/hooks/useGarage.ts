import { useState, useCallback, useSyncExternalStore, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────
export interface DiagnosticHistoryEntry {
  id: string;
  date: string;
  type: "code" | "symptom";
  input: string;
  results: string[];
}

export interface GarageVehicle {
  garageId: string;
  nickname: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  driveType?: string;
  fuelType?: string;
  vin?: string;
  savedAt: string;
  lastUsed: string;
  diagnosticHistory: DiagnosticHistoryEntry[];
}

// ─── Constants ──────────────────────────────────────────────────
const STORAGE_KEY = "wrenchli_garage";
const MAX_VEHICLES = 5;
const MAX_HISTORY = 20;
const DISMISSED_KEY = "wrenchli_garage_dismissed"; // sessionStorage

// ─── Helpers ────────────────────────────────────────────────────
function readGarage(): GarageVehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading garage:", e);
    return [];
  }
}

function writeGarage(vehicles: GarageVehicle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // quota
  }
  notifyListeners();
}

// ─── External store for cross-component reactivity ──────────────
let listeners: (() => void)[] = [];
let snapshot = readGarage();

function notifyListeners() {
  snapshot = readGarage();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return snapshot;
}

// Listen for storage events from other tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      notifyListeners();
    }
  });
}

// ─── Incognito detection ────────────────────────────────────────
export function isIncognito(): boolean {
  try {
    localStorage.setItem("__wrenchli_test", "1");
    localStorage.removeItem("__wrenchli_test");
    // Can't truly detect incognito in modern browsers, but we check if storage persists
    return false;
  } catch {
    return true;
  }
}

// ─── Hook ───────────────────────────────────────────────────────
export function useGarage() {
  const vehicles = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addVehicle = useCallback(
    (v: Omit<GarageVehicle, "garageId" | "savedAt" | "lastUsed" | "diagnosticHistory"> & { nickname?: string }) => {
      const current = readGarage();
      if (current.length >= MAX_VEHICLES) return false;

      // Dedupe by VIN or year+make+model+trim
      const exists = current.some(
        (g) =>
          (v.vin && g.vin === v.vin) ||
          (g.year === v.year && g.make === v.make && g.model === v.model && g.trim === v.trim)
      );
      if (exists) return false;

      const now = new Date().toISOString();
      const vehicle: GarageVehicle = {
        garageId: `v_${Date.now()}`,
        nickname: v.nickname || `My ${v.model}`,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim,
        engine: v.engine,
        transmission: v.transmission,
        driveType: v.driveType,
        fuelType: v.fuelType,
        vin: v.vin,
        savedAt: now,
        lastUsed: now,
        diagnosticHistory: [],
      };
      writeGarage([vehicle, ...current]);
      return true;
    },
    []
  );

  const removeVehicle = useCallback((garageId: string) => {
    const current = readGarage();
    writeGarage(current.filter((v) => v.garageId !== garageId));
  }, []);

  const clearAll = useCallback(() => {
    writeGarage([]);
  }, []);

  const updateLastUsed = useCallback((garageId: string) => {
    const current = readGarage();
    writeGarage(
      current.map((v) => (v.garageId === garageId ? { ...v, lastUsed: new Date().toISOString() } : v))
    );
  }, []);

  const updateNickname = useCallback((garageId: string, nickname: string) => {
    const current = readGarage();
    writeGarage(current.map((v) => (v.garageId === garageId ? { ...v, nickname } : v)));
  }, []);

  const addDiagnosticEntry = useCallback(
    (garageId: string, entry: Omit<DiagnosticHistoryEntry, "id" | "date">) => {
      const current = readGarage();
      const vehicle = current.find((v) => v.garageId === garageId);
      if (!vehicle) return;

      const newEntry: DiagnosticHistoryEntry = {
        id: `diag_${Date.now()}`,
        date: new Date().toISOString(),
        ...entry,
      };

      if (!vehicle.diagnosticHistory) vehicle.diagnosticHistory = [];
      vehicle.diagnosticHistory.unshift(newEntry);
      vehicle.diagnosticHistory = vehicle.diagnosticHistory.slice(0, MAX_HISTORY);
      vehicle.lastUsed = new Date().toISOString();

      writeGarage(current);
    },
    []
  );

  const findVehicle = useCallback(
    (year: string, make: string, model: string, vin?: string) => {
      return (
        vehicles.find(
          (g) => vin && g.vin === vin
        ) ||
        vehicles.find(
          (g) => g.year === year && g.make === make && g.model === model
        )
      );
    },
    [vehicles]
  );

  /** Get most recently used vehicle */
  const getActiveVehicle = useCallback(() => {
    if (vehicles.length === 0) return null;
    return [...vehicles].sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())[0];
  }, [vehicles]);

  const isFull = vehicles.length >= MAX_VEHICLES;

  return {
    vehicles,
    addVehicle,
    removeVehicle,
    clearAll,
    updateLastUsed,
    updateNickname,
    addDiagnosticEntry,
    findVehicle,
    getActiveVehicle,
    isFull,
  } as const;
}

// ─── Session dismissal helpers ──────────────────────────────────
export function isDismissedForSession(vehicleKey: string): boolean {
  try {
    const data = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]");
    return data.includes(vehicleKey);
  } catch {
    return false;
  }
}

export function dismissForSession(vehicleKey: string) {
  try {
    const data: string[] = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]");
    if (!data.includes(vehicleKey)) {
      data.push(vehicleKey);
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

/** Convenience: generate a stable key for a vehicle */
export function vehicleKey(year: string, make: string, model: string) {
  return `${year}-${make}-${model}`;
}
