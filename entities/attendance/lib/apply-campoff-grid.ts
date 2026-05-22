import type { CampOffMatrixUser } from "@/entities/attendance/api/campoff-queries";
import type { AttendanceCellStatus, AttendanceGridRow } from "@/entities/attendance/model/grid";
import { formatWeekOffDays, isWeekOffDay } from "@/entities/attendance/lib/time-rules";

const WORK_STATUSES: AttendanceCellStatus[] = ["present", "late", "half_day", "manual_present"];

/** Camp-off: earn on scheduled week-off work; use only on approved camp-off leave days. */
export function applyCampOffToGridRow(
  row: AttendanceGridRow,
  year: number,
  month: number,
  daysInMonth: number,
  campOff: CampOffMatrixUser | undefined,
): AttendanceGridRow {
  const weekOffDays = campOff?.weekOffDays ?? [0];
  const cells = { ...row.cells };
  const cellTitles = { ...(row.cellTitles ?? {}) };
  const creditedSet = new Set(campOff?.creditedDays ?? []);
  const leaveSet = new Set(campOff?.leaveDays ?? []);
  const offLabel = formatWeekOffDays(weekOffDays);

  for (let day = 1; day <= daysInMonth; day++) {
    const status = cells[day];
    if (!status || status === "future") continue;

    const scheduledOff = isWeekOffDay(year, month, day, weekOffDays) || status === "weekoff";
    const workedOnScheduledOff =
      scheduledOff &&
      (WORK_STATUSES.includes(status) || status === "campoff_earned" || creditedSet.has(day));

    if (workedOnScheduledOff || (scheduledOff && status === "campoff_earned")) {
      const credited = creditedSet.has(day);
      const campNote = credited
        ? `Worked on week off (${offLabel}) — camp-off +1`
        : `Worked on week off (${offLabel}) — camp-off earned`;
      if (status === "manual_present") {
        const prev = cellTitles[day];
        cellTitles[day] = prev ? `${prev} · ${campNote}` : campNote;
        continue;
      }
      cells[day] = "campoff_earned";
      cellTitles[day] = campNote;
      continue;
    }

    if (leaveSet.has(day)) {
      cells[day] = "campoff_used";
      cellTitles[day] = "Camp-off leave (approved)";
      continue;
    }
  }

  return {
    ...row,
    cells,
    cellTitles: Object.keys(cellTitles).length ? cellTitles : undefined,
  };
}
