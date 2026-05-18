/** Tiny localStorage-backed orders store + impact tracker. */

export interface Order {
  id: string;
  listingId: string;
  restaurantId: string;
  restaurantName?: string;
  customerId?: string;
  customerName?: string;
  title: string;
  image: string;
  /** Per-unit price at time of reservation. */
  unitPrice: number;
  /** Per-unit original price for savings math. */
  unitOriginalPrice: number;
  /** Number of units reserved. */
  quantity: number;
  /** Total paid (unitPrice * quantity). */
  price: number;
  /** Total original (unitOriginalPrice * quantity). */
  originalPrice: number;
  pickupWindow: string;
  pickupSlot: string;
  createdAt: number;
  status: "reserved" | "collected" | "cancelled";
}

const ORDERS_KEY = "replate.orders.v1";

function read(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function write(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("replate:orders"));
}

export function getOrders(): Order[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function addOrder(order: Omit<Order, "id" | "createdAt" | "status">): Order {
  const newOrder: Order = {
    ...order,
    id: `o_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    status: "reserved",
  };
  const all = read();
  all.push(newOrder);
  write(all);
  return newOrder;
}

export function setOrderStatus(id: string, status: Order["status"]) {
  const all = read().map((o) => (o.id === id ? { ...o, status } : o));
  write(all);
}

/** Total units reserved (active reservations only) for a listing. */
export function getReservedUnits(listingId: string): number {
  return read()
    .filter((o) => o.listingId === listingId && o.status === "reserved")
    .reduce((s, o) => s + (o.quantity ?? 1), 0);
}

export function getImpact() {
  const orders = read();
  const meals = orders.reduce((s, o) => s + (o.quantity ?? 1), 0);
  // Approx 0.6 kg saved per rescued meal — feel good metric.
  const kg = +(meals * 0.6).toFixed(1);
  // Approx 2.5 kg CO2 averted per kg food.
  const co2 = +(kg * 2.5).toFixed(1);
  const moneySaved = +orders
    .reduce((s, o) => s + (o.originalPrice - o.price), 0)
    .toFixed(2);
  return { meals, kg, co2, moneySaved };
}

export function generateOrderCode(orderId: string) {
  return `REPLATE:${orderId.toUpperCase()}`;
}
