import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Clock, MapPin, QrCode } from "lucide-react";
import heroImg from "@/assets/hero-market.jpg";
import { ListingCard } from "@/components/listing-card";
import { PageShell } from "@/components/site-shell";
import { useImpact } from "@/hooks/use-orders";
import { useLiveListings } from "@/lib/live-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RePlate — Rescue great food before it's too late" },
      {
        name: "description",
        content:
          "RePlate is a neighborhood marketplace for surplus food. Discover discounted meals, pastries and produce from local restaurants — and help reduce food waste.",
      },
      { property: "og:title", content: "RePlate — Rescue great food before it's too late" },
      {
        property: "og:description",
        content: "Save meals, money and the planet. Discover surplus food from local kitchens.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const liveListings = useLiveListings();
  const featured = liveListings.slice(0, 3);
  const impact = useImpact();
  const meals = impact.meals > 0 ? impact.meals : 14208;

  return (
    <PageShell>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-16">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-moss/10 text-moss text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
              <Leaf className="size-3.5" />
              Tonight in your neighborhood
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight text-balance leading-[1.02] mb-6">
              Tonight's specials,{" "}
              <span className="text-sunset italic font-medium">
                just around the corner.
              </span>
            </h1>
            <p className="text-lg text-ink/70 max-w-[48ch] text-pretty leading-relaxed mb-8">
              Rescue perfectly good, untouched food from your favorite neighborhood
              spots before they close. Generous portions, neighborly prices, zero
              waste.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 bg-ink text-sand px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-ink/85 transition-colors shadow-soft"
              >
                Find food near me
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/restaurant"
                className="inline-flex items-center gap-2 border border-ink/15 bg-surface text-ink px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-kraft/40 transition-colors"
              >
                I run a restaurant
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[24px] overflow-hidden border border-kraft shadow-lift bg-kraft">
              <img
                src={heroImg}
                width={1600}
                height={1200}
                alt="Golden hour neighborhood food market with fresh bread, vegetables and kraft paper bags"
                className="w-full h-[420px] md:h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 md:-left-8 bg-surface p-5 rounded-[20px] border border-kraft shadow-lift max-w-[240px]">
              <div className="text-[11px] font-semibold text-ink/50 mb-1.5 uppercase tracking-widest">
                This month nearby
              </div>
              <div className="font-display text-4xl text-moss tabular-nums tracking-tight leading-none mb-1.5">
                {meals.toLocaleString()}
              </div>
              <div className="text-xs text-ink/70 font-medium leading-snug">
                meals saved from the compost bin.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12 border-t border-kraft/60">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: "Discover nearby",
              text: "Browse a curated feed of surplus deals from kitchens within walking distance.",
            },
            {
              icon: Clock,
              title: "Reserve instantly",
              text: "Pick a pickup slot. Prices drop further as closing time approaches.",
            },
            {
              icon: QrCode,
              title: "Show your QR",
              text: "Stop in, flash your code, walk out with dinner. Easy as that.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="p-6 rounded-[20px] bg-surface border border-kraft"
            >
              <div className="size-10 rounded-full bg-sunset/10 text-sunset flex items-center justify-center mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-xl font-medium mb-2">{title}</h3>
              <p className="text-sm text-ink/65 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured deals */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-sunset font-semibold mb-1">
              Closing Soon
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
              Tonight's pickup picks
            </h2>
          </div>
          <Link
            to="/discover"
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold hover:text-sunset transition-colors"
          >
            See all <ArrowRight className="size-4" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-kraft rounded-[24px] bg-surface">
            <div className="font-display text-2xl mb-2">No live deals yet tonight</div>
            <p className="text-ink/60 mb-5 max-w-md mx-auto">
              When neighborhood restaurants post their surplus, you'll see it here in real time.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup", role: "restaurant", redirect: "/restaurant" }}
              className="inline-flex bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
            >
              List your restaurant
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  );
}
