import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchUpstream, getUpstreamApiBaseUrl } from "@/app/api/_lib/upstream";

/** Maps to upstream `POST /api/superadmin/forgot-password/{request|verify|reset}` */
const FORGOT_ACTIONS = new Set(["request", "verify", "reset"]);

export async function POST(request: NextRequest) {
  const base = getUpstreamApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "API upstream not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  if (!FORGOT_ACTIONS.has(action)) {
    return NextResponse.json(
      { message: "Invalid or missing `action`. Use: request | verify | reset." },
      { status: 400 },
    );
  }

  const { action: _discard, ...payload } = body;

  const upstream = await fetchUpstream(`${base}/api/superadmin/forgot-password/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (upstream instanceof NextResponse) return upstream;

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
