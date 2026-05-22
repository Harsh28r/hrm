import type { AttendanceCellStatus } from "@/entities/attendance/model/grid";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import { isLateCheckIn } from "@/entities/attendance/lib/time-rules";

export function mapDayTypeToCell(dayType: string): AttendanceCellStatus {
  switch (dayType) {
    case "present":
      return "present";
    case "late":
      return "late";
    case "absent":
      return "absent";
    case "on_leave":
      return "on_leave";
    case "holiday":
      return "holiday";
    case "weekoff":
      return "weekoff";
    case "half_day":
      return "half_day";
    case "campoff_work":
      return "campoff_earned";
    case "campoff_leave":
      return "campoff_used";
    case "working":
      return "empty";
    default:
      return "empty";
  }
}

export function applyLateOverride(
  status: AttendanceCellStatus,
  checkInIso: string | null | undefined,
  rules: AttendanceRules,
): AttendanceCellStatus {
  if (status !== "present" || !checkInIso) return status;
  return isLateCheckIn(checkInIso, rules) ? "late" : status;
}
