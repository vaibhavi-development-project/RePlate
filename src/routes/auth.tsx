import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, ChromeIcon, User, Store } from "lucide-react";
import { PageShell } from "@/components/site-shell";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as "login" | "signup") ?? "login",
    role: (search.role as Role) ?? "user",
    redirect: (search.redirect as string) ?? "/",
  }),
  head: () => ({
    meta: [{ title: "Sign in — RePlate" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const [role, setRole] = useState<Role>(search.role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Please pick a photo under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const after = (ok: boolean, message?: string) => {
    if (!ok) {
      setError(message);
      return;
    }
    setError(undefined);
    navigate({
      to: role === "restaurant" ? "/restaurant" : (search.redirect as "/"),
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const res = auth.login(email, password, role);
      after(res.ok, res.ok ? undefined : res.error);
    } else {
      const res = auth.signup({
        email,
        password,
        name: name || email.split("@")[0],
        role,
        restaurantName: role === "restaurant" ? restaurantName : undefined,
        neighborhood: role === "restaurant" ? neighborhood : undefined,
        address: role === "restaurant" ? address : undefined,
        lat: role === "restaurant" ? coords?.lat : undefined,
        lng: role === "restaurant" ? coords?.lng : undefined,
        photo: role === "restaurant" ? photo ?? undefined : undefined,
      });
      after(res.ok, res.ok ? undefined : res.error);
    }
  };

  const google = () => {
    auth.loginWithGoogle(role);
    navigate({ to: role === "restaurant" ? "/restaurant" : "/" });
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-5 md:px-8 pt-10 pb-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-sunset font-semibold mb-3">
          <Leaf className="size-3.5" /> RePlate
        </Link>
        <h1 className="font-display text-4xl font-light tracking-tight mb-2">
          {mode === "login" ? (
            <>Welcome <span className="italic text-sunset font-medium">back</span></>
          ) : (
            <>Join the <span className="italic text-sunset font-medium">rescue</span></>
          )}
        </h1>
        <p className="text-ink/60 mb-6 text-sm">
          {mode === "login"
            ? "Sign in to reserve meals or manage your restaurant."
            : "Create an account in seconds — no credit card required."}
        </p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 bg-surface border border-kraft rounded-2xl p-1.5 mb-5">
          <RoleButton active={role === "user"} onClick={() => setRole("user")} icon={User} label="I want to eat" />
          <RoleButton active={role === "restaurant"} onClick={() => setRole("restaurant")} icon={Store} label="I'm a restaurant" />
        </div>

        <form onSubmit={submit} className="bg-surface border border-kraft rounded-[20px] p-6 grid gap-4">
          {mode === "signup" && (
            <Field label="Your name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Maya R." />
            </Field>
          )}
          {mode === "signup" && role === "restaurant" && (
            <>
              <Field label="Restaurant name">
                <input required value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className={inputCls} placeholder="Spice Garden" />
              </Field>
              <Field label="Neighborhood / Area">
                <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputCls} placeholder="Connaught Place" />
              </Field>
              <Field label="Full address">
                <textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputCls} placeholder="Shop 12, Block A, Connaught Place, New Delhi 110001" />
              </Field>
              <Field label="Restaurant photo (optional)">
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-2xl overflow-hidden border border-kraft bg-kraft/40 shrink-0 flex items-center justify-center text-[10px] text-ink/50 text-center">
                    {photo ? (
                      <img src={photo} alt="Restaurant" className="w-full h-full object-cover" />
                    ) : (
                      "No photo"
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="inline-flex items-center justify-center bg-ink text-sand px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer hover:bg-ink/85">
                      {photo ? "Change photo" : "Upload photo"}
                      <input type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
                    </label>
                    {photo && (
                      <button type="button" onClick={() => setPhoto(null)} className="text-[10px] text-ink/55 hover:text-destructive">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </Field>
              <div>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="w-full inline-flex items-center justify-center gap-2 border border-kraft py-2.5 rounded-full text-xs font-semibold hover:bg-kraft/40 disabled:opacity-60"
                >
                  {coords
                    ? `📍 Location set (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`
                    : locating
                      ? "Locating…"
                      : "📍 Use my current location (optional)"}
                </button>
              </div>
            </>
          )}
          <Field label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="•••••••" />
          </Field>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <button type="submit" className="bg-ink text-sand py-3 rounded-full text-sm font-semibold hover:bg-ink/85">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-kraft" /></div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-widest text-ink/45">
              <span className="bg-surface px-2">or</span>
            </div>
          </div>

          <button type="button" onClick={google} className="inline-flex items-center justify-center gap-2 border border-kraft py-3 rounded-full text-sm font-semibold hover:bg-kraft/40">
            <ChromeIcon className="size-4" /> Continue with Google (demo)
          </button>
        </form>

        <div className="text-center text-sm text-ink/60 mt-5">
          {mode === "login" ? (
            <>New to RePlate?{" "}
              <button onClick={() => { setMode("signup"); setError(undefined); }} className="text-sunset font-semibold hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(undefined); }} className="text-sunset font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

const inputCls =
  "w-full bg-sand border border-kraft rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sunset/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] uppercase tracking-widest text-ink/55 font-semibold">{label}</span>
      {children}
    </label>
  );
}

function RoleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors " +
        (active ? "bg-ink text-sand" : "text-ink/65 hover:text-ink")
      }
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
