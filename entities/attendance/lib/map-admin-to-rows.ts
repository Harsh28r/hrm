import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import type { AttendanceRow, AttendanceRowStatus } from "@/entities/attendance/model/row";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import { buildAttendanceSelfieImageUrl } from "@/entities/attendance/lib/selfie-url";
import { statusFromPunch } from "@/entities/attendance/lib/time-rules";
import { minutesFromIsoInTz } from "@/entities/attendance/lib/time-parse";

function formatClockIst(iso: string | null | undefined, timezone: string): string | null {
  if (!iso) return null;
  const mins = minutesFromIsoInTz(iso, timezone);
  if (mins == null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatHoursFromTotal(total: number | null | undefined): string | null {
  if (total == null || total <= 0) return null;
  const hWhole = Math.floor(total);
  const m = Math.round((total - hWhole) * 60);
  return `${hWhole}h ${m}m`;
}

function hoursFromInOut(checkInIso?: string | null, checkOutIso?: string | null): string | null {
  if (!checkInIso || !checkOutIso) return null;
  const a = new Date(checkInIso).getTime();
  const b = new Date(checkOutIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatWorkDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function mapRecordStatus(status: AttendanceAdminRecord["status"]): AttendanceRowStatus {
  switch (status) {
    case "checked-in":
      return "checked_in";
    case "checked-out":
      return "checked_out";
    case "on-leave":
      return "on_leave";
    case "absent":
    default:
      return "absent";
  }
}

function resolveRowStatus(
  att: AttendanceAdminRecord,
  checkInIso: string | null,
  checkOutIso: string | null,
  rules: AttendanceRules,
): AttendanceRowStatus {
  if (att.status === "on-leave") return "on_leave";
  if (!checkInIso) return "absent";
  if (att.status === "checked-in" && !checkOutIso) {
    return "checked_in";
  }
  const breakMinutes =
    att.totalBreakTime != null && !Number.isNaN(Number(att.totalBreakTime))
      ? Number(att.totalBreakTime)
      : undefined;
  const dayStatus = statusFromPunch(checkInIso, rules, {
    checkOutIso,
    totalHours: att.totalHours ?? undefined,
    breakMinutes,
  });
  if (dayStatus === "late") return "late";
  if (dayStatus === "half_day") return "half_day";
  if (dayStatus === "present") return "present";
  return "absent";
}

export function mapAdminAttendanceToRows(
  records: AttendanceAdminRecord[],
  options: { includeWorkDate?: boolean; rules: AttendanceRules },
): AttendanceRow[] {
  const includeWorkDate = options.includeWorkDate ?? false;
  const tz = options.rules.timezone ?? "Asia/Kolkata";

  return records.map((att) => {
    const user = att.user;
    const name = user?.name?.trim() || user?.email || "Unknown user";
    const employeeId = user?._id ? String(user._id) : "—";
    const department = user?.role || user?.level || "—";

    const checkInIso = att.checkIn?.time ?? null;
    const checkOutIso =
      att.checkOut && typeof att.checkOut === "object" && "time" in att.checkOut
        ? (att.checkOut.time ?? null)
        : null;
    const checkIn = formatClockIst(checkInIso, tz);
    const checkOut = formatClockIst(checkOutIso, tz);
    const hours =
      formatHoursFromTotal(att.totalHours ?? undefined) ?? hoursFromInOut(checkInIso, checkOutIso);

    const checkOutSelfieRaw =
      att.checkOut && typeof att.checkOut === "object" && "selfie" in att.checkOut
        ? (att.checkOut as { selfie?: string | null }).selfie
        : null;

    const status = resolveRowStatus(att, checkInIso, checkOutIso, options.rules);

    return {
      id: String(att.id),
      name,
      employeeId,
      department,
      workDate: includeWorkDate ? formatWorkDate(att.date) : null,
      checkIn,
      checkOut,
      hours,
      status,
      checkInSelfieUrl: buildAttendanceSelfieImageUrl(att.checkIn?.selfie ?? null),
      checkOutSelfieUrl: buildAttendanceSelfieImageUrl(checkOutSelfieRaw ?? null),
    };
  });
}
