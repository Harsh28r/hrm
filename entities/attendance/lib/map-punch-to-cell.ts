import type { AttendanceCellStatus } from "@/entities/attendance/model/grid";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import { calendarPartsInTz } from "@/entities/attendance/lib/time-parse";
import {
  minutesFromHm,
  minutesFromIsoInTz,
  resolveWorkedHours,
  statusFromCheckInTime,
  statusFromPunch,
} from "@/entities/attendance/lib/time-rules";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";

export type DayPunch = {
  userId: string;
  dayOfMonth: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  totalBreakMinutes: number | null;
  isManualEntry: boolean;
  recordStatus: AttendanceAdminRecord["status"];
};

/** Grid icon: HR `isManualEntry` punches always use manual icon (not app punch icons). */
export function gridCellIconForPunch(
  resolved: AttendanceCellStatus,
  punch: DayPunch | undefined,
): AttendanceCellStatus {
  if (resolved === "on_leave") return "on_leave";
  if (punch?.isManualEntry && punch.checkInTime) return "manual_present";
  return resolved;
}

function formatClockInTz(iso: string, timezone: string): string {
  const mins = minutesFromIsoInTz(iso, timezone);
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Human-readable day status from saved attendance rules + punch times (all values dynamic). */
export function ruleDayLabelFromPunch(
  punch: DayPunch,
  rules: AttendanceRules,
  status: AttendanceCellStatus | null,
  checkInOnly: AttendanceCellStatus | null,
): string {
  if (!status) return "";
  const tz = rules.timezone ?? "Asia/Kolkata";
  const minH = rules.minimumWorkingHours;
  const shiftRule = `shift in ${rules.expectedCheckIn}–${rules.expectedCheckOut}, min ${minH}h`;

  if (status === "present") {
    return `Full day (present · ${shiftRule})`;
  }
  if (status === "late") {
    return `Full day (late after ${rules.lateAfter} · ${shiftRule})`;
  }
  if (status === "checked_in") {
    return `Open session (needs check-out · min ${minH}h, out from ${rules.expectedCheckOut})`;
  }
  if (status === "half_day") {
    const reasons = halfDayReasonsFromRules(punch, rules, checkInOnly);
    return reasons.length
      ? `Half day (${reasons.join("; ")})`
      : `Half day (${shiftRule})`;
  }
  return status.replace(/_/g, " ");
}

function halfDayReasonsFromRules(
  punch: DayPunch,
  rules: AttendanceRules,
  checkInOnly: AttendanceCellStatus | null,
): string[] {
  const tz = rules.timezone ?? "Asia/Kolkata";
  const reasons: string[] = [];

  if (checkInOnly === "half_day") {
    reasons.push(
      `check-in only in second half (${rules.secondHalfStart}–${rules.secondHalfEnd})`,
    );
    return reasons;
  }

  const hours = resolveWorkedHours({
    checkInIso: punch.checkInTime,
    checkOutIso: punch.checkOutTime,
    totalHours: punch.totalHours,
    breakMinutes: punch.totalBreakMinutes,
  });
  const minH = rules.minimumWorkingHours;

  if (minH > 0) {
    if (!punch.checkOutTime) {
      reasons.push(`no check-out (rules require ≥${minH}h)`);
    } else if (hours == null) {
      reasons.push(`hours unknown (rules require ≥${minH}h)`);
    } else if (hours < minH) {
      reasons.push(`${hours.toFixed(1)}h worked < ${minH}h minimum`);
    }
  }

  if (punch.checkInTime && punch.checkOutTime) {
    const inMins = minutesFromIsoInTz(punch.checkInTime, tz);
    const outMins = minutesFromIsoInTz(punch.checkOutTime, tz);
    const expectedIn = minutesFromHm(rules.expectedCheckIn);
    const expectedOut = minutesFromHm(rules.expectedCheckOut);
    if (expectedIn != null && inMins != null && inMins < expectedIn) {
      reasons.push(
        `check-in ${formatClockInTz(punch.checkInTime, tz)} before shift start ${rules.expectedCheckIn}`,
      );
    }
    if (expectedOut != null && outMins != null && outMins < expectedOut) {
      reasons.push(
        `check-out ${formatClockInTz(punch.checkOutTime, tz)} before shift end ${rules.expectedCheckOut}`,
      );
    }
  }

  return reasons;
}

export function punchUserId(record: AttendanceAdminRecord): string | null {
  const u = record.user;
  if (!u) return null;
  if (typeof u === "string") return u;
  const raw = u._id ?? (u as { id?: string }).id;
  return raw ? String(raw) : null;
}

/** IST calendar day for a punch — check-in time first (matches daily log), then work `date`. */
export function recordGridDayParts(
  att: AttendanceAdminRecord,
  timezone: string,
  grid?: { year: number; month: number },
): { year: number; month: number; day: number } | null {
  const candidates: string[] = [];
  if (att.checkIn?.time) candidates.push(att.checkIn.time);
  if (att.date) candidates.push(att.date);

  for (const iso of candidates) {
    const parts = calendarPartsInTz(iso, timezone);
    if (!parts?.day) continue;
    if (grid && (parts.year !== grid.year || parts.month !== grid.month)) continue;
    return parts;
  }
  return null;
}

/** @deprecated Use calendarPartsInTz / dayOfMonthInTz with rules.timezone */
export function dayOfMonthLocal(iso: string): number {
  const p = calendarPartsInTz(iso, "Asia/Kolkata");
  return p?.day ?? 0;
}

export function indexPunchesByUserDay(
  records: AttendanceAdminRecord[],
  grid?: { year: number; month: number; timezone?: string },
): Map<string, DayPunch> {
  const tz = grid?.timezone ?? "Asia/Kolkata";
  const map = new Map<string, DayPunch>();
  for (const att of records) {
    const userId = punchUserId(att);
    if (!userId) continue;
    const parts = recordGridDayParts(att, tz, grid);
    if (!parts) continue;
    const day = parts.day;
    const key = `${userId}|${day}`;
    const checkInTime = att.checkIn?.time ?? null;
    const checkOutTime = att.checkOut?.time ?? null;
    let totalHours: number | null = null;
    if (att.totalHours != null && !Number.isNaN(Number(att.totalHours))) {
      totalHours = Number(att.totalHours);
    } else if (checkInTime && checkOutTime) {
      totalHours =
        (new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) /
        (1000 * 60 * 60);
    }
    let totalBreakMinutes: number | null = null;
    if (att.totalBreakTime != null && !Number.isNaN(Number(att.totalBreakTime))) {
      totalBreakMinutes = Number(att.totalBreakTime);
    }

    map.set(key, {
      userId,
      dayOfMonth: day,
      checkInTime,
      checkOutTime,
      totalHours: totalHours != null && !Number.isNaN(totalHours) ? totalHours : null,
      totalBreakMinutes,
      isManualEntry: Boolean(att.isManualEntry),
      recordStatus: att.status,
    });
  }
  return map;
}

export function isActiveCheckIn(punch: DayPunch): boolean {
  return punch.recordStatus === "checked-in" && Boolean(punch.checkInTime) && !punch.checkOutTime;
}

export function cellStatusFromPunch(
  punch: DayPunch,
  rules: AttendanceRules,
): AttendanceCellStatus | null {
  if (punch.recordStatus === "on-leave") return "on_leave";
  if (!punch.checkInTime) return null;
  if (isActiveCheckIn(punch)) return "checked_in";
  return statusFromPunch(punch.checkInTime, rules, {
    checkOutIso: punch.checkOutTime,
    totalHours: punch.totalHours,
    breakMinutes: punch.totalBreakMinutes,
  });
}

export function punchCellTitle(punch: DayPunch, rules?: AttendanceRules): string | undefined {
  if (!punch.checkInTime || !rules) return undefined;
  const tz = rules.timezone ?? "Asia/Kolkata";
  const inT = formatClockInTz(punch.checkInTime, tz);
  const status = statusFromPunch(punch.checkInTime, rules, {
    checkOutIso: punch.checkOutTime,
    totalHours: punch.totalHours,
    breakMinutes: punch.totalBreakMinutes,
  });
  const checkInOnly = statusFromCheckInTime(punch.checkInTime, rules);
  const dayLabel = ruleDayLabelFromPunch(punch, rules, status, checkInOnly);

  if (punch.isManualEntry) {
    const prefix = `Manual entry · ${dayLabel}`;
    if (isActiveCheckIn(punch)) {
      return `${prefix} · Check-in ${inT} · Awaiting check-out`;
    }
    if (punch.checkOutTime) {
      const outT = formatClockInTz(punch.checkOutTime, tz);
      const hrs =
        punch.totalHours != null ? ` · ${punch.totalHours.toFixed(1)}h worked` : "";
      return `${prefix} · Check-in ${inT} · Check-out ${outT}${hrs}`;
    }
    return `${prefix} · Check-in ${inT} · No check-out`;
  }

  const statusNote =
    status === "half_day" || status === "late"
      ? ` · ${dayLabel}`
      : status === "present"
        ? ` · ${dayLabel}`
        : "";
  if (isActiveCheckIn(punch)) {
    return `Checked in ${inT} · Awaiting check-out`;
  }
  if (punch.checkOutTime) {
    const outT = formatClockInTz(punch.checkOutTime, tz);
    const hrs =
      punch.totalHours != null ? ` · ${punch.totalHours.toFixed(1)}h` : "";
    return `Check-in ${inT} · Check-out ${outT}${hrs}${statusNote}`;
  }
  return `Check-in ${inT} · Not checked out yet${statusNote}`;
}
