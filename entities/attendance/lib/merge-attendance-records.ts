import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import { punchUserId } from "@/entities/attendance/lib/map-punch-to-cell";

/** Dedupe attendance rows (same API as daily log) for matrix punch indexing. */
export function mergeAttendanceRecords(
  ...lists: AttendanceAdminRecord[][]
): AttendanceAdminRecord[] {
  const byKey = new Map<string, AttendanceAdminRecord>();
  for (const list of lists) {
    for (const att of list) {
      const id = att.id ?? (att as AttendanceAdminRecord & { _id?: string })._id;
      const key = id
        ? String(id)
        : `${punchUserId(att) ?? "?"}|${att.date ?? att.checkIn?.time ?? ""}`;
      byKey.set(key, att);
    }
  }
  return [...byKey.values()];
}
