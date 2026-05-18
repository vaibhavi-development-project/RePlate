import { useEffect, useState } from "react";
import { getReservedUnits } from "@/lib/storage";

/** Live count of units already reserved for a listing across tabs. */
export function useReservedUnits(listingId: string): number {
  const [n, setN] = useState(() => getReservedUnits(listingId));
  useEffect(() => {
    const sync = () => setN(getReservedUnits(listingId));
    sync();
    window.addEventListener("replate:orders", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("replate:orders", sync);
      window.removeEventListener("storage", sync);
    };
  }, [listingId]);
  return n;
}
