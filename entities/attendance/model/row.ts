export type AttendanceRowStatus =
  | "present"
  | "late"
  | "half_day"
  | "absent"
  | "leave"
  | "remote"
  | "checked_in"
  | "checked_out"
  | "on_leave";

export type AttendanceRow = {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  /** Set for multi-day queries (short local date). */
  workDate: string | null;
  checkIn: string | null;
  checkOut: string | null;
  hours: string | null;
  status: AttendanceRowStatus;
  /** Resolved image URLs for punch selfies (null if none / API not configured). */
  checkInSelfieUrl: string | null;
  checkOutSelfieUrl: string | null;
};
