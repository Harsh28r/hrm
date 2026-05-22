import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Correlation ID for logs / API calls. Add auth redirects here when session exists.
 */
export function proxy(request: NextRequest) {
  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
