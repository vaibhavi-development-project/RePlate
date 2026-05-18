import { useEffect, useMemo, useState } from "react";
import { getImpact, getOrders, type Order } from "@/lib/storage";

export function useOrders(): Order[] {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const sync = () => setOrders(getOrders());
    sync();
    window.addEventListener("replate:orders", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("replate:orders", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return orders;
}

export function useImpact() {
  const [impact, setImpact] = useState(() => ({
    meals: 0,
    kg: 0,
    co2: 0,
    moneySaved: 0,
  }));
  useEffect(() => {
    const sync = () => setImpact(getImpact());
    sync();
    window.addEventListener("replate:orders", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("replate:orders", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return impact;
}

/** Live countdown to an absolute epoch-ms timestamp.
 *  Pass `isAbsolute=true` and an epoch-ms timestamp for real wall-clock countdowns. */
export function useCountdown(expiresAtOrMinutes: number, isAbsolute = false) {
  // Stable target across renders even in relative mode.
  const target = useMemo(
    () => (isAbsolute ? expiresAtOrMinutes : Date.now() + expiresAtOrMinutes * 60_000),
    [expiresAtOrMinutes, isAbsolute],
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((target - Date.now()) / 1000)),
  );
  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;

  let label: string;
  if (secondsLeft <= 0) label = "Expired";
  else if (hours > 0) label = `${hours}h ${remMin}m`;
  else if (minutes > 0) label = `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  else label = `${seconds}s`;

  const urgent = secondsLeft > 0 && secondsLeft <= 30 * 60;
  const expired = secondsLeft <= 0;
  return { label, urgent, expired, secondsLeft };
}
