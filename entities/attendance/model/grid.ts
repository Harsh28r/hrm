/** Cell status for monthly attendance matrix (matches legend). */
export type AttendanceCellStatus =
  | "checked_in"
  | "present"
  | "manual_present"
  | "absent"
  | "on_leave"
  | "holiday"
  | "weekoff"
  | "half_day"
  | "late"
  | "campoff_earned"
  | "campoff_used"
  | "empty"
  | "future";

export type AttendanceGridEmployee = {
  id: string;
  name: string;
  email?: string;
};

export type AttendanceGridRow = {
  employee: AttendanceGridEmployee;
  /** day of month (1–31) → status */
  cells: Record<number, AttendanceCellStatus>;
  /** Hover text from punch times / summary */
  cellTitles?: Record<number, string>;
  /** HR week off for this employee, e.g. "Sun" or "Sun, Sat" */
  weekOffLabel?: string;
};

export type AttendanceGridModel = {
  year: number;
  month: number; // 0-indexed
  daysInMonth: number;
  rows: AttendanceGridRow[];
};
