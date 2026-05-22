import type { DaySummaryRow } from "@/entities/attendance/api/summary-queries";
import type {
  AttendanceGridEmployee,
  AttendanceGridModel,
  AttendanceGridRow,
  AttendanceCellStatus,
} from "@/entities/attendance/model/grid";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import { calendarPartsInTz } from "@/entities/attendance/lib/time-parse";
import { mapDayTypeToCell } from "@/entities/attendance/lib/map-day-type";
import { formatWeekOffDays, isWeekOffDay } from "@/entities/attendance/lib/time-rules";
import {
  gridCellIconForPunch,
  cellStatusFromPunch,
  indexPunchesByUserDay,
  isActiveCheckIn,
  punchCellTitle,
  punchUserId,
  type DayPunch,
} from "@/entities/attendance/lib/map-punch-to-cell";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import type { CampOffMatrixUser } from "@/entities/attendance/api/campoff-queries";
import { applyCampOffToGridRow } from "@/entities/attendance/lib/apply-campoff-grid";
import {
  indexApprovedLeaveDaysForMonth,
  type ApprovedLeaveSpan,
} from "@/entities/attendance/lib/merge-approved-leave-days";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function summaryUserId(row: DaySummaryRow): string | null {
  const u = row.user;
  if (!u) return null;
  if (typeof u === "string") return u;
  const raw = u._id ?? (u as { id?: string }).id;
  return raw ? String(raw) : null;
}

function isSummaryOnlyStatus(status: AttendanceCellStatus): boolean {
  return ["weekoff", "on_leave", "absent", "campoff_earned", "campoff_used"].includes(status);
}

function employeeWeekOffDays(
  employeeId: string,
  campOffByUser: Record<string, CampOffMatrixUser> | undefined,
  rules: AttendanceRules,
): number[] {
  return campOffByUser?.[employeeId]?.weekOffDays ?? rules.weekOffDays;
}

function resolveCellStatus(
  punch: DayPunch | undefined,
  summaryStatus: AttendanceCellStatus | undefined,
  rules: AttendanceRules,
  year: number,
  month: number,
  day: number,
  weekOffDays: number[],
): { status?: AttendanceCellStatus; title?: string } {
  const scheduledOff =
    summaryStatus === "weekoff" || isWeekOffDay(year, month, day, weekOffDays);
  const publicHoliday = summaryStatus === "holiday";
  const fromPunch = punch ? cellStatusFromPunch(punch, rules) : null;

  if (summaryStatus === "campoff_used") {
    return { status: "campoff_used" };
  }
  if (summaryStatus === "campoff_earned") {
    if (scheduledOff) {
      return {
        status: "campoff_earned",
        title: `Worked on week off (${formatWeekOffDays(weekOffDays)}) — camp-off earned`,
      };
    }
    if (fromPunch) return { status: fromPunch };
    if (punch && isActiveCheckIn(punch)) return { status: "checked_in" };
    if (punch?.checkInTime) return { status: cellStatusFromPunch(punch, rules) ?? "present" };
    return { status: "absent" };
  }
  if (summaryStatus === "on_leave") {
    return { status: "on_leave" };
  }

  if (scheduledOff) {
    if (fromPunch || punch?.checkInTime) {
      return {
        status: "campoff_earned",
        title: `Worked on week off (${formatWeekOffDays(weekOffDays)}) — camp-off earned`,
      };
    }
    return { status: "weekoff", title: `Week off (${formatWeekOffDays(weekOffDays)})` };
  }

  // Public holiday on a working day: punch = present/late/half; else absent (not a blanket holiday icon).
  if (publicHoliday) {
    if (fromPunch) return { status: fromPunch };
    if (punch && isActiveCheckIn(punch)) return { status: "checked_in" };
    if (punch?.checkInTime) return { status: cellStatusFromPunch(punch, rules) ?? "present" };
    return {
      status: "absent",
      title: "Absent — public holiday, no check-in",
    };
  }

  // Work status always from punch check-in (same as daily log) — never summary half_day/present/late.
  if (punch?.checkInTime) {
    const work = cellStatusFromPunch(punch, rules);
    if (work) return { status: work };
    return { status: "present" };
  }
  if (punch && isActiveCheckIn(punch)) return { status: "checked_in" };
  if (summaryStatus && isSummaryOnlyStatus(summaryStatus)) {
    return { status: summaryStatus };
  }
  if (summaryStatus === "absent") return { status: "absent" };
  if (summaryStatus === "present" || summaryStatus === "late" || summaryStatus === "half_day") {
    return {
      status: "absent",
      title: "Absent — no check-in on record",
    };
  }
  if (summaryStatus) return { status: summaryStatus };
  return {};
}

