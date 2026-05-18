import { Link } from "@tanstack/react-router";
import { MapPin, Clock } from "lucide-react";
import type { Listing } from "@/data/mock";
import { restaurants as mockRestaurants, getExpiresAt } from "@/data/mock";
import { useCountdown } from "@/hooks/use-orders";
import { findRestaurant, useLiveRestaurants } from "@/lib/live-store";
import { useReservedUnits } from "@/hooks/use-reserved";

interface Props {
  listing: Listing;
  /** Unused — kept for backward compatibility. */
  distanceMi?: number;
}

export function ListingCard({ listing }: Props) {
  const liveRestaurants = useLiveRestaurants();
  const restaurant = findRestaurant(listing.restaurantId, [...mockRestaurants, ...liveRestaurants]);
  const { label, urgent, expired } = useCountdown(getExpiresAt(listing), true);
  const reserved = useReservedUnits(listing.id);
  const remaining = Math.max(0, listing.quantity - reserved);
  const discountPct = Math.round(
    ((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100,
  );

  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group flex flex-col bg-surface rounded-[20px] border border-kraft overflow-hidden hover:shadow-lift transition-all duration-300"
    >
      <div className="relative bg-kraft/30 aspect-[4/3] p-2">
        <div className="w-full h-full relative rounded-[12px] overflow-hidden bg-kraft outline outline-1 -outline-offset-1 outline-ink/10">
          <img
            src={listing.image}
            loading="lazy"
            width={1024}
            height={768}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            alt={`${listing.title} from ${restaurant?.name}`}
          />
        </div>
        <div className="absolute top-5 right-5 bg-sunset text-sunset-foreground font-bold text-sm tracking-wide px-3.5 py-1.5 rounded-full shadow-md">
          {discountPct}% OFF
        </div>
        {restaurant?.verified && (
          <div className="absolute top-5 left-5 bg-surface/90 backdrop-blur text-ink text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border border-kraft">
            ✓ Verified
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col grow">
        <div className="flex items-center gap-2 mb-2">
          {restaurant?.photo ? (
            <img
              src={restaurant.photo}
              alt={restaurant.name}
              className="size-7 rounded-full object-cover border border-kraft shrink-0"
            />
          ) : (
            <div className="size-7 rounded-full bg-moss/15 text-moss flex items-center justify-center text-[10px] font-bold shrink-0">
              {restaurant?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="text-[11px] uppercase tracking-widest text-moss font-semibold truncate">
            {restaurant?.name} · {listing.category}
          </div>
        </div>
        <div className="flex justify-between items-start gap-3 mb-1">
          <h3 className="font-display text-xl font-medium tracking-tight text-ink text-balance leading-tight">
            {listing.title}
          </h3>
          <div className="shrink-0 text-right">
            <div className="text-xs text-ink/40 line-through tabular-nums">
              ₹{listing.originalPrice.toFixed(0)}
            </div>
            <div className="font-bold text-lg text-ink tabular-nums">
              ₹{listing.discountedPrice.toFixed(0)}
            </div>
          </div>
        </div>
        {restaurant?.address && (
          <div className="text-xs text-ink/60 mb-2 line-clamp-1 inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" /> {restaurant.address}
          </div>
        )}
        <div className="text-xs text-ink/60 font-medium tracking-wide flex items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {listing.pickupWindow}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-kraft/60 pt-4">
          <div
            className={
              "flex items-center gap-2 font-medium text-sm px-2.5 py-1 rounded-md " +
              (expired
                ? "bg-ink/10 text-ink/50"
                : urgent
                  ? "bg-sunset/10 text-sunset"
                  : "bg-moss/10 text-moss")
            }
          >
            {urgent && !expired && (
              <span className="size-1.5 rounded-full bg-sunset animate-pulse" />
            )}
            <span className="tabular-nums">
              {expired ? "Expired" : urgent ? `Ends in ${label}` : label}
            </span>
          </div>
          <span
            className={
              "text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md " +
              (remaining === 0
                ? "bg-destructive/10 text-destructive"
                : remaining <= 2
                  ? "bg-sunset/10 text-sunset"
                  : "text-ink/60")
            }
          >
            {remaining === 0 ? "Sold out" : `${remaining} left`}
          </span>
        </div>
      </div>
    </Link>
  );
}
