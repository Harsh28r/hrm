import { apiFetch } from "@/shared/api";
import { fetchPickerUsers } from "@/entities/user/api/picker-queries";
import { fetchAttendanceAdminAll } from "@/entities/attendance/api/queries";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import type { ManualEntryRequest } from "@/entities/attendance/model/manual-entry";
import type { ManualEntryUser } from "@/entities/attendance/model/manual-entry";

export type { ManualEntryUser } from "@/entities/attendance/model/manual-entry";

/** Searchable user list for manual-entry picker (via `/api/users/picker`, not superadmin-only HRM route). */
export async function fetchManualEntryUsers(search?: string): Promise<ManualEntryUser[]> {
  const res = await fetchPickerUsers({ search, limit: search?.trim() ? 200 : 500 });
  return res.users;
}

function normalizeRecord(
  raw: AttendanceAdminRecord & { _id?: string },
): AttendanceAdminRecord {
  return {
    ...raw,
    id: raw.id ?? (raw._id ? String(raw._id) : ""),
  };
}

/** HR: create punch record when app check-in/out failed (CRM manual entry). */
export async function createManualAttendanceEntry(
  body: ManualEntryRequest,
): Promise<AttendanceAdminRecord> {
  const res = await apiFetch<{ attendance: AttendanceAdminRecord & { _id?: string } }>(
    "/api/attendance/admin/manual-entry",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return normalizeRecord(res.attendance);
}

/** Recent manual entries for the audit list on the manual entry page. */
export async function fetchRecentManualEntries(limit = 20): Promise<AttendanceAdminRecord[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);

  const res = await fetchAttendanceAdminAll({
    filter: { kind: "range", from: start, to: end },
    page: 1,
    limit: 300,
  });

  return res.attendance
    .filter((a) => a.isManualEntry)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((a) => normalizeRecord(a as AttendanceAdminRecord & { _id?: string }));
}
