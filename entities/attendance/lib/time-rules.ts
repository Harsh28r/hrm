import type { AttendanceCellStatus } from "@/entities/attendance/model/grid";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import {
  minutesFromHm,
  minutesFromIsoInTz,
} from "@/entities/attendance/lib/time-parse";

export {
  minutesFromHm,
  minutesFromIso,
  minutesFromIsoInTz,
  parseHm,
  combineDateAndTimeToIso,
  toIstDate,
  IST_OFFSET_MS,
} from "@/entities/attendance/lib/time-parse";

function clockMinutes(iso: string, rules: AttendanceRules): number | null {
  return minutesFromIsoInTz(iso, rules.timezone ?? "Asia/Kolkata");
}

/**
 * Present until this minute (inclusive). Uses the later of lateAfter and expectedCheckIn
 * so a 10:24 punch is present when expected check-in is 10:30 even if lateAfter is 09:30.
 */
export function effectiveLateAfterMinutes(rules: AttendanceRules): number | null {
  const late = minutesFromHm(rules.lateAfter);
  const expected = minutesFromHm(rules.expectedCheckIn);
  if (late == null && expected == null) return null;
  if (late == null) return expected;
  if (expected == null) return late;
  return Math.max(late, expected);
}

/** Inclusive window [start, end] in minutes from midnight. */
export function isMinutesInWindow(
  minutes: number,
  startHm: string,
  endHm: string,
): boolean {
  const start = minutesFromHm(startHm);
  const end = minutesFromHm(endHm);
  if (start == null || end == null) return false;
  if (start <= end) return minutes >= start && minutes <= end;
  return minutes >= start || minutes <= end;
}

export function isCheckInInWindow(
  checkInIso: string,
  startHm: string,
  endHm: string,
  rules: AttendanceRules,
): boolean {
  const mins = clockMinutes(checkInIso, rules);
  if (mins == null) return false;
  return isMinutesInWindow(mins, startHm, endHm);
}

/**
 * Late = check-in after `lateAfter` but still within the first-half window.
 * Early check-in (before shift / before lateAfter) is never late.
 */
export function isLateCheckIn(checkInIso: string, rules: AttendanceRules): boolean {
  const checkInMins = clockMinutes(checkInIso, rules);
  const lateMins = effectiveLateAfterMinutes(rules);
  const firstEnd = minutesFromHm(rules.firstHalfEnd);
  if (checkInMins == null || lateMins == null || firstEnd == null) return false;
  if (checkInMins <= lateMins) return false;
  return checkInMins <= firstEnd;
}

