"use client";

import { ATTENDANCE_STATUS_LEGEND, AttendanceStatusIcon } from "./attendance-status-icon";

type Labels = Record<
  | "legendNote"
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
  | "legendCampoffUsed",
  string
>;

type Props = {
  labels: Labels;
};

export function AttendanceMatrixLegend({ labels }: Props) {
  return (
    <div className="rounded-[12px] border border-border/80 bg-chrome/60 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
        {labels.legendNote}
      </p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {ATTENDANCE_STATUS_LEGEND.map(({ status, labelKey }) => {
          const text =
            labels[labelKey]?.trim() ||
            (status === "manual_present" ? "Manual entry" : labelKey);
          return (
            <li
              key={status}
              className="flex shrink-0 items-center gap-2 text-[12px] text-fg-muted"
            >
              <AttendanceStatusIcon status={status} size={16} />
              <span className="whitespace-nowrap font-medium text-heading">{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
