/** India Standard Time offset (matches deltadb/services/hrm/istDate.js). */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function parseHm(hm: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function minutesFromHm(hm: string): number | null {
  const p = parseHm(hm);
  if (!p) return null;
  return p.hour * 60 + p.minute;
}

export function toIstDate(d: Date): Date {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MS);
}

/** Clock minutes from midnight in company timezone (default IST). */
export function minutesFromIsoInTz(iso: string, timezone = "Asia/Kolkata"): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ref = timezone === "Asia/Kolkata" ? toIstDate(d) : d;
  return ref.getHours() * 60 + ref.getMinutes();
}

/** @deprecated Prefer minutesFromIsoInTz with rules.timezone */
export function minutesFromIso(iso: string): number | null {
  return minutesFromIsoInTz(iso, "Asia/Kolkata");
}

/** Calendar day-of-month in company timezone (matches deltadb IST day keys). */
export function dayOfMonthInTz(iso: string, timezone = "Asia/Kolkata"): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const ref = timezone === "Asia/Kolkata" ? toIstDate(d) : d;
  return ref.getDate();
}

export function calendarPartsInTz(
  iso: string,
  timezone = "Asia/Kolkata",
): { year: number; month: number; day: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ref = timezone === "Asia/Kolkata" ? toIstDate(d) : d;
  return { year: ref.getFullYear(), month: ref.getMonth(), day: ref.getDate() };
}

export function isSameGridDayInTz(
  iso: string,
  year: number,
  month: number,
  dayOfMonth: number,
  timezone = "Asia/Kolkata",
): boolean {
  const p = calendarPartsInTz(iso, timezone);
  if (!p) return false;
  return p.year === year && p.month === month && p.day === dayOfMonth;
}

/** Build UTC ISO for calendar date + HH:mm in company timezone. */
export function combineDateAndTimeToIso(
  dateYmd: string,
  timeHm: string,
  timezone = "Asia/Kolkata",
): string | null {
  const hm = parseHm(timeHm);
  if (!hm) return null;
  const parts = dateYmd.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;

  if (timezone === "Asia/Kolkata") {
    const utcMs = Date.UTC(y, m - 1, d, hm.hour, hm.minute) - IST_OFFSET_MS;
    return new Date(utcMs).toISOString();
  }

  const local = new Date(`${dateYmd}T${timeHm}`);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}
