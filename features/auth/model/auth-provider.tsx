"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authBffLogin, authBffLogout, authBffMe } from "@/features/auth/api/auth-bff";
import { normalizeAppUser } from "@/lib/auth/normalize-user";
import { setSessionExpiredHandler } from "@/lib/api/session-bridge";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredUserJson,
  isRememberedAuth,
  setStoredSession,
} from "@/lib/auth/session-storage";
import type { AppUser } from "@/lib/auth/types";

export type AuthContextValue = {
  user: AppUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseStoredUser(): AppUser | null {
  const raw = getStoredUserJson();
  if (!raw) return null;
  try {
    return normalizeAppUser(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const logoutInFlight = useRef(false);

  const persistUserFromMe = useCallback((payload: Record<string, unknown>) => {
    const inner = (payload.user ?? payload) as unknown;
    const next = normalizeAppUser(inner);
    if (!next) return;
    setUser(next);
    const token = getStoredAccessToken();
    if (!token) return;
    const remember = isRememberedAuth();
    const raw = payload.user && typeof payload.user === "object" ? payload.user : inner;
    setStoredSession(token, JSON.stringify(raw), remember);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) return;
    const res = await authBffMe(token);
    if (res.status === 401) {
      clearStoredSession();
      setUser(null);
      setAccessToken(null);
      return;
    }
    if (!res.ok) return;
    const data = await parseJsonSafe(res);
    persistUserFromMe(data);
  }, [persistUserFromMe]);

  const logout = useCallback(async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    try {
      const t = getStoredAccessToken();
      await authBffLogout(t);
    } catch {
      /* ignore */
    } finally {
      clearStoredSession();
      setUser(null);
      setAccessToken(null);
      logoutInFlight.current = false;
      if (pathname !== "/login" && !pathname?.startsWith("/forgot-password")) {
        router.replace("/login");
      }
    }
  }, [router, pathname]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void logout();
    });
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  useEffect(() => {
    const token = getStoredAccessToken();
    const u = parseStoredUser();
    setAccessToken(token);
    setUser(u);
    setIsBootstrapping(false);
    if (token) {
      void (async () => {
        const res = await authBffMe(token);
        if (res.status === 401) {
          clearStoredSession();
          setUser(null);
          setAccessToken(null);
          return;
        }
        if (!res.ok) return;
        const data = await parseJsonSafe(res);
        persistUserFromMe(data);
      })();
    }
  }, [persistUserFromMe]);

  const login = useCallback(
    async (email: string, password: string, remember: boolean): Promise<{ ok: true } | { ok: false; message: string }> => {
      const res = await authBffLogin({ email: email.trim(), password });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        const errStr = "error" in data && typeof data.error === "string" ? data.error : "";
        const msg =
          (typeof data.message === "string" && data.message) || errStr || "Sign in failed.";
        return { ok: false, message: msg };
      }
      const token = typeof data.token === "string" ? data.token : "";
      if (!token) {
        return { ok: false, message: "Invalid response: missing token." };
      }
      const normalized = normalizeAppUser(data.user);
      if (!normalized) {
        return { ok: false, message: "Invalid response: missing user." };
      }
      const raw = data.user && typeof data.user === "object" ? data.user : normalized;
      setStoredSession(token, JSON.stringify(raw), remember);
      setAccessToken(token);
      setUser(normalized);
      await refreshUser();
      return { ok: true };
    },
    [refreshUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      login,
      logout,
      refreshUser,
    }),
    [user, accessToken, isBootstrapping, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