export function buildAttendanceGrid(params: {
  year: number;
  month: number;
  employees: AttendanceGridEmployee[];
  summaries: DaySummaryRow[];
  punches?: AttendanceAdminRecord[];
  rules: AttendanceRules;
  campOffByUser?: Record<string, CampOffMatrixUser>;
  approvedLeaves?: ApprovedLeaveSpan[];
  today?: Date;
}): AttendanceGridModel {
  const rules = params.rules;
  const tz = rules.timezone ?? "Asia/Kolkata";
  const { year, month, employees, summaries, punches = [] } = params;
  const today = params.today ?? new Date();
  const dim = daysInMonth(year, month);
  const todayParts = calendarPartsInTz(today.toISOString(), tz);
  const isCurrentMonth =
    todayParts?.year === year && todayParts?.month === month;
  const todayDom = todayParts?.day ?? today.getDate();

  const byUserDaySummary = new Map<string, AttendanceCellStatus>();
  for (const s of summaries) {
    const uid = summaryUserId(s);
    if (!uid) continue;
    const parts = calendarPartsInTz(s.date, tz);
    if (!parts || parts.year !== year || parts.month !== month) continue;
    const dom = parts.day;
    if (dom < 1 || dom > dim) continue;
    const weekOffDaysDefault = params.rules.weekOffDays;
    const weekOffForUser =
      params.campOffByUser?.[uid]?.weekOffDays ?? weekOffDaysDefault;
    let cell = mapDayTypeToCell(s.dayType);
    if (
      s.dayType === "campoff_work" &&
      !isWeekOffDay(year, month, dom, weekOffForUser)
    ) {
      cell = "present";
    }
    byUserDaySummary.set(`${uid}|${dom}`, cell);
  }

  const approvedLeaveDays = indexApprovedLeaveDaysForMonth(
    params.approvedLeaves ?? [],
    year,
    month,
    tz,
  );
  for (const [key] of approvedLeaveDays) {
    byUserDaySummary.set(key, "on_leave");
  }

  const byUserDayPunch = indexPunchesByUserDay(punches, { year, month, timezone: tz });

  const allEmployees = [...employees].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  const rows: AttendanceGridRow[] = allEmployees.map((employee) => {
    const weekOffDays = employeeWeekOffDays(employee.id, params.campOffByUser, rules);
    const cells: Record<number, AttendanceCellStatus> = {};
    const cellTitles: Record<number, string> = {};
    for (let day = 1; day <= dim; day++) {
      const key = `${employee.id}|${day}`;
      const punch = byUserDayPunch.get(key);
      const summaryCell = byUserDaySummary.get(key);
      const { status: resolved, title: resolvedTitle } = resolveCellStatus(
        punch,
        summaryCell,
        rules,
        year,
        month,
        day,
        weekOffDays,
      );

      const leaveMeta = approvedLeaveDays.get(key);
      if (resolved === "on_leave" || leaveMeta) {
        cellTitles[day] = leaveMeta?.title ?? resolvedTitle ?? "On leave (approved)";
      } else if (punch) {
        const title = punchCellTitle(punch, rules);
        if (title) cellTitles[day] = title;
      } else if (resolvedTitle) {
        cellTitles[day] = resolvedTitle;
      } else if (summaryCell && summaryCell !== "holiday") {
        cellTitles[day] = summaryCell.charAt(0).toUpperCase() + summaryCell.slice(1).replace(/_/g, " ");
      }

      if (resolved) {
        cells[day] = gridCellIconForPunch(resolved, punch);
        continue;
      }
      if (isCurrentMonth && day > todayDom) {
        cells[day] = "future";
      } else if (isWeekOffDay(year, month, day, weekOffDays)) {
        cells[day] = "weekoff";
        cellTitles[day] = `Week off (${formatWeekOffDays(weekOffDays)})`;
      } else if (summaryCell === "holiday") {
        cells[day] = "absent";
        cellTitles[day] = "Absent — public holiday, no check-in";
      } else if (
        summaryCell &&
        !["present", "late", "half_day", "manual_present"].includes(summaryCell)
      ) {
        cells[day] = summaryCell;
      } else {
        cells[day] = "absent";
        cellTitles[day] = "Absent — no check-in";
      }
    }
    const campOff = params.campOffByUser?.[employee.id];
    return applyCampOffToGridRow(
      {
        employee,
        cells,
        cellTitles: Object.keys(cellTitles).length ? cellTitles : undefined,
        weekOffLabel: formatWeekOffDays(weekOffDays),
      },
      year,
      month,
      dim,
      campOff,
    );
  });

  return { year, month, daysInMonth: dim, rows };
}

export function endOfLocalMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}
