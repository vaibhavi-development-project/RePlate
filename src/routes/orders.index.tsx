import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site-shell";
import { useOrders } from "@/hooks/use-orders";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My orders — RePlate" },
      { name: "description", content: "Your reserved bags and pickup history." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const orders = useOrders();
  const active = orders.filter((o) => o.status === "reserved");
  const past = orders.filter((o) => o.status !== "reserved");

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-5 md:px-8 pt-10 pb-16">
        <div className="text-[11px] uppercase tracking-widest text-sunset font-semibold mb-2">
          Your orders
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight mb-10">
          The brown bag <span className="italic text-sunset font-medium">log</span>
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-kraft rounded-[24px] bg-surface">
            <ShoppingBag className="size-10 text-ink/30 mx-auto mb-4" />
            <div className="font-display text-2xl mb-2">Nothing reserved yet</div>
            <p className="text-ink/60 mb-6">Browse tonight's surplus and grab a bag.</p>
            <Link
              to="/discover"
              className="inline-flex bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
            >
              Discover deals
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-10">
                <h2 className="font-display text-2xl mb-4">Reserved · awaiting pickup</h2>
                <div className="grid gap-4">
                  {active.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="font-display text-2xl mb-4">History</h2>
                <div className="grid gap-4">
                  {past.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}

function OrderRow({ order }: { order: ReturnType<typeof useOrders>[number] }) {
  return (
    <Link
      to="/orders/$id"
      params={{ id: order.id }}
      className="flex items-center gap-4 bg-surface border border-kraft rounded-2xl p-3 hover:shadow-soft transition-shadow"
    >
      <img
        src={order.image}
        alt={order.title}
        className="size-20 rounded-xl object-cover"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="font-display text-lg font-medium truncate">{order.title}</div>
        <div className="text-xs text-ink/60">
          {order.quantity ?? 1} × ₹{(order.unitPrice ?? order.price).toFixed(0)} · Pickup {order.pickupSlot}
        </div>
      </div>
      <div
        className={
          "text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full " +
          (order.status === "reserved"
            ? "bg-sunset/10 text-sunset"
            : order.status === "collected"
              ? "bg-moss/10 text-moss"
              : "bg-ink/10 text-ink/50")
        }
      >
        {order.status}
      </div>
    </Link>
  );
}
