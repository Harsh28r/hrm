"use client";

import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { AttendanceGridModel } from "@/entities/attendance";
import { isWeekOffDay, weekdayShort } from "@/entities/attendance/lib/time-rules";
import { AttendanceLogPagination } from "@/widgets/employee-attendance/ui/attendance-log-pagination";
import type { AttendancePaginationLabels } from "@/widgets/employee-attendance/ui/attendance-log-pagination";
import { AttendanceMatrixLegend } from "@/widgets/employee-attendance/ui/attendance-matrix-legend";
import { AttendanceStatusIcon } from "@/widgets/employee-attendance/ui/attendance-status-icon";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

type MatrixLabels = {
  title: string;
  description: string;
  employee: string;
  searchPlaceholder: string;
  showEntries: string;
  loading: string;
  empty: string;
  legendNote: string;
  legendHoliday: string;
  legendWeekOff: string;
  legendCheckedIn: string;
  legendPresent: string;
  legendManualPresent: string;
  legendHalfDay: string;
  legendLate: string;
  legendAbsent: string;
  legendOnLeave: string;
  legendCampoffEarned: string;
  legendCampoffUsed: string;
  weekOffPrefix: string;
  prevMonth: string;
  nextMonth: string;
  refresh: string;
  pagination: AttendancePaginationLabels;
};

/** Company default week off — used to tint column headers (employee-specific off shown per row). */
type Props = {
  companyWeekOffDays?: number[];
};

