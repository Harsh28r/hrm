import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  appendUpstreamSetCookies,
  fetchUpstream,
  getUpstreamApiBaseUrl,
} from "@/app/api/_lib/upstream";

export async function POST(request: NextRequest) {
  const base = getUpstreamApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "API upstream not configured." }, { status: 503 });
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const upstream = await fetchUpstream(`${base}/api/superadmin/logout`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  if (upstream instanceof NextResponse) return upstream;

  let data: unknown = {};
  try {
    data = await upstream.json();
  } catch {
    /* empty */
  }

  const res = NextResponse.json(data, { status: upstream.status });
  appendUpstreamSetCookies(res, upstream);
  return res;
}
