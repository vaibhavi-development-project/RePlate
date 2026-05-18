import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, listings as mockListings, type FoodCategory } from "@/data/mock";
import { ListingCard } from "@/components/listing-card";
import { PageShell } from "@/components/site-shell";
import { useLiveListings } from "@/lib/live-store";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover surplus food near you — RePlate" },
      {
        name: "description",
        content:
          "Browse all available surplus food deals near you. Filter by category, distance, and price.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "All">("All");
  const [maxPrice, setMaxPrice] = useState(500);
  const [sort, setSort] = useState<"urgency" | "price">("urgency");

  const liveListings = useLiveListings();

  const allListings = useMemo(
    () => [...liveListings, ...mockListings],
    [liveListings],
  );

  const filtered = useMemo(() => {
    const f = allListings.filter((l) => {
      if (category !== "All" && l.category !== category) return false;
      if (l.discountedPrice > maxPrice) return false;
      if (query && !`${l.title} ${l.description}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
    return f.sort((a, b) => {
      if (sort === "urgency") return a.expiresInMinutes - b.expiresInMinutes;
      return a.discountedPrice - b.discountedPrice;
    });
  }, [allListings, query, category, maxPrice, sort]);

  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 pb-6">
        <div className="text-[11px] uppercase tracking-widest text-sunset font-semibold mb-2">
          Discover
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-2">
          Surplus from <span className="italic text-sunset font-medium">local kitchens</span>
        </h1>
        <p className="text-ink/65">
          {filtered.length} of {allListings.length} live deals match your filters.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 mb-8">
        <div className="bg-surface rounded-[20px] border border-kraft p-5 md:p-6 grid gap-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, ingredients, restaurants…"
              className="w-full bg-sand border border-kraft rounded-full pl-11 pr-4 py-3 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-sunset/40"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border " +
                  (category === c
                    ? "bg-ink text-sand border-ink"
                    : "bg-surface border-kraft text-ink/70 hover:bg-kraft/40")
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <label className="text-sm font-medium">
              <div className="flex justify-between mb-2">
                <span>Max price</span>
                <span className="text-ink/60 tabular-nums">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
                className="w-full accent-sunset"
              />
            </label>
            <label className="text-sm font-medium">
              <div className="mb-2">Sort by</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="w-full bg-sand border border-kraft rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunset/40"
              >
                <option value="urgency">Closing soonest</option>
                <option value="price">Lowest price</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-kraft rounded-[20px]">
            <div className="font-display text-2xl mb-2">No matches</div>
            <p className="text-ink/60">Try widening your filters or check back soon — new deals appear live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
