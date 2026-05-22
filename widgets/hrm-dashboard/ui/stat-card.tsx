import type { ReactNode } from "react";

type StatTone = "teal" | "blue" | "amber" | "rose";

const toneClass: Record<StatTone, string> = {
  teal: "bg-primary/12 text-primary",
  blue: "bg-secondary/11 text-secondary",
  amber: "bg-amber-500/14 text-amber-900 dark:text-amber-200",
  rose: "bg-rose-500/11 text-rose-800 dark:text-rose-200",
};

export type StatCardProps = {
  title: string;
  value: string;
  /** Override default large KPI typography (e.g. long IDs). */
  valueClassName?: string;
  hint?: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: ReactNode;
  tone?: StatTone;
};

export function StatCard({
  title,
  value,
  valueClassName,
  hint,
  delta,
  deltaPositive = true,
  icon,
  tone = "teal",
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[14px] border border-border/90 bg-surface p-6 shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-300 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-px">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">{title}</p>
          <p
            className={
              valueClassName?.trim()
                ? `mt-2.5 font-semibold text-heading ${valueClassName}`
                : "mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-heading"
            }
          >
            {value}
          </p>
          {delta ? (
            <p
              className={`mt-2 text-[12px] font-semibold ${
                deltaPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {delta}
            </p>
          ) : null}
          {hint ? <p className="mt-2 text-[12px] leading-snug text-fg-muted">{hint}</p> : null}
        </div>
        <div
          className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl [&_svg]:h-[26px] [&_svg]:w-[26px] ${toneClass[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
