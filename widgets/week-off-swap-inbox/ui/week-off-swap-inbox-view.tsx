"use client";

import { useCallback, useEffect, useState } from "react";
import { en } from "@/shared/i18n";
import {
  fetchHrWeekOffSwapApprovals,
  hrApproveWeekOffSwap,
  hrRejectWeekOffSwap,
  type WeekOffSwapRequest,
} from "@/entities/week-off-swap/api/queries";
import { EmptyState, useSnackbar } from "@/shared/ui";

function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function userName(req: WeekOffSwapRequest) {
  return typeof req.user === "object" ? req.user.name || req.user.email : "Employee";
}

export function WeekOffSwapInboxView() {
  const [rows, setRows] = useState<WeekOffSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const { showSuccess, showError } = useSnackbar();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchHrWeekOffSwapApprovals();
      setRows(list);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to load", "Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    try {
      setActing(id);
      if (action === "approve") await hrApproveWeekOffSwap(id, comments[id]);
      else await hrRejectWeekOffSwap(id, comments[id]);
      showSuccess(
        action === "approve" ? en.attendance.weekOffSwap.approved : en.attendance.weekOffSwap.rejected,
        "Done",
      );
      await load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Action failed", "Error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-[26px] font-bold text-heading">{en.attendance.weekOffSwap.pageTitle}</h1>
        <p className="mt-2 text-[13px] text-fg-muted">{en.attendance.weekOffSwap.subtitle}</p>
      </header>

      {loading ? (
        <p className="text-[13px] text-fg-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState title={en.attendance.weekOffSwap.noPending} />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r._id}
              className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-heading">{userName(r)}</p>
                  <p className="mt-1 text-[13px] text-fg-muted">
                    {en.attendance.weekOffSwap.fromDate}:{" "}
                    <span className="font-medium text-heading">{formatDay(r.fromDate)}</span>
                    {" → "}
                    {en.attendance.weekOffSwap.toDate}:{" "}
                    <span className="font-medium text-heading">{formatDay(r.toDate)}</span>
                  </p>
                  {r.reason ? (
                    <p className="mt-2 text-[13px] text-fg-muted">
                      {en.attendance.weekOffSwap.reason}: {r.reason}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase text-amber-800 dark:text-amber-300">
                  {en.attendance.weekOffSwap.pending}
                </span>
              </div>
              <textarea
                className="ui-field mt-4 min-h-[72px] w-full normal-case tracking-normal"
                placeholder="HR comment (optional)"
                value={comments[r._id] ?? ""}
                onChange={(e) =>
                  setComments((c) => ({ ...c, [r._id]: e.target.value }))
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={acting === r._id}
                  onClick={() => void act(r._id, "approve")}
                  className="h-10 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {en.attendance.weekOffSwap.approve}
                </button>
                <button
                  type="button"
                  disabled={acting === r._id}
                  onClick={() => void act(r._id, "reject")}
                  className="h-10 rounded-[10px] border border-border/90 px-4 text-[13px] font-semibold text-heading disabled:opacity-50"
                >
                  {en.attendance.weekOffSwap.reject}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