type TableProps = Props & {
  grid: AttendanceGridModel | null;
  loading: boolean;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  labels: MatrixLabels;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

const PAGE_SIZES = [15, 25, 50] as const;

/** Opaque header fill (dark `--table-header-bg` is translucent; sticky needs solid). */
const MATRIX_HEAD_BG = "bg-[#f8fafc] dark:bg-[#1a2332]";
const MATRIX_EMP_COL_PX = 200;
const MATRIX_DAY_COL_PX = 44;

export function AttendanceMatrixTable({
  grid,
  loading,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  labels,
  search,
  onSearchChange,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  refreshing = false,
  companyWeekOffDays = [0],
}: TableProps) {
  const pageRows = grid?.rows ?? [];
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const headerTrackRef = useRef<HTMLDivElement>(null);

  const syncHeaderScroll = useCallback((scrollLeft: number) => {
    if (headerTrackRef.current) {
      headerTrackRef.current.style.transform = `translate3d(-${scrollLeft}px,0,0)`;
    }
  }, []);

  const onBodyScroll = useCallback(() => {
    const el = bodyScrollRef.current;
    if (el) syncHeaderScroll(el.scrollLeft);
  }, [syncHeaderScroll]);

  const dayNumbers = useMemo(() => {
    if (!grid) return [];
    return Array.from({ length: grid.daysInMonth }, (_, i) => i + 1);
  }, [grid]);

  const dayColsPx = dayNumbers.length * MATRIX_DAY_COL_PX;
  const tableWidthPx = MATRIX_EMP_COL_PX + dayColsPx;

  useEffect(() => {
    const el = bodyScrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    syncHeaderScroll(0);
  }, [grid?.year, grid?.month, syncHeaderScroll]);

  const legendLabels = {
    legendNote: labels.legendNote,
    legendHoliday: labels.legendHoliday,
    legendWeekOff: labels.legendWeekOff,
    legendCheckedIn: labels.legendCheckedIn,
    legendPresent: labels.legendPresent,
    legendManualPresent: labels.legendManualPresent,
    legendHalfDay: labels.legendHalfDay,
    legendLate: labels.legendLate,
    legendAbsent: labels.legendAbsent,
    legendOnLeave: labels.legendOnLeave,
    legendCampoffEarned: labels.legendCampoffEarned,
    legendCampoffUsed: labels.legendCampoffUsed,
  };

  return (
    <section className="rounded-[14px] border border-border/90 bg-surface shadow-[var(--shadow-card)]">
      <div className="border-b border-border/90 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-heading">{labels.title}</h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{labels.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border/90 bg-chrome text-heading hover:border-primary/35 dark:border-white/[0.12] dark:bg-white/[0.06]"
              aria-label={labels.prevMonth}
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
            <span className="min-w-[9rem] text-center text-[14px] font-semibold tabular-nums text-heading">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={onNextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border/90 bg-chrome text-heading hover:border-primary/35 dark:border-white/[0.12] dark:bg-white/[0.06]"
              aria-label={labels.nextMonth}
            >
              <ChevronRight size={20} strokeWidth={1.75} />
            </button>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="ml-1 inline-flex h-10 items-center gap-2 rounded-[10px] border border-border/90 bg-surface px-3 text-[13px] font-semibold text-heading shadow-sm transition-colors hover:bg-chrome/60 disabled:pointer-events-none disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {labels.refresh}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <AttendanceMatrixLegend labels={legendLabels} />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[13px] text-fg-muted">
            <span>{labels.showEntries}</span>
            <select
              className="ui-field h-9 rounded-[8px] px-2 text-[13px] font-medium text-heading"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="ui-field h-10 w-full rounded-[10px] pl-9 pr-3 text-[13px]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="px-6 py-16 text-center text-[13px] text-fg-muted">{labels.loading}</p>
      ) : pageRows.length === 0 ? (
        <p className="px-6 py-16 text-center text-[13px] text-fg-muted">{labels.empty}</p>
      ) : (
        <div className="relative">
          {/* Sticky on page scroll — must sit outside overflow-x-auto (that breaks sticky top). */}
          <div
            className={`sticky top-[-32px] z-30 max-w-full overflow-x-hidden border-b border-border/90 ${MATRIX_HEAD_BG}`}
          >
            <div
              className="grid items-stretch"
              style={{
                width: tableWidthPx,
                gridTemplateColumns: `${MATRIX_EMP_COL_PX}px ${dayColsPx}px`,
              }}
            >
              <div
                className={`flex items-center border-r border-border/90 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted shadow-[4px_0_12px_-4px_rgba(0,0,0,0.15)] ${MATRIX_HEAD_BG}`}
              >
                {labels.employee}
              </div>
              <div className="overflow-hidden">
                <div ref={headerTrackRef} className="will-change-transform">
                  <table
                    className="table-fixed border-collapse text-[13px]"
                    style={{ width: dayColsPx }}
                  >
                    <colgroup>
                      {dayNumbers.map((day) => (
                        <col key={day} style={{ width: MATRIX_DAY_COL_PX }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr className={MATRIX_HEAD_BG}>
                        {dayNumbers.map((day) => (
                          <th
                            key={`d-${day}`}
                            className={`border-b border-border/60 ${MATRIX_HEAD_BG} px-0 pt-2 pb-0.5 text-center text-[11px] font-semibold tabular-nums text-heading`}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                      <tr className={MATRIX_HEAD_BG}>
                        {dayNumbers.map((day) => {
                          const isCompanyOff =
                            grid != null &&
                            isWeekOffDay(grid.year, grid.month, day, companyWeekOffDays);
                          return (
                            <th
                              key={`w-${day}`}
                              title={isCompanyOff ? labels.legendWeekOff : undefined}
                              className={`border-b border-border/90 px-0 pb-2 pt-0 text-center text-[10px] font-semibold uppercase tracking-wide ${
                                isCompanyOff
                                  ? "bg-[#eef7f7] text-primary dark:bg-[#15282c]"
                                  : `${MATRIX_HEAD_BG} text-fg-muted`
                              }`}
                            >
                              {grid ? weekdayShort(grid.year, grid.month, day) : ""}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={bodyScrollRef}
            className="overflow-x-auto overscroll-x-contain"
            onScroll={onBodyScroll}
          >
            <table
              className="table-fixed border-collapse text-[13px]"
              style={{ width: tableWidthPx }}
            >
              <colgroup>
                <col style={{ width: MATRIX_EMP_COL_PX }} />
                {dayNumbers.map((day) => (
                  <col key={day} style={{ width: MATRIX_DAY_COL_PX }} />
                ))}
              </colgroup>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={row.employee.id}
                    className="border-b border-[var(--table-divider)] transition-colors hover:bg-[var(--table-row-hover)]"
                  >
                    <td className="sticky left-0 z-20 border-r border-border/90 bg-surface px-4 py-2.5 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.12)] [tr:hover_&]:bg-chrome-hover dark:bg-[var(--brand-surface)] dark:[tr:hover_&]:bg-[#1a2332]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {initials(row.employee.name)}
                        </span>
                        <div className="min-w-0">
                          <span className="block max-w-[140px] truncate font-medium text-heading sm:max-w-[180px]">
                            {row.employee.name}
                          </span>
                          {row.weekOffLabel ? (
                            <span className="mt-0.5 block text-[10px] font-medium text-fg-muted">
                              {labels.weekOffPrefix}{" "}
                              <span className="text-primary">{row.weekOffLabel}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    {dayNumbers.map((day) => {
                      const status = row.cells[day] ?? "empty";
                      const title = row.cellTitles?.[day];
                      return (
                        <td key={day} className="px-0 py-1.5 text-center align-middle">
                          <AttendanceStatusIcon status={status} title={title} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && total > 0 ? (
        <AttendanceLogPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          labels={labels.pagination}
        />
      ) : null}
    </section>
  );
}
