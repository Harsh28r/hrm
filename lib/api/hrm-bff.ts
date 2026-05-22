import { getStoredAccessToken } from "@/lib/auth/session-storage";
import { ApiError, parseErrorResponse } from "@/lib/api/errors";

export async function hrmBffFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const p = path.startsWith("/") ? path.slice(1) : path;
  const res = await fetch(`/api/hrm/${p}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  return res.json() as Promise<T>;
}
