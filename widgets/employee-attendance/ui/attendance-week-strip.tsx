"use client";

import { addDays, isSameCalendarDay, isTodayLocal, startOfWeekMonday } from "@/widgets/employee-attendance/lib/date-helpers";

type Props = {
  selected: Date;
  onSelect: (d: Date) => void;
};

const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function AttendanceWeekStrip({ selected, onSelect }: Props) {
  const monday = startOfWeekMonday(selected);

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 sm:gap-2.5">
      {dow.map((label, i) => {
        const day = addDays(monday, i);
        const active = isSameCalendarDay(day, selected);
        const today = isTodayLocal(day);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(day)}
            className={`flex min-h-[64px] min-w-[56px] flex-col items-center justify-center rounded-[12px] border px-2 py-2.5 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-200 sm:min-w-[62px] sm:px-3 ${
              active
                ? "border-primary bg-primary text-white shadow-[0_8px_24px_-6px_rgba(0,112,118,0.55)]"
                : today
                  ? "border-primary/40 bg-primary/[0.07] text-heading shadow-[inset_0_0_0_1px_rgba(0,112,118,0.12)] hover:bg-primary/10"
                  : "border-[color:var(--input-border)] bg-chrome text-fg-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-chrome-hover hover:text-heading dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</span>
            <span
              className={`mt-1 tabular-nums text-[17px] font-bold leading-none ${active ? "text-white" : "text-heading"}`}
            >
              {day.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
