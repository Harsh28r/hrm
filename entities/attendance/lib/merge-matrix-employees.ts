import type { AttendanceGridEmployee } from "@/entities/attendance/model/grid";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import type { DaySummaryRow } from "@/entities/attendance/api/summary-queries";
import { punchUserId } from "@/entities/attendance/lib/map-punch-to-cell";
import {
  attendanceRecordMatchesMatrixSearch,
  filterMatrixEmployeesBySearch,
} from "@/entities/attendance/lib/matrix-search";
import {
  coerceManualEntryText,
  manualEntrySearchKey,
  type ManualEntryUser,
} from "@/entities/attendance/model/manual-entry";

/** Full company roster from permissions picker → matrix rows. */
export function gridEmployeesFromPicker(users: ManualEntryUser[]): AttendanceGridEmployee[] {
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));
}

function summaryUserId(row: DaySummaryRow): string | null {
  const u = row.user;
  if (!u) return null;
  if (typeof u === "string") return u;
  const raw = u._id ?? (u as { id?: string }).id;
  return raw ? String(raw) : null;
}

function employeeFromPunch(att: AttendanceAdminRecord): AttendanceGridEmployee | null {
  const id = punchUserId(att);
  if (!id) return null;
  const u = att.user;
  const name =
    (u && typeof u === "object" && coerceManualEntryText(u.name).trim()) ||
    (u && typeof u === "object" && coerceManualEntryText(u.email).trim()) ||
    `User ${id.slice(-6)}`;
  const email = u && typeof u === "object" ? coerceManualEntryText(u.email).trim() : undefined;
  return { id, name, email: email || undefined };
}

/** Build roster from month punches + day summaries (no full permissions dump). */
export function employeesFromAttendanceData(
  punches: AttendanceAdminRecord[],
  summaries: DaySummaryRow[],
): AttendanceGridEmployee[] {
  const byId = new Map<string, AttendanceGridEmployee>();

  for (const att of punches) {
    const row = employeeFromPunch(att);
    if (row) byId.set(row.id, row);
  }

  for (const s of summaries) {
    const id = summaryUserId(s);
    if (!id || byId.has(id)) continue;
    const u = s.user;
    const name =
      (typeof u === "object" && coerceManualEntryText(u.name).trim()) ||
      (typeof u === "object" && coerceManualEntryText(u.email).trim()) ||
      `User ${id.slice(-6)}`;
    const email = typeof u === "object" ? coerceManualEntryText(u.email).trim() : undefined;
    byId.set(id, { id, name, email: email || undefined });
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

/** Include punch-only users; optional search narrows the roster. */
export function mergeMatrixEmployees(
  employees: AttendanceGridEmployee[],
  punches: AttendanceAdminRecord[],
  search?: string,
): AttendanceGridEmployee[] {
  const q = manualEntrySearchKey(search);
  const byId = new Map(employees.map((e) => [e.id, e]));

  for (const att of punches) {
    const row = employeeFromPunch(att);
    if (!row || byId.has(row.id)) continue;
    if (q && !attendanceRecordMatchesMatrixSearch(att, search)) continue;
    byId.set(row.id, row);
  }

  const merged = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  return q ? filterMatrixEmployeesBySearch(merged, search) : merged;
}
