import { NextResponse } from "next/server";

/** Prefer server-only `API_BASE_URL`; fall back to public URL for local dev. */
export function getUpstreamApiBaseUrl(): string | null {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function upstreamUnavailableMessage(): string {
  const base = getUpstreamApiBaseUrl();
  return base
    ? `Cannot reach API at ${base}. Start deltadb: cd deltadb && npm run dev`
    : "API upstream URL is not configured. Set NEXT_PUBLIC_API_BASE_URL in hrm/.env";
}

export function appendUpstreamSetCookies(target: NextResponse, upstream: Response) {
  const list =
    typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const c of list) {
    target.headers.append("Set-Cookie", c);
  }
}

function isConnectionRefused(err: unknown, depth = 0): boolean {
  if (!err || typeof err !== "object" || depth > 5) return false;
  const e = err as {
    code?: string;
    message?: string;
    cause?: unknown;
    errors?: unknown[];
  };
  if (e.code === "ECONNREFUSED") return true;
  const msg = typeof e.message === "string" ? e.message : "";
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) return true;
  if (e.cause && isConnectionRefused(e.cause, depth + 1)) return true;
  if (Array.isArray(e.errors) && e.errors.some((x) => isConnectionRefused(x, depth + 1))) {
    return true;
  }
  return false;
}

let lastUpstreamWarnAt = 0;

function warnUpstreamOnce(message: string) {
  const now = Date.now();
  if (now - lastUpstreamWarnAt < 30_000) return;
  lastUpstreamWarnAt = now;
  console.warn(`[hrm] ${message}`);
}

/** Fetch deltadb without throwing when the server is down (ECONNREFUSED). */
export async function fetchUpstream(
  url: string,
  init?: RequestInit,
): Promise<Response | NextResponse> {
  try {
    return await fetch(url, { cache: "no-store", ...init });
  } catch (err) {
    const message = isConnectionRefused(err)
      ? upstreamUnavailableMessage()
      : err instanceof Error
        ? err.message
        : "Upstream request failed";
    warnUpstreamOnce(message);
    return NextResponse.json({ message }, { status: 503 });
  }
}
