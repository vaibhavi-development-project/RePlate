/**
 * Cross-tab live store for partner restaurants and their listings.
 * Backed by localStorage; same-origin tabs sync via the `storage` event.
 */
import type { Listing, Restaurant } from "@/data/mock";
import { DEFAULT_CENTER } from "@/data/mock";

const RESTAURANTS_KEY = "replate.live.restaurants.v1";
const LISTINGS_KEY = "replate.live.listings.v1";
const EVENT = "replate:live";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}
function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function getLiveRestaurants(): Restaurant[] {
  return read<Restaurant>(RESTAURANTS_KEY);
}
export function getLiveListings(): Listing[] {
  return read<Listing>(LISTINGS_KEY);
}

/** Add or update a partner restaurant (called on signup / login). */
export function upsertLiveRestaurant(input: {
  id: string;
  name: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photo?: string;
}): Restaurant {
  const all = getLiveRestaurants();
  const existing = all.find((r) => r.id === input.id);
  if (existing) {
    const updated: Restaurant = {
      ...existing,
      name: input.name,
      neighborhood: input.neighborhood ?? existing.neighborhood,
      address: input.address ?? existing.address,
      lat: input.lat ?? existing.lat,
      lng: input.lng ?? existing.lng,
      photo: input.photo ?? existing.photo,
    };
    write(
      RESTAURANTS_KEY,
      all.map((r) => (r.id === input.id ? updated : r)),
    );
    return updated;
  }
  const jitter = () => (Math.random() - 0.5) * 0.04;
  const lat = input.lat ?? DEFAULT_CENTER.lat + jitter();
  const lng = input.lng ?? DEFAULT_CENTER.lng + jitter();
  const r: Restaurant = {
    id: input.id,
    name: input.name,
    neighborhood: input.neighborhood ?? "Your neighborhood",
    address: input.address,
    photo: input.photo,
    rating: 5,
    reviews: 0,
    verified: false,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    lat,
    lng,
  };
  write(RESTAURANTS_KEY, [...all, r]);
  return r;
}

export function addLiveListing(listing: Listing) {
  write(LISTINGS_KEY, [listing, ...getLiveListings()]);
}
export function updateLiveListing(id: string, patch: Partial<Listing>) {
  write(
    LISTINGS_KEY,
    getLiveListings().map((l) => (l.id === id ? { ...l, ...patch } : l)),
  );
}
export function removeLiveListing(id: string) {
  write(
    LISTINGS_KEY,
    getLiveListings().filter((l) => l.id !== id),
  );
}

/** Combined lookup: live restaurants take precedence over mock seed. */
export function findRestaurant(id: string, mockRestaurants: Restaurant[]) {
  return (
    getLiveRestaurants().find((r) => r.id === id) ??
    mockRestaurants.find((r) => r.id === id)
  );
}

import { useEffect, useState } from "react";

function useSync<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function useLiveRestaurants() {
  return useSync(getLiveRestaurants);
}
export function useLiveListings() {
  return useSync(getLiveListings);
}
