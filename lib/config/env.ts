/**
 * Client-safe env helpers. `NEXT_PUBLIC_*` is inlined at build time.
 * Add server-only secrets via separate modules when you introduce a BFF.
 */

/** Base URL for the external HR API (no trailing slash). */
export function getApiBaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/+$/, "");
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}
