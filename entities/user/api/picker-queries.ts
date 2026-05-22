import { getStoredAccessToken } from "@/lib/auth/session-storage";
import { ApiError, parseErrorResponse } from "@/lib/api/errors";
import type { ManualEntryUser } from "@/entities/attendance/model/manual-entry";

export type PickerUsersResponse = {
  users: ManualEntryUser[];
  total: number;
};

/**
 * Searchable employee/user list for pickers (manual entry, attendance matrix).
 * Uses Next `/api/users/picker` → deltadb `/api/permissions/all-users` (works with normal HR auth).
 */
export async function fetchPickerUsers(params?: {
  search?: string;
  limit?: number;
}): Promise<PickerUsersResponse> {
  const q = new URLSearchParams();
  const search = params?.search?.trim();
  if (search) q.set("search", search);
  if (params?.limit) q.set("limit", String(params.limit));

  const suffix = q.toString() ? `?${q}` : "";
  const headers = new Headers();
  const token = getStoredAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api/users/picker${suffix}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return res.json() as Promise<PickerUsersResponse>;
}
