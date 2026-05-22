"use client";

import { X } from "lucide-react";
import { useId } from "react";
import { en } from "@/shared/i18n";
import type { CalculationBrief } from "@/features/payroll/model/payroll-types";

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  brief: CalculationBrief | null;
  loading?: boolean;
  error?: string | null;
};

export function SalaryCalculationBriefModal({
  open,
  onClose,
  employeeName,
  brief,
  loading,
  error,
}: Props) {
  const titleId = useId();
  if (!open) return null;

  const monthLabel = brief
    ? new Date(brief.period.year, brief.period.month - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label={en.payroll.salaryBriefClose}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,780px)] w-full max-w-[720px] flex-col overflow-hidden rounded-[16px] border border-border/90 bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border/90 px-6 py-4">
          <div>
            <h2 id={titleId} className="text-[17px] font-semibold text-heading">
              {en.payroll.salaryBriefTitle}
            </h2>
            <p className="mt-0.5 text-[13px] text-fg-muted">
              {employeeName}
              {monthLabel ? ` · ${monthLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-muted hover:bg-chrome hover:text-heading"
            aria-label={en.payroll.salaryBriefClose}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-[13px] text-fg-muted">{en.payroll.salaryBriefLoading}</p>
          ) : error ? (
            <p className="rounded-[10px] border border-rose-300/60 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-200">
              {error}
            </p>
          ) : brief ? (
            <div className="space-y-6">
              <section className="rounded-[12px] border border-border/80 bg-chrome/30 p-4">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
                  {en.payroll.salaryBriefAttendance}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                  <Stat label={en.payroll.salaryBriefCalendar} value={brief.attendance.calendarDays} />
                  <Stat label={en.payroll.salaryBriefPayable} value={brief.attendance.payableDays} />
                  <Stat label={en.payroll.salaryBriefPresent} value={brief.attendance.present} />
                  <Stat label={en.payroll.salaryBriefLop} value={brief.attendance.lop} />
                  <Stat label={en.payroll.salaryBriefWeekoff} value={brief.attendance.weekoffs} />
                  <Stat label={en.payroll.salaryBriefHoliday} value={brief.attendance.holidays} />
                  <Stat label={en.payroll.salaryBriefLeave} value={brief.attendance.onLeave} />
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-fg-muted">{brief.attendance.formula}</p>
                <p className="mt-2 text-[12px] text-fg-muted">{brief.proration.explanation}</p>
              </section>

              <section>
                <h3 className="text-[13px] font-semibold text-heading">{en.payroll.salaryBriefSteps}</h3>
                <ol className="mt-3 space-y-2">
                  {brief.steps.map((s) => (
                    <li
                      key={s.step}
                      className="flex gap-3 rounded-[10px] border border-border/70 bg-surface px-3 py-2.5 text-[13px]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {s.step}
                      </span>
                      <div>
                        <p className="font-medium text-heading">{s.label}</p>
                        <p className="mt-0.5 text-fg-muted">{s.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <AmountBlock
                  title={en.payroll.salaryBriefEarnings}
                  rows={brief.earnings.prorated}
                  total={brief.earnings.grossProrated}
                  totalLabel={en.payroll.salaryBriefGrossProrated}
                />
                <AmountBlock
                  title={en.payroll.salaryBriefDeductions}
                  rows={{
                    ...brief.deductions.fixedProrated,
                    PF: brief.deductions.statutory.pfEmployee,
                    ESI: brief.deductions.statutory.esiEmployee,
                    PT: brief.deductions.statutory.pt,
                    TDS: brief.deductions.statutory.tds,
                  }}
                  total={
                    brief.deductions.fixedTotal + brief.deductions.statutory.total
                  }
                  totalLabel={en.payroll.salaryBriefTotalDeductions}
                />
              </section>

              <div className="rounded-[12px] border border-primary/30 bg-primary/8 px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  {en.payroll.salaryBriefNet}
                </p>
                <p className="mt-1 text-[28px] font-bold tabular-nums text-heading">
                  {formatInr(brief.totals.net)}
                </p>
                <p className="mt-1 text-[12px] text-fg-muted">
                  {en.payroll.salaryBriefFullMonthGross}: {formatInr(brief.earnings.grossFull)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-fg-muted">{en.payroll.salaryBriefNoData}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] text-fg-muted">{label}</p>
      <p className="font-semibold tabular-nums text-heading">{value}</p>
    </div>
  );
}

function AmountBlock({
  title,
  rows,
  total,
  totalLabel,
}: {
  title: string;
  rows: Record<string, number>;
  total: number;
  totalLabel: string;
}) {
  const entries = Object.entries(rows).filter(([, v]) => v > 0);
  return (
    <div className="rounded-[12px] border border-border/80 p-4">
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-fg-muted">{title}</h4>
      <ul className="mt-2 space-y-1 text-[13px]">
        {entries.length === 0 ? (
          <li className="text-fg-muted">—</li>
        ) : (
          entries.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2">
              <span className="text-fg-muted">{k}</span>
              <span className="tabular-nums text-heading">{formatInr(v)}</span>
            </li>
          ))
        )}
      </ul>
      <p className="mt-3 flex justify-between border-t border-border/80 pt-2 text-[13px] font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums text-heading">{formatInr(total)}</span>
      </p>
    </div>
  );
}
