// Mock seed data is intentionally empty — RePlate now shows only real
// restaurants and listings created via the partner dashboard.

export type FoodCategory =
  | "Bakery"
  | "Produce"
  | "Sushi"
  | "Hot Meal"
  | "Dessert"
  | "Vegan"
  | "Indian"
  | "Chinese"
  | "Beverages"
  | "Snacks";

export type DietaryTag = "Veg" | "Non-Veg" | "Vegan" | "Jain" | "Contains Gluten";

export interface Restaurant {
  id: string;
  name: string;
  neighborhood: string;
  address?: string;
  rating: number;
  reviews: number;
  verified: boolean;
  /** Optional restaurant cover photo (data URL). */
  photo?: string;
  /** Approx geo for mock map (percentage offsets, 0-100). */
  x: number;
  y: number;
  /** Real geo coordinates. */
  lat: number;
  lng: number;
}

/** Reference center for the demo (Connaught Place, New Delhi). */
export const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

export interface Listing {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  category: FoodCategory;
  dietary: DietaryTag[];
  image: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  /** Minutes from "now" until expiry (legacy fallback). */
  expiresInMinutes: number;
  /** Absolute epoch-ms expiry — preferred for real countdowns. */
  expiresAt?: number;
  pickupWindow: string;
  distanceMi: number;
}

/** Resolve absolute expiry from a listing (handles legacy data). */
export function getExpiresAt(l: Pick<Listing, "expiresAt" | "expiresInMinutes">): number {
  return l.expiresAt ?? Date.now() + l.expiresInMinutes * 60_000;
}

export const restaurants: Restaurant[] = [];
export const listings: Listing[] = [];

export function getRestaurant(id: string) {
  return restaurants.find((r) => r.id === id);
}

export function getListing(id: string) {
  return listings.find((l) => l.id === id);
}

export const CATEGORIES: FoodCategory[] = [
  "Bakery",
  "Indian",
  "Chinese",
  "Hot Meal",
  "Vegan",
  "Produce",
  "Sushi",
  "Dessert",
  "Beverages",
  "Snacks",
];
