import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, MapPin, Clock, ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { generateOrderCode, getOrders, setOrderStatus, type Order } from "@/lib/storage";
import { getRestaurant, restaurants as mockRestaurants } from "@/data/mock";
import { findRestaurant } from "@/lib/live-store";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [{ title: "Order confirmation — RePlate" }],
  }),
  component: OrderDetail,
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-4xl mb-3">Order not found</h1>
        <Link to="/orders" className="text-sunset font-semibold underline">
          Back to orders
        </Link>
      </div>
    </PageShell>
  ),
});

function OrderDetail() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [notFoundOrder, setNotFoundOrder] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const found = getOrders().find((o) => o.id === id) ?? null;
    if (!found) {
      setNotFoundOrder(true);
      return;
    }
    setOrder(found);
  }, [id]);

  useEffect(() => {
    if (!order) return;
    QRCode.toDataURL(generateOrderCode(order.id), {
      width: 320,
      margin: 1,
      color: { dark: "#2A2724", light: "#FFFFFF" },
    }).then(setQrUrl);
  }, [order]);

  if (notFoundOrder) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="font-display text-4xl mb-3">Order not found</h1>
          <Link to="/orders" className="text-sunset font-semibold underline">
            Back to orders
          </Link>
        </div>
      </PageShell>
    );
  }


  if (!order) return null;
  const restaurant = findRestaurant(order.restaurantId, mockRestaurants) ?? getRestaurant(order.restaurantId);

  const markCollected = () => {
    setOrderStatus(order.id, "collected");
    setOrder({ ...order, status: "collected" });
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-6 pb-16">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ink mb-6"
        >
          <ArrowLeft className="size-4" /> All orders
        </Link>

        <div className="bg-surface rounded-[24px] border border-kraft overflow-hidden">
          <div className="bg-moss text-moss-foreground p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-2 opacity-90">
              <Check className="size-4" /> Reservation confirmed
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-light leading-tight">
              You're saving a meal tonight.
            </h1>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-[1fr_240px] gap-8 items-start">
            <div>
              <img
                src={order.image}
                alt={order.title}
                className="w-full h-44 rounded-2xl object-cover mb-5"
              />
              <div className="text-[11px] uppercase tracking-widest text-moss font-semibold mb-1">
                {restaurant?.name}
              </div>
              <h2 className="font-display text-2xl font-medium mb-2">{order.title}</h2>
              <div className="text-sm text-ink/70 mb-4">
                Quantity: <span className="font-semibold text-ink">{order.quantity ?? 1}</span>
                {" · "}
                <span className="tabular-nums">
                  ₹{(order.unitPrice ?? order.price).toFixed(0)} / piece
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <Detail
                  icon={<Clock className="size-4" />}
                  label="Pickup"
                  value={order.pickupSlot}
                />
                <Detail
                  icon={<MapPin className="size-4" />}
                  label="Where"
                  value={restaurant?.address ?? restaurant?.neighborhood ?? order.restaurantName ?? ""}
                />
              </div>
              <div className="flex items-end justify-between border-t border-kraft pt-4">
                <div>
                  <div className="text-xs text-ink/50 line-through">
                    ₹{order.originalPrice.toFixed(0)}
                  </div>
                  <div className="font-display text-2xl">₹{order.price.toFixed(0)}</div>
                </div>
                <div className="text-xs font-semibold text-moss">
                  You saved ₹{(order.originalPrice - order.price).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold mb-3">
                Show at pickup
              </div>
              <div className="bg-surface border border-kraft rounded-2xl p-3 inline-block">
                {qrUrl ? (
                  <img src={qrUrl} alt="Order QR code" className="size-44" />
                ) : (
                  <canvas ref={canvasRef} className="size-44" />
                )}
              </div>
              <div className="font-mono text-xs mt-3 text-ink/55 break-all">
                {generateOrderCode(order.id)}
              </div>

              {order.status === "reserved" ? (
                <button
                  onClick={markCollected}
                  className="mt-5 w-full bg-ink text-sand py-3 rounded-full text-sm font-semibold hover:bg-ink/85"
                >
                  Mark as collected
                </button>
              ) : (
                <div className="mt-5 inline-flex items-center gap-2 text-moss font-semibold text-sm">
                  <Check className="size-4" /> Collected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-sand border border-kraft rounded-xl p-3">
      <div className="text-ink/50 mb-1">{icon}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink/55 font-semibold">
        {label}
      </div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
