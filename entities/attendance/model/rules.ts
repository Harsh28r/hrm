export type AttendanceRules = {
  expectedCheckIn: string;
  expectedCheckOut: string;
  lateAfter: string;
  firstHalfStart: string;
  firstHalfEnd: string;
  secondHalfStart: string;
  secondHalfEnd: string;
  /** Min worked hours to count as half day when below full-day minimum */
  halfDayMaxHours: number;
  /** Min worked hours (check-in→check-out) for full day present/late */
  minimumWorkingHours: number;
  weekOffDays: number[];
  timezone?: string;
};

export const DEFAULT_ATTENDANCE_RULES: AttendanceRules = {
  expectedCheckIn: "09:00",
  expectedCheckOut: "18:00",
  lateAfter: "09:30",
  firstHalfStart: "09:00",
  firstHalfEnd: "13:00",
  secondHalfStart: "14:00",
  secondHalfEnd: "18:00",
  halfDayMaxHours: 4,
  minimumWorkingHours: 9,
  weekOffDays: [0],
  timezone: "Asia/Kolkata",
};

function pickWorkingHours(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(24, Math.round(n * 100) / 100);
}

function pickTime(
  value: string | undefined,
  fallback: string,
): string {
  return value && /^\d{1,2}:\d{2}$/.test(value.trim()) ? value.trim() : fallback;
}

/** Legacy API/DB stored [0, 6]; company policy is Sunday-only unless HR picks more. */
export function normalizeWeekOffDaysFromApi(
  days: number[] | undefined,
  fallback: number[],
): number[] {
  if (!Array.isArray(days) || days.length === 0) return [...fallback];
  const sorted = [...new Set(days.filter((d) => d >= 0 && d <= 6))].sort((a, b) => a - b);
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) return [0];
  return sorted;
}

export class AttendanceRulesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceRulesError";
  }
}

const TIME_FIELDS = [
  "expectedCheckIn",
  "expectedCheckOut",
  "lateAfter",
  "firstHalfStart",
  "firstHalfEnd",
  "secondHalfStart",
  "secondHalfEnd",
] as const;

/** Map API/DB payload to rules — no silent fallback to DEFAULT_ATTENDANCE_RULES. */
export function normalizeAttendanceRules(
  raw: Partial<AttendanceRules> | null | undefined,
): AttendanceRules {
  if (!raw) {
    throw new AttendanceRulesError("Attendance rules are missing from the server.");
  }

  const expectedCheckIn = pickTime(raw.expectedCheckIn, "");
  const expectedCheckOut = pickTime(raw.expectedCheckOut, "");
  const lateAfter = pickTime(raw.lateAfter, "");
  const firstHalfStart = pickTime(raw.firstHalfStart, raw.expectedCheckIn ?? "");
  const firstHalfEnd = pickTime(raw.firstHalfEnd, "");
  const secondHalfStart = pickTime(raw.secondHalfStart, "");
  const secondHalfEnd = pickTime(raw.secondHalfEnd, raw.expectedCheckOut ?? "");

  const times: Record<string, string> = {
    expectedCheckIn,
    expectedCheckOut,
    lateAfter,
    firstHalfStart,
    firstHalfEnd,
    secondHalfStart,
    secondHalfEnd,
  };

  for (const key of TIME_FIELDS) {
    if (!times[key]) {
      throw new AttendanceRulesError(`Attendance rules are incomplete: missing ${key}. Save rules in HR settings.`);
    }
  }

  return {
    expectedCheckIn,
    expectedCheckOut,
    lateAfter,
    firstHalfStart,
    firstHalfEnd,
    secondHalfStart,
    secondHalfEnd,
    halfDayMaxHours: pickWorkingHours(raw.halfDayMaxHours, DEFAULT_ATTENDANCE_RULES.halfDayMaxHours),
    minimumWorkingHours: pickWorkingHours(
      raw.minimumWorkingHours,
      DEFAULT_ATTENDANCE_RULES.minimumWorkingHours,
    ),
    weekOffDays: normalizeWeekOffDaysFromApi(raw.weekOffDays, [0]),
    timezone: raw.timezone?.trim() || "Asia/Kolkata",
  };
}
