"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import type { AttendanceRow, AttendanceRowStatus } from "@/entities/attendance/model/row";

export type { AttendanceRow, AttendanceRowStatus };

function statusBadge(status: AttendanceRowStatus) {
  const map: Record<AttendanceRowStatus, string> = {
    present:
      "bg-emerald-50 text-emerald-800 ring-emerald-600/18 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-500/25",
    late: "bg-amber-50 text-amber-900 ring-amber-600/18 dark:bg-amber-950/45 dark:text-amber-200 dark:ring-amber-500/25",
    half_day:
      "bg-orange-50 text-orange-900 ring-orange-600/18 dark:bg-orange-950/45 dark:text-orange-200 dark:ring-orange-500/25",
    absent: "bg-rose-50 text-rose-800 ring-rose-600/18 dark:bg-rose-950/45 dark:text-rose-200 dark:ring-rose-500/25",
    leave: "bg-sky-50 text-sky-900 ring-sky-600/18 dark:bg-sky-950/45 dark:text-sky-200 dark:ring-sky-500/25",
    remote:
      "bg-violet-50 text-violet-900 ring-violet-600/18 dark:bg-violet-950/45 dark:text-violet-200 dark:ring-violet-500/25",
    checked_in:
      "bg-teal-50 text-teal-900 ring-teal-600/18 dark:bg-teal-950/45 dark:text-teal-200 dark:ring-teal-500/25",
    checked_out:
      "bg-emerald-50 text-emerald-800 ring-emerald-600/18 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-500/25",
    on_leave: "bg-sky-50 text-sky-900 ring-sky-600/18 dark:bg-sky-950/45 dark:text-sky-200 dark:ring-sky-500/25",
  };
  const label: Record<AttendanceRowStatus, string> = {
    present: "Present",
    late: "Late",
    half_day: "Half day",
    absent: "Absent",
    leave: "On leave",
    remote: "Remote",
    checked_in: "Checked in",
    checked_out: "Checked out",
    on_leave: "On leave",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

function SelfieThumb({
  url,
  ariaLabel,
  onOpen,
}: {
  url: string | null;
  ariaLabel: string;
  onOpen: () => void;
}) {
  if (!url) {
    return <span className="inline-flex h-11 w-11 items-center justify-center text-fg-subtle">—</span>;
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/80 transition-[ring-color,transform] hover:ring-primary/40 hover:brightness-[1.02] active:scale-[0.97] dark:ring-white/[0.12]"
    >
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </button>
  );
}

function SelfieLightbox({
  open,
  src,
  title,
  closeLabel,
  onClose,
}: {
  open: boolean;
  src: string | null;
  title: string;
  closeLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !src || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] max-w-[min(96vw,920px)] flex-col gap-3 rounded-2xl border border-white/10 bg-surface p-4 shadow-2xl dark:bg-[#141c26]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-semibold text-heading">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/80 px-3 py-1.5 text-[12px] font-semibold text-fg-muted transition-colors hover:border-primary/35 hover:text-heading dark:border-white/[0.12]"
          >
            {closeLabel}
          </button>
        </div>
        <div className="min-h-0 overflow-auto rounded-xl bg-elevated/50 p-2 dark:bg-black/30">
          <img
            src={src}
            alt={title}
            className="mx-auto max-h-[min(78vh,720px)] w-auto max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

type Props = {
  rows: AttendanceRow[];
  loading?: boolean;
  showDateColumn?: boolean;
  /** Renders below the scroll area (e.g. pagination bar). */
  footer?: ReactNode;
  labels: {
    title: string;
    description: string;
    employee: string;
    id: string;
    department: string;
    date: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    selfies: string;
    selfieInAria: string;
    selfieOutAria: string;
    status: string;
    loading: string;
    empty: string;
    selfieViewerTitle: string;
    selfieViewerClose: string;
  };
};

export function AttendanceLogTable({ rows, labels, loading, showDateColumn, footer }: Props) {
  const baseCols = 8;
  const cols = baseCols + (showDateColumn ? 1 : 0);
  const minW = showDateColumn ? "min-w-[1120px]" : "min-w-[1040px]";

  const [lightbox, setLightbox] = useState<{ src: string; title: string } | null>(null);
  const openSelfie = useCallback((src: string, title: string) => {
    setLightbox({ src, title });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border/90 bg-surface shadow-[var(--shadow-card)]">
      <SelfieLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        title={lightbox?.title ?? ""}
        closeLabel={labels.selfieViewerClose}
        onClose={closeLightbox}
      />
      <div className="border-b border-border/90 px-6 py-[18px]">
        <h2 className="text-[16px] font-semibold tracking-tight text-heading">{labels.title}</h2>
        <p className="mt-1 text-[13px] text-fg-muted">{labels.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-[13px] ${minW}`}>
          <thead>
            <tr className="border-b border-border/90 bg-[var(--table-header-bg)] text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
              {showDateColumn ? <th className="px-6 py-3.5">{labels.date}</th> : null}
              <th className="px-6 py-3.5">{labels.employee}</th>
              <th className="px-6 py-3.5">{labels.id}</th>
              <th className="px-6 py-3.5">{labels.department}</th>
              <th className="px-6 py-3.5">{labels.checkIn}</th>
              <th className="px-6 py-3.5">{labels.checkOut}</th>
              <th className="px-6 py-3.5">{labels.hours}</th>
              <th className="px-6 py-3.5">{labels.selfies}</th>
              <th className="px-6 py-3.5">{labels.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--table-divider)]">
            {loading ? (
              <tr>
                <td colSpan={cols} className="px-6 py-16 text-center text-[13px] text-fg-muted">
                  {labels.loading}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={cols} className="px-6 py-16 text-center text-[13px] text-fg-muted">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-[var(--table-row-hover)]">
                  {showDateColumn ? (
                    <td className="whitespace-nowrap px-6 py-[14px] tabular-nums text-fg-muted">
                      {row.workDate ?? "—"}
                    </td>
                  ) : null}
                  <td className="px-6 py-[14px] font-semibold text-heading">{row.name}</td>
                  <td className="px-6 py-[14px] font-mono text-[12px] text-fg-muted">{row.employeeId}</td>
                  <td className="px-6 py-[14px] text-fg-muted">{row.department}</td>
                  <td className="px-6 py-[14px] tabular-nums text-heading">
                    {row.checkIn ?? <span className="text-fg-subtle">—</span>}
                  </td>
                  <td className="px-6 py-[14px] tabular-nums text-heading">
                    {row.checkOut ?? <span className="text-fg-subtle">—</span>}
                  </td>
                  <td className="px-6 py-[14px] tabular-nums text-fg-muted">{row.hours ?? "—"}</td>
                  <td className="px-6 py-[14px]">
                    <div className="flex items-center gap-2">
                      <SelfieThumb
                        url={row.checkInSelfieUrl}
                        ariaLabel={`${labels.selfieInAria}: ${row.name}`}
                        onOpen={() =>
                          row.checkInSelfieUrl &&
                          openSelfie(row.checkInSelfieUrl, `${labels.selfieViewerTitle} · ${row.name} · ${labels.selfieInAria}`)
                        }
                      />
                      <SelfieThumb
                        url={row.checkOutSelfieUrl}
                        ariaLabel={`${labels.selfieOutAria}: ${row.name}`}
                        onOpen={() =>
                          row.checkOutSelfieUrl &&
                          openSelfie(row.checkOutSelfieUrl, `${labels.selfieViewerTitle} · ${row.name} · ${labels.selfieOutAria}`)
                        }
                      />
                    </div>
                  </td>
                  <td className="px-6 py-[14px]">{statusBadge(row.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
