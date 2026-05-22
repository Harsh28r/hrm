import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchUpstream, getUpstreamApiBaseUrl } from "@/app/api/_lib/upstream";
import {
  filterManualEntryUsersBySearch,
  mapPermissionsUserToPicker,
  normalizeManualEntryUserList,
  type ManualEntryPermissionsUserRow,
  type ManualEntryUser,
} from "@/entities/attendance/model/manual-entry";

const PICKER_CACHE_TTL_MS = 90_000;
let pickerCache: { at: number; users: ManualEntryUser[] } | null = null;

async function loadAllPickerUsers(auth: string | null): Promise<ManualEntryUser[]> {
  if (pickerCache && Date.now() - pickerCache.at < PICKER_CACHE_TTL_MS) {
    return pickerCache.users;
  }

  const base = getUpstreamApiBaseUrl();
  if (!base) return [];

  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = auth;

  const upstream = await fetchUpstream(`${base}/api/permissions/all-users`, {
    method: "GET",
    headers,
  });
  if (upstream instanceof NextResponse) return [];

  let payload: { users?: ManualEntryPermissionsUserRow[] } = {};
  try {
    payload = (await upstream.json()) as { users?: ManualEntryPermissionsUserRow[] };
  } catch {
    payload = {};
  }

  const users = normalizeManualEntryUserList(
    (payload.users ?? []).map(mapPermissionsUserToPicker).filter((u) => u != null),
  );
  pickerCache = { at: Date.now(), users };
  return users;
}

/** User picker for manual entry + attendance matrix search (auth, not superadmin-only). */
export async function GET(request: NextRequest) {
  const base = getUpstreamApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "API upstream not configured." }, { status: 503 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 500);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 2000) : 500;

  const auth = request.headers.get("authorization");
  const all = await loadAllPickerUsers(auth);
  const filtered = filterManualEntryUsersBySearch(all, search);
  const users = filtered.slice(0, limit);

  return NextResponse.json({
    users,
    total: filtered.length,
  });
}
