/**
 * Same-origin auth BFF (`/api/auth/*`) — avoids CORS and forwards Set-Cookie from upstream.
 */
export const authBffPaths = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  me: "/api/auth/me",
  /** Single BFF: `POST` body `{ action: "request"|"verify"|"reset", ... }` — see `app/(auth)/forgot-password/api/route.ts` */
  forgotPassword: "/forgot-password/api",
} as const;

export type LoginResponse = {
  token?: string;
  user?: unknown;
  message?: string;
};

export async function authBffLogin(body: { email: string; password: string }): Promise<Response> {
  return fetch(authBffPaths.login, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function authBffLogout(token: string | null): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(authBffPaths.logout, {
    method: "POST",
    credentials: "include",
    headers,
    body: "{}",
    cache: "no-store",
  });
}

export async function authBffMe(token: string | null): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(authBffPaths.me, {
    method: "GET",
    credentials: "include",
    headers,
    cache: "no-store",
  });
}
