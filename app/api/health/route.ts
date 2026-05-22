import { NextResponse } from "next/server";

/**
 * BFF scaffold route.
 * Keep browser clients calling same-origin `/api/*` when you need to hide upstream URLs.
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "hrm-frontend" });
}
