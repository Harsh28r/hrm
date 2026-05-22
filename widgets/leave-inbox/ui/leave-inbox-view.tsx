"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaveRequests,
  hrApproveLeave,
  hrRejectLeave,
  type LeaveRequest,
  type LeaveListTab,
} from "@/entities/leave";
import { LeaveApprovalTimeline, useLeavePendingCount } from "@/features/leave";
import { EmptyState } from "@/shared/ui";

const TABS: { id: LeaveListTab; label: string; hint?: string }[] = [
  { id: "pending_hr", label: "Pending HR", hint: "Ready for your final approval" },
  {
    id: "pending_tl",
    label: "With manager",
    hint: "Submitted — waiting on reporting manager (read-only)",
  },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function statusBadgeClass(status: string) {
  if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status.includes("reject")) return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (status.includes("pending")) return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  return "bg-muted/20 text-muted";
}

export function LeaveInboxView() {
  const [tab, setTab] = useState<LeaveListTab>("pending_hr");
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const { refresh: refreshPendingCount } = useLeavePendingCount();

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (opts?.silent) setRefreshing(true);
        else setLoading(true);
        const res = await fetchLeaveRequests(tab);
        setRows(res.data);
        setLastUpdated(new Date());
        setError(null);
        if (tab === "pending_hr") refreshPendingCount();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, refreshPendingCount],
  );

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    try {
      setActing(id);
      if (action === "approve") await hrApproveLeave(id, comments[id]);
      else await hrRejectLeave(id, comments[id]);
      setComments((c) => {
        const next = { ...c };
        delete next[id];
        return next;
      });
      await load({ silent: true });
      refreshPendingCount();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  };

  const canAct = (r: LeaveRequest) => r.status === "pending_hr";
  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Leave approvals</h1>
        <p className="mt-1 text-sm text-muted">
          Employee submits → manager approves in the sales dashboard → request appears here for HR final
          approval. Use Refresh to load the latest requests.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id ? "bg-primary text-white" : "text-muted hover:bg-muted/10"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-muted/10 disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh now"}
        </button>
      </div>

      {activeTab?.hint && <p className="text-xs text-muted">{activeTab.hint}</p>}
      {lastUpdated && (
        <p className="text-xs text-muted">Last updated {lastUpdated.toLocaleTimeString()}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No requests in this view"
          description={
            tab === "pending_hr"
              ? "Nothing waiting for HR right now. New items appear here automatically after a manager approves in Team approvals (sales dashboard). Check “With manager” for requests still at step 1."
              : tab === "pending_tl"
                ? "No leave requests are currently waiting on managers."
                : "Try another tab or check that leave requests exist in the system."
          }
        />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const id = r._id || r.id || "";
            const name = r.employeeName || r.user?.name || "Employee";
            const timeline = r.timeline?.length
              ? r.timeline
              : (r.approvalHistory || []).map((h, i) => ({
                  id: `${id}-${i}`,
                  step: h.step,
                  action: h.action,
                  actorName: h.actorName,
                  comment: h.comment,
                  at: h.at,
                }));

            return (
              <article key={id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{name}</span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                        {r.type}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}
                      >
                        {r.statusLabel || r.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {new Date(r.startDate).toLocaleDateString()} –{" "}
                      {new Date(r.endDate).toLocaleDateString()} ({r.days} day{r.days !== 1 ? "s" : ""})
                    </p>
                    {r.managerName && (
                      <p className="mt-1 text-xs text-muted">Reporting manager: {r.managerName}</p>
                    )}
                    {r.nextAction && (
                      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {r.nextAction}
                      </p>
                    )}
                  </div>
                </div>

                {r.reason && (
                  <p className="mb-4 rounded-lg bg-muted/5 px-3 py-2 text-sm text-muted">
                    <span className="font-medium text-foreground">Reason: </span>
                    {r.reason}
                  </p>
                )}

                <div className="mb-4 rounded-lg border border-border bg-background/50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Approval trail
                  </p>
                  <LeaveApprovalTimeline
                    timeline={timeline}
                    status={r.status}
                    managerName={r.managerName}
                  />
                </div>

                {canAct(r) && (
                  <>
                    <textarea
                      className="mb-3 w-full rounded-lg border border-border bg-background p-2 text-sm"
                      placeholder="HR comment (optional)"
                      value={comments[id] || ""}
                      onChange={(e) => setComments((c) => ({ ...c, [id]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={acting === id}
                        className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                        onClick={() => act(id, "approve")}
                      >
                        Final approve
                      </button>
                      <button
                        type="button"
                        disabled={acting === id}
                        className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
                        onClick={() => act(id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
