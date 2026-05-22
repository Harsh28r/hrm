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
    return NextResponse.json({ message: "API upstream not configured. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const upstream = await fetchUpstream(`${base}/api/superadmin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
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
