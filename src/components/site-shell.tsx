import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Sparkles, Store, LogOut, UserCircle2 } from "lucide-react";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const orders = useOrders();
  const auth = useAuth();
  const activeCount = orders.filter((o) => o.status === "reserved").length;

  const navItems = [
    { to: "/discover", label: "Discover", icon: Sparkles },
    { to: "/impact", label: "Impact", icon: Sparkles },
    { to: "/restaurant", label: "For Partners", icon: Store },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-sand/80 border-b border-kraft/60">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-baseline gap-1 group">
          <span className="font-display text-2xl font-semibold tracking-tight">
            RePlate
          </span>
          <span className="text-sunset font-display text-2xl leading-none">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "px-3.5 py-2 text-sm font-medium rounded-full transition-colors " +
                  (active
                    ? "bg-ink text-sand"
                    : "text-ink/70 hover:text-ink hover:bg-kraft/40")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {auth.isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink/65 px-2.5 py-1.5 rounded-full bg-kraft/40">
                <UserCircle2 className="size-3.5" />
                <span className="font-medium">{auth.user?.name}</span>
                <span className="text-ink/40">·</span>
                <span className="uppercase tracking-widest text-[10px] text-moss font-semibold">
                  {auth.user?.role}
                </span>
              </div>
              <button
                onClick={() => {
                  auth.logout();
                  navigate({ to: "/" });
                }}
                title="Sign out"
                className="inline-flex items-center justify-center size-9 rounded-full border border-kraft text-ink/60 hover:text-ink hover:bg-kraft/40"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "login", role: "user", redirect: location.pathname }}
              className="text-sm font-semibold text-ink/70 hover:text-ink px-3 py-2"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/orders"
            className="relative inline-flex items-center gap-2 bg-ink text-sand px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/85 transition-colors shadow-soft"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Brown Bag</span>
            <span className="tabular-nums">({activeCount})</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-kraft/60 bg-sand">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div className="md:col-span-2">
          <div className="font-display text-2xl font-semibold mb-2">
            RePlate<span className="text-sunset">.</span>
          </div>
          <p className="text-ink/65 max-w-md leading-relaxed">
            A neighborhood marketplace for surplus food. Rescue great meals from
            local kitchens before they close — at a price that feels neighborly.
          </p>
        </div>
        <div>
          <div className="font-medium mb-3 text-ink">Eat</div>
          <ul className="space-y-2 text-ink/65">
            <li><Link to="/discover" className="hover:text-sunset">Discover</Link></li>
            <li><Link to="/orders" className="hover:text-sunset">My orders</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3 text-ink">Partner</div>
          <ul className="space-y-2 text-ink/65">
            <li><Link to="/restaurant" className="hover:text-sunset">Dashboard</Link></li>
            <li><Link to="/impact" className="hover:text-sunset">Impact tracker</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-kraft/60 py-5 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} RePlate — saving food, one bag at a time.
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-sand text-ink">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
