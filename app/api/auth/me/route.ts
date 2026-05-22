import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchUpstream, getUpstreamApiBaseUrl } from "@/app/api/_lib/upstream";

export async function GET(request: NextRequest) {
  const base = getUpstreamApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "API upstream not configured." }, { status: 503 });
  }

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const upstream = await fetchUpstream(`${base}/api/superadmin/me`, {
    method: "GET",
    headers,
  });
  if (upstream instanceof NextResponse) return upstream;

  const ct = upstream.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  const text = await upstream.text();
  return new NextResponse(text, { status: upstream.status });
}