export function isWeekOffDay(year: number, month: number, dayOfMonth: number, weekOffDays: number[]): boolean {
  const d = new Date(year, month, dayOfMonth);
  return weekOffDays.includes(d.getDay());
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function weekdayShort(year: number, month: number, dayOfMonth: number): string {
  return WEEKDAY_SHORT[new Date(year, month, dayOfMonth).getDay()] ?? "";
}

export function formatWeekOffDays(weekOffDays: number[]): string {
  return weekOffDays.map((d) => WEEKDAY_SHORT[d] ?? String(d)).join(", ") || "—";
}

/**
 * Status from check-in time only (check-out time does not downgrade present).
 * Uses company timezone from rules (default Asia/Kolkata).
 */
export function statusFromCheckInTime(
  checkInIso: string,
  rules: AttendanceRules,
): AttendanceCellStatus {
  const checkInMins = clockMinutes(checkInIso, rules);
  if (checkInMins == null) return "half_day";

  const onTimeUntil = effectiveLateAfterMinutes(rules);
  const expectedIn = minutesFromHm(rules.expectedCheckIn);
  const firstStart = minutesFromHm(rules.firstHalfStart);
  const firstEnd = minutesFromHm(rules.firstHalfEnd);

  // Early / on-time — always present (not gated by firstHalfEnd).
  if (firstStart != null && checkInMins < firstStart) return "present";
  if (expectedIn != null && checkInMins <= expectedIn) return "present";
  if (onTimeUntil != null && checkInMins <= onTimeUntil) return "present";

  const inFirstHalf =
    firstEnd != null &&
    (firstStart == null || (checkInMins >= firstStart && checkInMins <= firstEnd));

  if (inFirstHalf) {
    if (isLateCheckIn(checkInIso, rules)) return "late";
    return "present";
  }

  if (isCheckInInWindow(checkInIso, rules.secondHalfStart, rules.secondHalfEnd, rules)) {
    return "half_day";
  }

  return "half_day";
}

function workingHoursThreshold(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

/**
 * After checkout: present/late → half_day if hours < minimumWorkingHours.
 * halfDayMaxHours is the partial-day floor (must be ≤ minimumWorkingHours).
 * Late check-out clock alone does not downgrade when hours meet full-day minimum.
 */
export function applyWorkedHoursRules(
  status: AttendanceCellStatus,
  totalHours: number | null | undefined,
  rules: AttendanceRules,
): AttendanceCellStatus {
  if (status !== "present" && status !== "late") return status;

  const fullDayMin = workingHoursThreshold(rules.minimumWorkingHours);
  if (fullDayMin != null && (totalHours == null || Number.isNaN(Number(totalHours)))) {
    return "half_day";
  }
  if (totalHours == null || Number.isNaN(Number(totalHours))) return status;

  const hours = Number(totalHours);
  const halfDayMin = workingHoursThreshold(rules.halfDayMaxHours);

  if (fullDayMin != null && hours >= fullDayMin) return status;
  if (fullDayMin != null || halfDayMin != null) return "half_day";
  return status;
}

/** @deprecated Use applyWorkedHoursRules */
export const applyMinimumWorkingHours = applyWorkedHoursRules;
export const applyHalfDayMaxHours = applyWorkedHoursRules;

export function resolvePunchTotalHours(
  checkInIso: string | null | undefined,
  checkOutIso: string | null | undefined,
  storedTotalHours: number | null | undefined,
): number | null {
  if (storedTotalHours != null && !Number.isNaN(Number(storedTotalHours))) {
    return Number(storedTotalHours);
  }
  if (!checkInIso || !checkOutIso) return null;
  const a = new Date(checkInIso).getTime();
  const b = new Date(checkOutIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  return (b - a) / (1000 * 60 * 60);
}

/** Worked hours for rules: stored or in–out span, minus break minutes when provided. */
export function resolveWorkedHours(options: {
  checkInIso?: string | null;
  checkOutIso?: string | null;
  totalHours?: number | null;
  breakMinutes?: number | null;
}): number | null {
  const gross = resolvePunchTotalHours(
    options.checkInIso,
    options.checkOutIso,
    options.totalHours,
  );
  if (gross == null) return null;
  const breakMin = options.breakMinutes;
  if (breakMin != null && breakMin > 0) {
    return Math.max(0, gross - breakMin / 60);
  }
  return gross;
}

function requiresWorkedHoursGate(rules: AttendanceRules): boolean {
  return (
    workingHoursThreshold(rules.minimumWorkingHours) != null ||
    workingHoursThreshold(rules.halfDayMaxHours) != null
  );
}

/**
 * Full-day present/late also requires official shift bounds (when minimum hours are configured):
 * check-in not before expectedCheckIn, check-out not before expectedCheckOut.
 */
export function meetsExpectedShiftBounds(
  checkInIso: string,
  checkOutIso: string | null | undefined,
  rules: AttendanceRules,
): boolean {
  if (!checkOutIso) return false;
  const inMins = clockMinutes(checkInIso, rules);
  const outMins = clockMinutes(checkOutIso, rules);
  if (inMins == null || outMins == null) return false;

  const expectedIn = minutesFromHm(rules.expectedCheckIn);
  const expectedOut = minutesFromHm(rules.expectedCheckOut);
  if (expectedIn != null && inMins < expectedIn) return false;
  if (expectedOut != null && outMins < expectedOut) return false;
  return true;
}

function applyExpectedShiftBounds(
  status: AttendanceCellStatus,
  checkInIso: string,
  checkOutIso: string | null | undefined,
  rules: AttendanceRules,
): AttendanceCellStatus {
  if (status !== "present" && status !== "late") return status;
  if (workingHoursThreshold(rules.minimumWorkingHours) == null) return status;
  if (meetsExpectedShiftBounds(checkInIso, checkOutIso, rules)) return status;
  return "half_day";
}

/** Check-in windows + worked-hours gate only after check-out. */
export function statusFromPunch(
  checkInIso: string,
  rules: AttendanceRules,
  options?: {
    checkOutIso?: string | null;
    totalHours?: number | null;
    breakMinutes?: number | null;
  },
): AttendanceCellStatus {
  const base = statusFromCheckInTime(checkInIso, rules);
  const hasCheckout = Boolean(options?.checkOutIso);
  const gate = requiresWorkedHoursGate(rules);

  // Present/late need a completed session when minimum (or half-day) hours are configured.
  if (gate && !hasCheckout) {
    if (base === "present" || base === "late") return "half_day";
    return base;
  }

  if (!hasCheckout && options?.totalHours == null) {
    return base;
  }

  const hours = resolveWorkedHours({
    checkInIso,
    checkOutIso: options?.checkOutIso,
    totalHours: options?.totalHours,
    breakMinutes: options?.breakMinutes,
  });
  const afterHours = applyWorkedHoursRules(base, hours, rules);
  return applyExpectedShiftBounds(afterHours, checkInIso, options?.checkOutIso, rules);
}

/** Map grid/cell status to API day-summary dayType. */
export function dayTypeFromCheckInTime(
  checkInIso: string,
  rules: AttendanceRules,
  options?: { checkOutIso?: string | null; totalHours?: number | null },
): "present" | "late" | "half_day" {
  const status = statusFromPunch(checkInIso, rules, options);
  if (status === "late") return "late";
  if (status === "half_day") return "half_day";
  return "present";
}
