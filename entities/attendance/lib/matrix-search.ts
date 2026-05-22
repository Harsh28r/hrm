import type { AttendanceGridEmployee } from "@/entities/attendance/model/grid";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import {
  coerceManualEntryText,
  manualEntrySearchKey,
  matchesManualEntryUserSearch,
} from "@/entities/attendance/model/manual-entry";
import { punchUserId } from "@/entities/attendance/lib/map-punch-to-cell";

export function attendanceRecordMatchesMatrixSearch(
  att: AttendanceAdminRecord,
  query: unknown,
): boolean {
  const q = manualEntrySearchKey(query);
  if (!q) return true;
  const uid = punchUserId(att);
  if (uid && manualEntrySearchKey(uid).includes(q)) return true;
  const u = att.user;
  if (!u || typeof u !== "object") return false;
  return matchesManualEntryUserSearch(
    {
      id: uid ?? "",
      name: coerceManualEntryText(u.name),
      email: coerceManualEntryText(u.email),
      role: coerceManualEntryText(u.role),
    },
    query,
  );
}

export function filterMatrixEmployeesBySearch(
  employees: AttendanceGridEmployee[],
  query: unknown,
): AttendanceGridEmployee[] {
  const q = manualEntrySearchKey(query);
  if (!q) return employees;
  return employees.filter((e) =>
    matchesManualEntryUserSearch(
      { id: e.id, name: e.name, email: e.email ?? "" },
      query,
    ),
  );
}
