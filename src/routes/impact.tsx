import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Droplet, DollarSign, Utensils } from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { useImpact, useOrders } from "@/hooks/use-orders";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "Your impact — RePlate" },
      {
        name: "description",
        content: "Track meals saved, food waste reduced, and money saved through RePlate.",
      },
    ],
  }),
  component: ImpactPage,
});

function ImpactPage() {
  const impact = useImpact();
  const orders = useOrders();

  const stats = [
    {
      label: "Meals saved",
      value: impact.meals.toString(),
      icon: Utensils,
      color: "bg-sunset/10 text-sunset",
    },
    {
      label: "Food rescued",
      value: `${impact.kg} kg`,
      icon: Leaf,
      color: "bg-moss/10 text-moss",
    },
    {
      label: "CO₂ averted",
      value: `${impact.co2} kg`,
      icon: Droplet,
      color: "bg-ink/10 text-ink",
    },
    {
      label: "Money saved",
      value: `₹${impact.moneySaved.toFixed(0)}`,
      icon: DollarSign,
      color: "bg-sunset/10 text-sunset",
    },
  ];

  // Tier toward next milestone (every 10 meals)
  const milestone = Math.ceil(Math.max(impact.meals, 1) / 10) * 10;
  const progress = Math.min(100, (impact.meals / milestone) * 100);

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-6">
        <div className="text-[11px] uppercase tracking-widest text-sunset font-semibold mb-2">
          Your impact
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-3">
          Small bags, <span className="italic text-sunset font-medium">big difference.</span>
        </h1>
        <p className="text-ink/65 max-w-[55ch]">
          Every reservation diverts food from landfill and shrinks emissions.
          Here's the running tally of what you've helped rescue.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-8 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-surface border border-kraft rounded-[20px] p-5"
            >
              <div className={"size-9 rounded-full flex items-center justify-center mb-4 " + color}>
                <Icon className="size-4" />
              </div>
              <div className="font-display text-3xl tabular-nums leading-none mb-1.5">
                {value}
              </div>
              <div className="text-xs text-ink/60 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-8 mb-12">
        <div className="bg-surface border border-kraft rounded-[20px] p-6 md:p-8">
          <div className="flex justify-between items-baseline mb-3">
            <div className="font-display text-xl">
              Next milestone — {milestone} meals
            </div>
            <div className="text-sm text-ink/60 tabular-nums">
              {impact.meals} / {milestone}
            </div>
          </div>
          <div className="h-3 rounded-full bg-kraft/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sunset to-moss transition-[width] duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-ink/60 mt-3">
            Hit {milestone} rescued meals to unlock the{" "}
            <span className="text-moss font-semibold">Neighborhood Hero</span> badge.
          </p>
        </div>
      </section>

      {orders.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 md:px-8 pb-16">
          <h2 className="font-display text-2xl mb-4">Recent rescues</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.slice(0, 6).map((o) => (
              <div
                key={o.id}
                className="bg-surface border border-kraft rounded-2xl p-3 flex items-center gap-3"
              >
                <img
                  src={o.image}
                  alt={o.title}
                  className="size-14 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{o.title}</div>
                  <div className="text-xs text-moss font-semibold">
                    +0.6 kg saved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
