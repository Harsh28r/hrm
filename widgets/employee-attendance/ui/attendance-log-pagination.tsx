"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZES = [25, 50, 100] as const;

export type AttendancePaginationLabels = {
  showing: string;
  rangeSep: string;
  ofTotal: string;
  perPage: string;
  first: string;
  prev: string;
  next: string;
  last: string;
  page: string;
  ofPages: string;
};

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  disabled: boolean;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  labels: AttendancePaginationLabels;
};

const navBtn =
  "flex h-10 min-w-[2.5rem] items-center justify-center rounded-[10px] border border-border/90 bg-chrome px-2.5 text-[13px] font-semibold text-heading transition-[background-color,opacity,border-color] hover:border-primary/35 hover:bg-chrome-hover disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.12] dark:bg-white/[0.06]";

export function AttendanceLogPagination({
  page,
  totalPages,
  total,
  pageSize,
  disabled,
  onPageChange,
  onPageSizeChange,
  labels,
}: Props) {
  if (total <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 border-t border-border/90 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 dark:border-white/[0.08]">
      <p className="text-[13px] text-fg-muted">
        <span>{labels.showing} </span>
        <span className="font-semibold tabular-nums text-heading">{from}</span>
        <span>{labels.rangeSep}</span>
        <span className="font-semibold tabular-nums text-heading">{to}</span>
        <span> {labels.ofTotal} </span>
        <span className="font-semibold tabular-nums text-heading">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[12px] font-medium text-fg-muted">
          <span className="whitespace-nowrap">{labels.perPage}</span>
          <select
            className="ui-field h-10 cursor-pointer px-2.5 py-0 text-[13px] font-semibold text-heading"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={navBtn}
            disabled={disabled || page <= 1}
            aria-label={labels.first}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={navBtn}
            disabled={disabled || page <= 1}
            aria-label={labels.prev}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </button>
          <span className="min-w-[8rem] px-2 text-center text-[13px] font-semibold tabular-nums text-heading">
            {labels.page} {page} {labels.ofPages} {safeTotalPages}
          </span>
          <button
            type="button"
            className={navBtn}
            disabled={disabled || page >= safeTotalPages}
            aria-label={labels.next}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </button>
          <button
            type="button"
            className={navBtn}
            disabled={disabled || page >= safeTotalPages}
            aria-label={labels.last}
            onClick={() => onPageChange(safeTotalPages)}
          >
            <ChevronsRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
