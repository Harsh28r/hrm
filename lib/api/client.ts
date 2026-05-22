import { getApiBaseUrl } from "@/lib/config/env";
import { ApiError, parseErrorResponse } from "@/lib/api/errors";
import { notifySessionExpired } from "@/lib/api/session-bridge";
import { getAuthHeaders } from "@/lib/auth/get-auth-headers";

export type ApiFetchOptions = RequestInit & {
  /** Skip attaching Authorization / cookies when true */
  skipAuth?: boolean;
};

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Typed fetch to the external HR API. No Next Route Handler required.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw ApiError.notConfigured();
  }

  const { skipAuth, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!skipAuth) {
    const auth = await getAuthHeaders();
    for (const [k, v] of Object.entries(auth)) {
      if (!headers.has(k)) headers.set(k, v);
    }
  }

  if (
    rest.body != null &&
    typeof rest.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(joinUrl(base, path), {
    ...rest,
    headers,
    cache: rest.cache ?? "no-store",
  });

  if (!res.ok) {
    const err = await parseErrorResponse(res);
    if (res.status === 401 && typeof window !== "undefined" && !skipAuth) {
      notifySessionExpired();
    }
    throw err;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as T;
  }

  return res.json() as Promise<T>;
}
