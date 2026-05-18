/** Minimal client-side role-based auth (localStorage). Demo only — not secure. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { upsertLiveRestaurant } from "@/lib/live-store";

export type Role = "user" | "restaurant";

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Restaurant-only fields */
  restaurantName?: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** Restaurant cover/storefront photo (data URL). */
  photo?: string;
}

interface StoredAccount extends AuthAccount {
  password: string;
}

const ACCOUNTS_KEY = "replate.accounts.v1";
const SESSION_KEY = "replate.session.v1";

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeAccounts(a: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
}
function readSession(): AuthAccount | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
}
function writeSession(a: AuthAccount | null) {
  if (a) localStorage.setItem(SESSION_KEY, JSON.stringify(a));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("replate:auth"));
}

interface AuthContextValue {
  user: AuthAccount | null;
  isAuthenticated: boolean;
  isUser: boolean;
  isRestaurant: boolean;
  signup: (input: {
    email: string;
    password: string;
    name: string;
    role: Role;
    restaurantName?: string;
    neighborhood?: string;
    address?: string;
    lat?: number;
    lng?: number;
    photo?: string;
  }) => { ok: true } | { ok: false; error: string };
  login: (
    email: string,
    password: string,
    role: Role,
  ) => { ok: true } | { ok: false; error: string };
  loginWithGoogle: (role: Role) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Omit<AuthAccount, "id" | "role">>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthAccount | null>(null);

  useEffect(() => {
    setUser(readSession());
    const sync = () => setUser(readSession());
    window.addEventListener("replate:auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("replate:auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signup: AuthContextValue["signup"] = useCallback((input) => {
    const all = readAccounts();
    if (all.some((a) => a.email.toLowerCase() === input.email.toLowerCase())) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const account: StoredAccount = {
      id: `u_${Math.random().toString(36).slice(2, 10)}`,
      email: input.email,
      name: input.name,
      role: input.role,
      restaurantName: input.restaurantName,
      neighborhood: input.neighborhood,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      photo: input.photo,
      password: input.password,
    };
    writeAccounts([...all, account]);
    const { password: _pw, ...session } = account;
    writeSession(session);
    setUser(session);
    if (account.role === "restaurant") {
      upsertLiveRestaurant({
        id: account.id,
        name: account.restaurantName ?? account.name,
        neighborhood: account.neighborhood,
        address: account.address,
        lat: account.lat,
        lng: account.lng,
        photo: account.photo,
      });
    }
    return { ok: true };
  }, []);

  const login: AuthContextValue["login"] = useCallback((email, password, role) => {
    const found = readAccounts().find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
    );
    if (!found) return { ok: false, error: "Invalid email or password." };
    if (found.role !== role) {
      return {
        ok: false,
        error: `This account is registered as a ${found.role}, not a ${role}.`,
      };
    }
    const { password: _pw, ...session } = found;
    writeSession(session);
    setUser(session);
    if (session.role === "restaurant") {
      upsertLiveRestaurant({
        id: session.id,
        name: session.restaurantName ?? session.name,
        neighborhood: session.neighborhood,
        address: session.address,
        lat: session.lat,
        lng: session.lng,
      });
    }
    return { ok: true };
  }, []);

  const loginWithGoogle: AuthContextValue["loginWithGoogle"] = useCallback((role) => {
    // Demo-only mock — no real OAuth.
    const demo: AuthAccount =
      role === "restaurant"
        ? {
            id: "g_rest_demo",
            email: "demo.partner@replate.app",
            name: "Demo Partner",
            role: "restaurant",
            restaurantName: "Demo Kitchen",
            neighborhood: "Connaught Place",
            address: "Block A, Connaught Place, New Delhi",
          }
        : {
            id: "g_user_demo",
            email: "demo.eater@replate.app",
            name: "Demo Eater",
            role: "user",
          };
    writeSession(demo);
    setUser(demo);
    if (demo.role === "restaurant") {
      upsertLiveRestaurant({
        id: demo.id,
        name: demo.restaurantName ?? demo.name,
        neighborhood: demo.neighborhood,
        address: demo.address,
      });
    }
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const updateProfile: AuthContextValue["updateProfile"] = useCallback((patch) => {
    const current = readSession();
    if (!current) return;
    const next = { ...current, ...patch };
    const all = readAccounts();
    writeAccounts(
      all.map((a) => (a.id === current.id ? { ...a, ...patch } : a)),
    );
    writeSession(next);
    setUser(next);
    if (next.role === "restaurant") {
      upsertLiveRestaurant({
        id: next.id,
        name: next.restaurantName ?? next.name,
        neighborhood: next.neighborhood,
        address: next.address,
        lat: next.lat,
        lng: next.lng,
        photo: next.photo,
      });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isUser: user?.role === "user",
      isRestaurant: user?.role === "restaurant",
      signup,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
    }),
    [user, signup, login, loginWithGoogle, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
