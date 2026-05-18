import { useEffect, useState } from "react";
import { DEFAULT_CENTER } from "@/data/mock";

export type GeoStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable" | "default";

export interface GeoState {
  status: GeoStatus;
  coords: { lat: number; lng: number };
  /** True if `coords` is the real user location (not the demo default). */
  isReal: boolean;
  request: () => void;
  error?: string;
}

const STORAGE_KEY = "replate.geo.v1";

function readStored(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useGeolocation(): GeoState {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState(() => readStored() ?? DEFAULT_CENTER);
  const [isReal, setIsReal] = useState(() => !!readStored());
  const [error, setError] = useState<string>();

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation not supported by this browser.");
      return;
    }
    setStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setIsReal(true);
        setStatus("granted");
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
        } catch {
          // ignore quota errors
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
        setError(err.message);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  useEffect(() => {
    // If we already have a stored real location, mark granted.
    if (readStored()) setStatus("granted");
    else setStatus("default");
  }, []);

  return { status, coords, isReal, request, error };
}
