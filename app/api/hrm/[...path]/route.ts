import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  appendUpstreamSetCookies,
  fetchUpstream,
  getUpstreamApiBaseUrl,
} from "@/app/api/_lib/upstream";
async function proxy(request: NextRequest, pathSegments: string[]) {
  const base = getUpstreamApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "API upstream not configured." }, { status: 503 });
  }

  const subPath = pathSegments.join("/");
  const url = new URL(`${base}/api/hrm/${subPath}`);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const authHeader = request.headers.get("authorization");
  const headers: Record<string, string> = {};
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (authHeader) headers.Authorization = authHeader;

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetchUpstream(url.toString(), init);
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

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
