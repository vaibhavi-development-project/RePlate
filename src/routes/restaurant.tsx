import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Plus,
  Package,
  TrendingUp,
  Leaf,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { CATEGORIES, type DietaryTag, type FoodCategory, type Listing, getExpiresAt } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  addLiveListing,
  removeLiveListing,
  useLiveListings,
} from "@/lib/live-store";
import { useOrders, useCountdown } from "@/hooks/use-orders";
import { useReservedUnits } from "@/hooks/use-reserved";
import { setOrderStatus } from "@/lib/storage";
import { pickFoodImage } from "@/lib/food-image";

export const Route = createFileRoute("/restaurant")({
  head: () => ({
    meta: [
      { title: "Restaurant dashboard — RePlate" },
      {
        name: "description",
        content:
          "List surplus food, manage pickups, and track your food-waste impact with the RePlate partner dashboard.",
      },
    ],
  }),
  component: RestaurantGate,
});

function RestaurantGate() {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto px-5 py-24 text-center">
          <div className="size-12 mx-auto rounded-full bg-sunset/10 text-sunset flex items-center justify-center mb-4">
            <Lock className="size-5" />
          </div>
          <h1 className="font-display text-3xl mb-2">Partner sign-in required</h1>
          <p className="text-ink/65 mb-6">
            Sign in or create a restaurant account to access the dashboard.
          </p>
          <Link
            to="/auth"
            search={{ mode: "login", role: "restaurant", redirect: "/restaurant" }}
            className="inline-flex bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
          >
            Sign in as a restaurant
          </Link>
        </div>
      </PageShell>
    );
  }
  if (auth.user?.role !== "restaurant") {
    return (
      <PageShell>
        <div className="max-w-md mx-auto px-5 py-24 text-center">
          <h1 className="font-display text-3xl mb-2">Restaurant accounts only</h1>
          <p className="text-ink/65 mb-6">
            You're signed in as <strong>{auth.user?.name}</strong> ({auth.user?.role}). The
            partner dashboard is only available to restaurant accounts.
          </p>
          <Link
            to="/auth"
            search={{ mode: "signup", role: "restaurant", redirect: "/restaurant" }}
            className="inline-flex bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
          >
            Create a restaurant account
          </Link>
        </div>
      </PageShell>
    );
  }
  return <RestaurantDashboard />;
}

type Tab = "overview" | "listings" | "orders" | "analytics";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeekData(orders: { createdAt: number; price: number; quantity?: number; status: string }[]) {
  // Last 7 days including today, oldest -> newest
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return { day: DAY_LABELS[d.getDay()], date: d.getTime(), saved: 0, revenue: 0 };
  });
  const startMs = buckets[0].date;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    if (o.createdAt < startMs) continue;
    const idx = Math.min(6, Math.floor((o.createdAt - startMs) / 86_400_000));
    if (idx < 0) continue;
    buckets[idx].saved += o.quantity ?? 1;
    buckets[idx].revenue += o.price;
  }
  return buckets;
}

