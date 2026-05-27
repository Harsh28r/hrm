export type AttendanceRules = {
  expectedCheckIn: string;
  expectedCheckOut: string;
  lateAfter: string;
  firstHalfStart: string;
  firstHalfEnd: string;
  secondHalfStart: string;
  secondHalfEnd: string;
  absentAfterCheckIn: string;
  halfDayCheckoutBefore: string;
  halfDayMaxHours: number;
  minimumWorkingHours: number;
  weekOffDays: number[];
  attendanceWeekStartDay: number;
  timezone?: string;
};

export const DELTA_ATTENDANCE_PRESET: AttendanceRules = {
  expectedCheckIn: "10:15",
  expectedCheckOut: "19:30",
  lateAfter: "10:30",
  firstHalfStart: "10:15",
  firstHalfEnd: "12:00",
  secondHalfStart: "12:01",
  secondHalfEnd: "14:00",
  absentAfterCheckIn: "14:01",
  halfDayCheckoutBefore: "15:00",
  halfDayMaxHours: 4,
  minimumWorkingHours: 9,
  weekOffDays: [0],
  attendanceWeekStartDay: 1,
  timezone: "Asia/Kolkata",
};

export const DEFAULT_ATTENDANCE_RULES: AttendanceRules = { ...DELTA_ATTENDANCE_PRESET };

function pickWorkingHours(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(24, Math.round(n * 100) / 100);
}

function pickTime(value: string | undefined, fallback: string): string {
  return value && /^\d{1,2}:\d{2}$/.test(value.trim()) ? value.trim() : fallback;
}

function pickWeekStart(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 6) return fallback;
  return Math.floor(n);
}

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
  "absentAfterCheckIn",
  "halfDayCheckoutBefore",
] as const;

export function normalizeAttendanceRules(
  raw: Partial<AttendanceRules> | null | undefined,
): AttendanceRules {
  if (!raw) {
    throw new AttendanceRulesError("Attendance rules are missing from the server.");
  }

  const base = DELTA_ATTENDANCE_PRESET;
  const expectedCheckIn = pickTime(raw.expectedCheckIn, "");
  const expectedCheckOut = pickTime(raw.expectedCheckOut, "");
  const lateAfter = pickTime(raw.lateAfter, "");
  const firstHalfStart = pickTime(raw.firstHalfStart, raw.expectedCheckIn ?? "");
  const firstHalfEnd = pickTime(raw.firstHalfEnd, "");
  const secondHalfStart = pickTime(raw.secondHalfStart, "");
  const secondHalfEnd = pickTime(raw.secondHalfEnd, "");
  const absentAfterCheckIn = pickTime(raw.absentAfterCheckIn, "");
  const halfDayCheckoutBefore = pickTime(raw.halfDayCheckoutBefore, "");

  const times: Record<string, string> = {
    expectedCheckIn,
    expectedCheckOut,
    lateAfter,
    firstHalfStart,
    firstHalfEnd,
    secondHalfStart,
    secondHalfEnd,
    absentAfterCheckIn,
    halfDayCheckoutBefore,
  };

  for (const key of TIME_FIELDS) {
    if (!times[key]) {
      throw new AttendanceRulesError(
        `Attendance rules are incomplete: missing ${key}. Save rules in HR settings.`,
      );
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
    absentAfterCheckIn,
    halfDayCheckoutBefore,
    halfDayMaxHours: pickWorkingHours(raw.halfDayMaxHours, base.halfDayMaxHours),
    minimumWorkingHours: pickWorkingHours(
      raw.minimumWorkingHours,
      base.minimumWorkingHours,
    ),
    weekOffDays: normalizeWeekOffDaysFromApi(raw.weekOffDays, [0]),
    attendanceWeekStartDay: pickWeekStart(raw.attendanceWeekStartDay, base.attendanceWeekStartDay),
    timezone: raw.timezone?.trim() || "Asia/Kolkata",
  };
}

export function validateAttendanceRulesOrder(rules: AttendanceRules): string | null {
  const toMins = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    return h * 60 + m;
  };
  if (toMins(rules.lateAfter) < toMins(rules.expectedCheckIn)) {
    return "Late-after must be at or after expected check-in.";
  }
  if (toMins(rules.absentAfterCheckIn) <= toMins(rules.secondHalfEnd)) {
    return "Absent-after must be after second-half end.";
  }
  return null;
}
