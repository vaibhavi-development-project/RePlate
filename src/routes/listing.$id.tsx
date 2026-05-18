import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, MapPin, Star, ShieldCheck, Leaf, Minus, Plus } from "lucide-react";
import { getListing, getRestaurant, restaurants as mockRestaurants, getExpiresAt } from "@/data/mock";
import { PageShell } from "@/components/site-shell";
import { useCountdown } from "@/hooks/use-orders";
import { addOrder } from "@/lib/storage";
import { findRestaurant, getLiveListings } from "@/lib/live-store";
import { useAuth } from "@/lib/auth";
import { useReservedUnits } from "@/hooks/use-reserved";

export const Route = createFileRoute("/listing/$id")({
  loader: ({ params }) => {
    const listing =
      getListing(params.id) ?? getLiveListings().find((l) => l.id === params.id);
    if (!listing) throw notFound();
    const restaurant =
      findRestaurant(listing.restaurantId, mockRestaurants) ??
      getRestaurant(listing.restaurantId);
    return { listing, restaurant };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.listing.title} · ${loaderData.restaurant?.name} — RePlate` },
          { name: "description", content: loaderData.listing.description },
          { property: "og:title", content: loaderData.listing.title },
          { property: "og:description", content: loaderData.listing.description },
          { property: "og:image", content: loaderData.listing.image },
          { property: "twitter:image", content: loaderData.listing.image },
        ]
      : [],
  }),
  component: ListingDetail,
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-4xl mb-3">Listing not found</h1>
        <p className="text-ink/60 mb-6">It may have been claimed or expired.</p>
        <Link to="/discover" className="text-sunset font-semibold underline">
          Back to discover
        </Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error, reset }) => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-4xl mb-3">Something went wrong</h1>
        <p className="text-ink/60 mb-6">{error.message}</p>
        <button onClick={reset} className="text-sunset font-semibold underline">
          Try again
        </button>
      </div>
    </PageShell>
  ),
});

function ListingDetail() {
  const { listing, restaurant } = Route.useLoaderData();
  const navigate = useNavigate();
  const auth = useAuth();
  const expiresAt = getExpiresAt(listing);
  const { label, urgent, expired } = useCountdown(expiresAt, true);
  const reservedUnits = useReservedUnits(listing.id);
  const remaining = Math.max(0, listing.quantity - reservedUnits);
  const [qty, setQty] = useState(1);
  const [slot, setSlot] = useState(listing.pickupWindow.split("—")[0]?.trim() ?? "");
  const [submitting, setSubmitting] = useState(false);

  const safeQty = Math.min(Math.max(1, qty), Math.max(1, remaining));
  const totalPrice = listing.discountedPrice * safeQty;
  const totalOriginal = listing.originalPrice * safeQty;

  const discountPct = Math.round(
    ((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100,
  );
  const soldOut = remaining <= 0;
  const disabled = expired || soldOut || submitting;

  const reserve = () => {
    if (disabled) return;
    setSubmitting(true);
    const order = addOrder({
      listingId: listing.id,
      restaurantId: listing.restaurantId,
      restaurantName: restaurant?.name,
      customerId: auth.user?.id,
      customerName: auth.user?.name ?? "Guest",
      title: listing.title,
      image: listing.image,
      unitPrice: listing.discountedPrice,
      unitOriginalPrice: listing.originalPrice,
      quantity: safeQty,
      price: totalPrice,
      originalPrice: totalOriginal,
      pickupWindow: listing.pickupWindow,
      pickupSlot: slot || listing.pickupWindow,
    });
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  const slots = useMemo(() => generateSlots(listing.pickupWindow), [listing.pickupWindow]);

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 md:px-8 pt-6">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink mb-6"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
          <div className="relative rounded-[24px] overflow-hidden border border-kraft bg-kraft">
            <img
              src={listing.image}
              alt={listing.title}
              width={1024}
              height={768}
              className="w-full h-[320px] md:h-[480px] object-cover"
            />
            <div className="absolute top-5 right-5 bg-sunset text-sunset-foreground font-bold text-sm tracking-wide px-3.5 py-1.5 rounded-full shadow-md">
              {discountPct}% OFF
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {restaurant?.photo ? (
                <img
                  src={restaurant.photo}
                  alt={restaurant.name}
                  className="size-9 rounded-full object-cover border border-kraft"
                />
              ) : (
                <div className="size-9 rounded-full bg-moss/15 text-moss flex items-center justify-center text-xs font-bold">
                  {restaurant?.name?.[0] ?? "?"}
                </div>
              )}
              <div className="text-[11px] uppercase tracking-widest text-moss font-semibold">
                {restaurant?.name} · {listing.category}
              </div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-3 leading-[1.05]">
              {listing.title}
            </h1>
            <p className="text-ink/70 leading-relaxed mb-6">{listing.description}</p>

            {restaurant?.address && (
              <div className="flex items-start gap-2 text-sm text-ink/75 bg-kraft/30 border border-kraft rounded-2xl p-3 mb-5">
                <MapPin className="size-4 mt-0.5 shrink-0 text-sunset" />
                <span>
                  <span className="font-semibold">Pickup at:</span> {restaurant.address}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {listing.dietary.map((d: string) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-moss/10 text-moss px-2.5 py-1 rounded-full"
                >
                  <Leaf className="size-3" /> {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Stat icon={<Clock className="size-4" />} label="Pickup" value={listing.pickupWindow} />
              <Stat
                icon={<Star className="size-4" />}
                label="Rating"
                value={`${restaurant?.rating ?? 5} (${restaurant?.reviews ?? 0})`}
              />
            </div>

            <div className="bg-surface rounded-[20px] border border-kraft p-6">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="text-xs text-ink/50 line-through tabular-nums">
                    ₹{listing.originalPrice.toFixed(0)} <span className="not-italic">/ piece</span>
                  </div>
                  <div className="font-display text-4xl tabular-nums">
                    ₹{listing.discountedPrice.toFixed(0)}
                    <span className="text-sm text-ink/50 font-sans ml-1">/ piece</span>
                  </div>
                </div>
                <div
                  className={
                    "flex items-center gap-2 font-semibold text-sm px-3 py-1.5 rounded-full " +
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
                  <span className="tabular-nums">{expired ? "Expired" : `Ends in ${label}`}</span>
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
                    Quantity
                  </div>
                  <div className="text-xs text-ink/60 mt-0.5">
                    {soldOut ? (
                      <span className="text-destructive font-semibold">Sold out</span>
                    ) : (
                      <>
                        <span className="font-semibold text-moss">{remaining}</span> of {listing.quantity} left
                      </>
                    )}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 bg-sand border border-kraft rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={safeQty <= 1}
                    className="size-8 rounded-full hover:bg-kraft/40 flex items-center justify-center disabled:opacity-30"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <div className="w-8 text-center text-sm font-semibold tabular-nums">{safeQty}</div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                    disabled={safeQty >= remaining}
                    className="size-8 rounded-full hover:bg-kraft/40 flex items-center justify-center disabled:opacity-30"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-widest text-ink/60 mb-2">
                Pickup slot
              </label>
              <div className="flex flex-wrap gap-2 mb-5">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={
                      "px-3.5 py-2 rounded-full text-sm font-medium border transition-colors " +
                      (slot === s
                        ? "bg-ink text-sand border-ink"
                        : "bg-sand border-kraft hover:bg-kraft/40")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-ink/60">
                  {safeQty} × ₹{listing.discountedPrice.toFixed(0)}
                </span>
                <span className="font-display text-2xl tabular-nums">₹{totalPrice.toFixed(0)}</span>
              </div>

              <button
                onClick={reserve}
                disabled={disabled}
                className="w-full bg-sunset text-sunset-foreground font-semibold py-4 rounded-full hover:bg-sunset/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {expired
                  ? "No longer available"
                  : soldOut
                    ? "Sold out"
                    : `Reserve ${safeQty} for ₹${totalPrice.toFixed(0)}`}
              </button>
              <p className="text-xs text-ink/55 text-center mt-3">
                Pay at pickup · You save ₹{(totalOriginal - totalPrice).toFixed(0)}
              </p>
            </div>

            {restaurant?.verified && (
              <div className="flex items-center gap-2 mt-5 text-sm text-moss">
                <ShieldCheck className="size-4" />
                Verified RePlate partner
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface border border-kraft rounded-2xl p-3">
      <div className="text-ink/50 mb-1">{icon}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold">{label}</div>
      <div className="text-sm font-medium leading-tight">{value}</div>
    </div>
  );
}

function generateSlots(window: string): string[] {
  const m = window.match(/(\d+):(\d+)\s*[—-]\s*(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return [window];
  const [, sh, sm, eh, em, ap] = m;
  const start = parseInt(sh) * 60 + parseInt(sm);
  const end = parseInt(eh) * 60 + parseInt(em);
  const slots: string[] = [];
  for (let t = start; t <= end; t += 15) {
    const h = Math.floor(t / 60);
    const min = t % 60;
    slots.push(`${h}:${min.toString().padStart(2, "0")} ${ap}`);
  }
  return slots;
}