function buildTopItems(orders: { title: string; quantity?: number; status: string }[]) {
  const counts = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    counts.set(o.title, (counts.get(o.title) ?? 0) + (o.quantity ?? 1));
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function RestaurantDashboard() {
  const auth = useAuth();
  const restaurantId = auth.user?.id ?? "r1";
  const restaurantName = auth.user?.restaurantName ?? "Hearth & Crumb";
  const [tab, setTab] = useState<Tab>("overview");
  const liveListings = useLiveListings();
  const items = useMemo(
    () => liveListings.filter((l) => l.restaurantId === restaurantId),
    [liveListings, restaurantId],
  );
  const allOrders = useOrders();
  const orders = useMemo(
    () => allOrders.filter((o) => o.restaurantId === restaurantId),
    [allOrders, restaurantId],
  );

  const weekData = useMemo(() => buildWeekData(orders), [orders]);
  const topItems = useMemo(() => buildTopItems(orders), [orders]);
  const weekRevenue = useMemo(
    () => weekData.reduce((s, d) => s + d.revenue, 0),
    [weekData],
  );

  const totals = useMemo(() => {
    const collected = orders.filter((o) => o.status === "collected");
    return {
      sold: collected.length,
      revenue: collected.reduce((s, o) => s + o.price, 0),
      kg: +(collected.length * 0.6).toFixed(1),
    };
  }, [orders]);

  return (
    <PageShell>
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-[11px] uppercase tracking-widest text-sunset font-semibold">
            Partner dashboard
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-moss bg-moss/10 px-2 py-0.5 rounded-full">
            <span className="size-1.5 rounded-full bg-moss animate-pulse" /> Live
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-tight">
            {restaurantName} <span className="italic text-sunset font-medium">tonight</span>
          </h1>
          <button
            onClick={() => setTab("listings")}
            className="inline-flex items-center gap-2 bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
          >
            <Plus className="size-4" /> New listing
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 mt-8">
        <div className="flex gap-1 bg-surface border border-kraft rounded-full p-1 w-fit overflow-x-auto hide-scrollbar">
          {(
            [
              ["overview", "Overview"],
              ["listings", "Listings"],
              ["orders", "Orders"],
              ["analytics", "Analytics"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors " +
                (tab === k ? "bg-ink text-sand" : "text-ink/60 hover:text-ink")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-8 py-8 pb-16">
        {tab === "overview" && (
          <div className="grid gap-6">
            <RestaurantProfileCard />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI label="Items sold" value={totals.sold.toString()} icon={Package} />
              <KPI label="Revenue recovered" value={`₹${totals.revenue.toFixed(0)}`} icon={TrendingUp} />
              <KPI label="Food saved" value={`${totals.kg.toFixed(1)} kg`} icon={Leaf} />
              <KPI label="Active listings" value={items.length.toString()} icon={Sparkles} />
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
              <div className="bg-surface border border-kraft rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
                      This week
                    </div>
                    <h2 className="font-display text-xl">Meals saved per day</h2>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart data={weekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.86 0.025 75)" />
                      <XAxis dataKey="day" stroke="oklch(0.48 0.02 60)" fontSize={12} />
                      <YAxis stroke="oklch(0.48 0.02 60)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid oklch(0.86 0.025 75)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="saved" fill="oklch(0.625 0.175 40)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-moss text-moss-foreground rounded-[20px] p-6">
                <div className="text-[11px] uppercase tracking-widest opacity-80 font-semibold mb-2">
                  Live impact
                </div>
                <h3 className="font-display text-2xl leading-snug mb-3">
                  {totals.sold > 0
                    ? `You've recovered ₹${totals.revenue.toFixed(0)} and saved ${totals.kg.toFixed(1)} kg of food this week.`
                    : "Your impact will appear here once customers start picking up your surplus."}
                </h3>
                <p className="text-sm opacity-90">
                  Every collected order keeps food out of landfill and puts a meal on someone's plate.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "listings" && (
          <ListingsTab items={items} restaurantId={restaurantId} />
        )}

        {tab === "orders" && (
          <div className="bg-surface border border-kraft rounded-[20px] overflow-hidden">
            <div className="grid grid-cols-[1fr_1.2fr_auto_auto] gap-4 px-6 py-3 border-b border-kraft text-[11px] uppercase tracking-widest text-ink/55 font-semibold">
              <div>Customer</div>
              <div>Item</div>
              <div>Pickup</div>
              <div className="text-right">Action</div>
            </div>
            {orders.length === 0 && (
              <div className="px-6 py-12 text-center text-ink/55 text-sm">
                No customer orders yet. When a customer reserves one of your listings,
                it'll appear here in real time.
              </div>
            )}
            {orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[1fr_1.2fr_auto_auto] gap-4 px-6 py-4 border-b border-kraft last:border-b-0 items-center text-sm"
              >
                <div>
                  <div className="font-medium">{o.customerName ?? "Guest"}</div>
                  <div className="text-xs text-ink/55">
                    {o.quantity ?? 1} × ₹{(o.unitPrice ?? o.price).toFixed(0)} = ₹{o.price.toFixed(0)}
                  </div>
                </div>
                <div className="text-ink/80 truncate">{o.title}</div>
                <div className="text-ink/70 tabular-nums">{o.pickupSlot}</div>
                <div className="flex justify-end gap-2">
                  {o.status === "reserved" && (
                    <>
                      <button
                        onClick={() => setOrderStatus(o.id, "collected")}
                        className="inline-flex items-center gap-1 bg-moss/10 text-moss px-3 py-1.5 rounded-full text-xs font-semibold"
                      >
                        <CheckCircle2 className="size-3.5" /> Mark collected
                      </button>
                      <button
                        onClick={() => setOrderStatus(o.id, "cancelled")}
                        className="inline-flex items-center gap-1 bg-ink/5 text-ink/60 px-3 py-1.5 rounded-full text-xs font-semibold"
                      >
                        <XCircle className="size-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {(o.status === "collected" || o.status === "cancelled") && (
                    <span
                      className={
                        "text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full " +
                        (o.status === "collected"
                          ? "bg-moss/10 text-moss"
                          : "bg-ink/5 text-ink/50")
                      }
                    >
                      {o.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface border border-kraft rounded-[20px] p-6">
                <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold mb-1">
                  Revenue recovered
                </div>
                <h3 className="font-display text-3xl mb-4">₹{weekRevenue.toFixed(0)}</h3>
                <div className="h-44">
                  {weekRevenue > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={weekData}>
                        <XAxis dataKey="day" stroke="oklch(0.48 0.02 60)" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="oklch(0.475 0.06 150)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-ink/50">
                      No revenue yet — your weekly chart fills in as orders come in.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-surface border border-kraft rounded-[20px] p-6">
                <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold mb-1">
                  Top items this week
                </div>
                {topItems.length > 0 ? (
                  <ul className="divide-y divide-kraft mt-4">
                    {topItems.map(([name, n]) => (
                      <li key={name} className="flex justify-between py-2.5 text-sm">
                        <span className="truncate pr-3">{name}</span>
                        <span className="font-semibold tabular-nums">{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-6 text-sm text-ink/50">
                    No orders yet. Once customers reserve your listings, your best-sellers will show here.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-surface border border-kraft rounded-[20px] p-5">
      <div className="size-9 rounded-full bg-sunset/10 text-sunset flex items-center justify-center mb-4">
        <Icon className="size-4" />
      </div>
      <div className="font-display text-3xl tabular-nums leading-none mb-1.5">{value}</div>
      <div className="text-xs text-ink/60 font-medium">{label}</div>
    </div>
  );
}

function ListingsTab({
  items,
  restaurantId,
}: {
  items: Listing[];
  restaurantId: string;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid gap-6">
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            <Plus className="size-4" /> Add listing
          </button>
        </div>
      )}

      {showForm && (
        <NewListingForm
          restaurantId={restaurantId}
          onCancel={() => setShowForm(false)}
          onSave={(l) => {
            addLiveListing(l);
            setShowForm(false);
          }}
        />
      )}

      <div className="grid gap-3">
        {items.map((l) => (
          <RestaurantListingRow key={l.id} listing={l} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-16 border border-dashed border-kraft rounded-[20px]">
            <div className="font-display text-2xl mb-2">No listings yet</div>
            <p className="text-ink/60">Tap "Add listing" to post tonight's surplus — customers will see it instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RestaurantListingRow({ listing }: { listing: Listing }) {
  const reserved = useReservedUnits(listing.id);
  const remaining = Math.max(0, listing.quantity - reserved);
  const { label, expired } = useCountdown(getExpiresAt(listing), true);
  return (
    <div className="bg-surface border border-kraft rounded-2xl p-4 flex items-center gap-4">
      <img src={listing.image} alt={listing.title} className="size-16 rounded-xl object-cover" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{listing.title}</div>
        <div className="text-xs text-ink/55">
          ₹{listing.discountedPrice.toFixed(0)} · {remaining}/{listing.quantity} left ·{" "}
          <span className="tabular-nums">{expired ? "Expired" : `Ends in ${label}`}</span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-moss bg-moss/10 px-2 py-1 rounded-full">
        <span className="size-1.5 rounded-full bg-moss animate-pulse" /> Live
      </span>
      <button
        onClick={() => removeLiveListing(listing.id)}
        className="text-xs font-semibold text-ink/55 hover:text-destructive"
      >
        Remove
      </button>
    </div>
  );
}

function NewListingForm({
  restaurantId,
  onCancel,
  onSave,
}: {
  restaurantId: string;
  onCancel: () => void;
  onSave: (l: Listing) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Bakery");
  const [dietary, setDietary] = useState<DietaryTag[]>(["Veg"]);
  const [original, setOriginal] = useState(300);
  const [discounted, setDiscounted] = useState(120);
  const [quantity, setQuantity] = useState(4);
  const [expires, setExpires] = useState(60);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const autoImage = useMemo(
    () => (title.trim() ? pickFoodImage(title, category) : null),
    [title, category],
  );
  const previewImage = uploadedImage ?? autoImage;

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Please upload an image under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // (Smart pricing suggestion intentionally removed — restaurant sets its own price.)
  const toggleDiet = (d: DietaryTag) =>
    setDietary((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const expiresAt = Date.now() + expires * 60_000;
    const finalImage = uploadedImage ?? pickFoodImage(title, category);
    onSave({
      id: `lnew_${Date.now()}`,
      restaurantId,
      title: title.trim(),
      description:
        description.trim() || "Freshly posted surplus from tonight's service.",
      category,
      dietary: dietary.length ? dietary : ["Veg"],
      image: finalImage,
      originalPrice: original,
      discountedPrice: discounted,
      quantity,
      expiresInMinutes: expires,
      expiresAt,
      pickupWindow: "Closes in " + expires + " min",
      distanceMi: 0.1,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-surface border border-kraft rounded-[20px] p-6 grid gap-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">New surplus listing</h3>
        <button type="button" onClick={onCancel} className="text-sm text-ink/55 hover:text-ink">
          Cancel
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-5 items-start">
        <div className="grid gap-5">
          <Field label="Item name">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chocolate cake, Fresh juices, Margherita pizza"
              className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sunset/40"
              required
            />
          </Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors " +
                    (category === c
                      ? "bg-ink text-sand border-ink"
                      : "bg-sand border-kraft text-ink/70 hover:bg-kraft/40")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Dietary">
            <div className="flex flex-wrap gap-2">
              {(["Veg", "Non-Veg", "Vegan", "Contains Gluten"] as DietaryTag[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDiet(d)}
                  className={
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors " +
                    (dietary.includes(d)
                      ? "bg-moss text-moss-foreground border-moss"
                      : "bg-sand border-kraft text-ink/70 hover:bg-kraft/40")
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's in the bag?"
              className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sunset/40"
            />
          </Field>
        </div>
        <div className="md:w-48">
          <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold mb-1.5">
            Photo
          </div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-kraft border border-kraft">
            {previewImage ? (
              <img
                key={previewImage}
                src={previewImage}
                alt="Listing preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink/40 text-center px-3">
                Upload a photo or type a name
              </div>
            )}
          </div>
          <label className="mt-2 inline-flex items-center justify-center w-full bg-ink text-sand px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-ink/85">
            {uploadedImage ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />
          </label>
          {uploadedImage && (
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              className="mt-1.5 w-full text-[10px] text-ink/55 hover:text-destructive"
            >
              Remove & use auto photo
            </button>
          )}
          <p className="text-[10px] text-ink/50 mt-1.5 leading-snug">
            {uploadedImage
              ? "Customers will see the photo you uploaded."
              : "No upload? We'll auto-match a photo from your item name."}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Original price (₹)">
          <input
            type="number"
            min={1}
            value={original}
            onChange={(e) => setOriginal(+e.target.value)}
            className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm"
          />
        </Field>
        <Field label="Discounted price (₹)">
          <input
            type="number"
            min={1}
            step={1}
            value={discounted}
            onChange={(e) => setDiscounted(+e.target.value)}
            className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm"
          />
        </Field>
        <Field label="Quantity">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(+e.target.value)}
            className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm"
          />
        </Field>
        <Field label="Expires in (minutes)">
          <input
            type="number"
            min={5}
            value={expires}
            onChange={(e) => setExpires(+e.target.value)}
            className="w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm"
          />
        </Field>
      </div>


      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="bg-ink text-sand px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-ink/85"
        >
          Publish listing
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function RestaurantProfileCard() {
  const auth = useAuth();
  const u = auth.user;
  if (!u) return null;
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Please pick a photo under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => auth.updateProfile({ photo: reader.result as string });
    reader.readAsDataURL(file);
  };
  return (
    <div className="bg-surface border border-kraft rounded-[20px] p-5 flex items-center gap-4">
      <div className="size-16 rounded-2xl overflow-hidden bg-kraft/40 border border-kraft shrink-0">
        {u.photo ? (
          <img src={u.photo} alt={u.restaurantName ?? u.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ink/45">No photo</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">Restaurant profile</div>
        <div className="font-medium truncate">{u.restaurantName ?? u.name}</div>
        {u.address && <div className="text-xs text-ink/55 truncate">{u.address}</div>}
      </div>
      <div className="flex flex-col gap-1.5 items-end">
        <label className="inline-flex items-center justify-center bg-ink text-sand px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-ink/85">
          {u.photo ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
        {u.photo && (
          <button
            onClick={() => auth.updateProfile({ photo: undefined })}
            className="text-[10px] text-ink/55 hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
