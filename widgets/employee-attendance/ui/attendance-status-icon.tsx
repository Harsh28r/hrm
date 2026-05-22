"use client";

import {
  AlertCircle,
  CalendarCheck,
  CalendarOff,
  Check,
  Circle,
  ClipboardPen,
  Gift,
  LogIn,
  Plane,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { AttendanceCellStatus } from "@/entities/attendance";

const iconSize = 18;
const stroke = 2.25;

type Config = {
  Icon: typeof Check;
  className: string;
  label: string;
};

const CONFIG: Record<AttendanceCellStatus, Config | null> = {
  checked_in: {
    Icon: LogIn,
    className: "text-teal-600 dark:text-teal-400 animate-pulse",
    label: "Checked in",
  },
  present: {
    Icon: Check,
    className: "text-emerald-500 dark:text-emerald-400",
    label: "Present",
  },
  manual_present: {
    Icon: ClipboardPen,
    className: "text-emerald-700 dark:text-emerald-300",
    label: "Manual entry",
  },
  absent: {
    Icon: X,
    className: "text-rose-500 dark:text-rose-400",
    label: "Absent",
  },
  on_leave: {
    Icon: Plane,
    className: "text-violet-500 dark:text-violet-400",
    label: "On leave",
  },
  holiday: {
    Icon: Sparkles,
    className: "text-purple-500 dark:text-purple-400",
    label: "Holiday",
  },
  weekoff: {
    Icon: CalendarOff,
    className: "text-teal-600 dark:text-teal-400",
    label: "Week off",
  },
  half_day: {
    Icon: Star,
    className: "text-sky-500 dark:text-sky-400",
    label: "Half day",
  },
  late: {
    Icon: AlertCircle,
    className: "text-amber-500 dark:text-amber-400",
    label: "Late",
  },
  campoff_earned: {
    Icon: Gift,
    className: "text-indigo-500 dark:text-indigo-400",
    label: "Camp-off earned",
  },
  campoff_used: {
    Icon: CalendarCheck,
    className: "text-cyan-600 dark:text-cyan-400",
    label: "Camp-off leave",
  },
  empty: {
    Icon: Circle,
    className: "text-fg-subtle/40",
    label: "No record",
  },
  future: {
    Icon: Circle,
    className: "text-fg-subtle/25",
    label: "Upcoming",
  },
};

type Props = {
  status: AttendanceCellStatus;
  size?: number;
  title?: string;
};

export function AttendanceStatusIcon({ status, size = iconSize, title }: Props) {
  const cfg = CONFIG[status];
  if (!cfg) return null;
  const { Icon, className, label } = cfg;
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center ${className}`}
      title={title ?? label}
      role="img"
      aria-label={title ?? label}
    >
      <Icon size={size} strokeWidth={stroke} absoluteStrokeWidth aria-hidden />
    </span>
  );
}

export type MatrixLegendLabelKey =
  | "legendHoliday"
  | "legendWeekOff"
  | "legendCheckedIn"
  | "legendPresent"
  | "legendManualPresent"
  | "legendHalfDay"
  | "legendLate"
  | "legendAbsent"
  | "legendOnLeave"
  | "legendCampoffEarned"
  | "legendCampoffUsed";

export const ATTENDANCE_STATUS_LEGEND: Array<{
  status: AttendanceCellStatus;
  labelKey: MatrixLegendLabelKey;
}> = [
  { status: "holiday", labelKey: "legendHoliday" },
  { status: "weekoff", labelKey: "legendWeekOff" },
  { status: "checked_in", labelKey: "legendCheckedIn" },
  { status: "present", labelKey: "legendPresent" },
  { status: "manual_present", labelKey: "legendManualPresent" },
  { status: "half_day", labelKey: "legendHalfDay" },
  { status: "late", labelKey: "legendLate" },
  { status: "absent", labelKey: "legendAbsent" },
  { status: "on_leave", labelKey: "legendOnLeave" },
  { status: "campoff_earned", labelKey: "legendCampoffEarned" },
  { status: "campoff_used", labelKey: "legendCampoffUsed" },
];
