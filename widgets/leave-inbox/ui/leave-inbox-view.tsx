"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchLeaveRequests,
  hrApproveLeave,
  hrRejectLeave,
  hrBulkLeaveAction,
  type LeaveRequest,
  type LeaveListTab,
} from "@/entities/leave";
import { LeaveApprovalTimeline, useLeavePendingCount } from "@/features/leave";
import { EmptyState, useSnackbar } from "@/shared/ui";

const TABS: { id: LeaveListTab; label: string; hint?: string }[] = [
  { id: "pending_hr", label: "Pending HR", hint: "Ready for your final approval" },
  {
    id: "pending_tl",
    label: "With manager",
    hint: "Submitted — waiting on reporting manager. HR can still directly finalize if manager is unavailable.",
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

function requestId(request: LeaveRequest) {
  return request._id || request.id || "";
}

function requestProjects(request: LeaveRequest) {
  return request.employeeProjects || [];
}

function requestUserName(request: LeaveRequest) {
  return request.user && typeof request.user === "object" ? request.user.name : undefined;
}

function requestPrimaryProject(request: LeaveRequest) {
  return request.primaryProjectName || requestProjects(request)[0]?.name || null;
}

function canActOnRequest(r: LeaveRequest) {
  return r.status === "pending_hr" || r.status === "pending_tl";
}

export function LeaveInboxView() {
  const [tab, setTab] = useState<LeaveListTab>("pending_hr");
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkComment, setBulkComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState(false);
  const { refresh: refreshPendingCount } = useLeavePendingCount();
  const { showSuccess, showError, showWarning } = useSnackbar();

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (opts?.silent) setRefreshing(true);
        else setLoading(true);
        const res = await fetchLeaveRequests(tab);
        setRows(res.data);
        setLastUpdated(new Date());
        if (tab === "pending_hr") refreshPendingCount();
      } catch (e) {
        showError(
          e instanceof Error ? e.message : "Failed to load leave requests",
          "Could not load",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, refreshPendingCount, showError],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab, projectFilter, search]);

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await load({ silent: true });
      refreshPendingCount();
      showSuccess(
        action === "approve" ? "Leave request approved." : "Leave request rejected.",
        "Done",
      );
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Could not update leave request",
        action === "approve" ? "Approve failed" : "Reject failed",
      );
    } finally {
      setActing(null);
    }
  };

  const activeTab = TABS.find((t) => t.id === tab);
  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      requestProjects(row).forEach((project) => {
        if (project?.id && project?.name && !map.has(project.id)) {
          map.set(project.id, project.name);
        }
      });
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesProject =
        projectFilter === "all" || requestProjects(row).some((p) => p.id === projectFilter);
      if (!matchesProject) return false;
      if (!term) return true;

      const projectNames = requestProjects(row)
        .map((p) => p.name.toLowerCase())
        .join(" ");
      const haystack = [
        row.employeeName || "",
        row.user && typeof row.user === "object" ? row.user.email || "" : "",
        row.managerName || "",
        row.reason || "",
        row.type || "",
        projectNames,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, projectFilter, search]);

  const actionableFiltered = useMemo(
    () => filteredRows.filter(canActOnRequest),
    [filteredRows],
  );

  const actionableIds = useMemo(
    () => actionableFiltered.map(requestId).filter(Boolean),
    [actionableFiltered],
  );

  const selectedCount = selectedIds.size;
  const allActionableSelected =
    actionableIds.length > 0 && actionableIds.every((id) => selectedIds.has(id));
  const someActionableSelected = actionableIds.some((id) => selectedIds.has(id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allActionableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(actionableIds));
    }
  };

  const bulkAct = async (action: "approve" | "reject") => {
    const ids = [...selectedIds].filter((id) =>
      actionableFiltered.some((r) => requestId(r) === id),
    );
    if (!ids.length) return;

    try {
      setBulkActing(true);
      const results = await hrBulkLeaveAction(ids, action, bulkComment.trim() || undefined);
      const failed = results.filter((r) => !r.ok);
      const succeeded = results.filter((r) => r.ok);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        succeeded.forEach((r) => next.delete(r.id));
        return next;
      });

      const actionLabel = action === "approve" ? "approved" : "rejected";

      if (failed.length === 0) {
        showSuccess(
          `${succeeded.length} request${succeeded.length === 1 ? "" : "s"} ${actionLabel}.`,
          "Bulk action complete",
        );
        setBulkComment("");
      } else if (succeeded.length === 0) {
        const detail = failed
          .map((r) => r.error)
          .filter(Boolean)
          .slice(0, 3)
          .join(" · ");
        showError(
          detail ||
            `All ${failed.length} selected request${failed.length === 1 ? "" : "s"} could not be ${actionLabel}.`,
          `Bulk ${action} failed`,
        );
      } else {
        const detail = failed
          .map((r) => r.error)
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ");
        showWarning(
          `${succeeded.length} ${actionLabel}, ${failed.length} failed. Failed items remain selected.${detail ? ` ${detail}` : ""}`,
          "Partial bulk result",
        );
        setSelectedIds(new Set(failed.map((r) => r.id)));
      }

      await load({ silent: true });
      refreshPendingCount();
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Bulk action could not be completed",
        "Bulk action failed",
      );
    } finally {
      setBulkActing(false);
    }
  };

  const hasActiveFilters = projectFilter !== "all" || search.trim().length > 0;
  const filterSummary =
    hasActiveFilters || tab !== "all"
      ? [
          tab !== "all" ? TABS.find((t) => t.id === tab)?.label : null,
          projectFilter !== "all"
            ? projectOptions.find((p) => p.id === projectFilter)?.name || "Project"
            : null,
          search.trim() ? `search: “${search.trim()}”` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Leave approvals</h1>
        <p className="mt-1 text-sm text-muted">
          Employee submits → manager approves in the sales dashboard → request appears here for HR final
          approval. Filter by project, multi-select requests, then approve or reject in bulk.
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
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">All projects</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee, manager, reason…"
          className="min-w-56 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      {filterSummary && (
        <p className="text-xs text-muted">
          Showing {filteredRows.length} request{filteredRows.length === 1 ? "" : "s"}
          {actionableFiltered.length !== filteredRows.length
            ? ` (${actionableFiltered.length} actionable)`
            : ""}{" "}
          · {filterSummary}
        </p>
      )}
      {activeTab?.hint && <p className="text-xs text-muted">{activeTab.hint}</p>}
      {lastUpdated && (
        <p className="text-xs text-muted">Last updated {lastUpdated.toLocaleTimeString()}</p>
      )}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No requests match these filters" : "No requests in this view"}
          description={
            hasActiveFilters
              ? "Try a different project or clear search to see more requests."
              : tab === "pending_hr"
                ? "Nothing waiting for HR right now. New items appear here automatically after a manager approves in Team approvals (sales dashboard). Check “With manager” for requests still at step 1."
                : tab === "pending_tl"
                  ? "No leave requests are currently waiting on managers."
                  : "Try another tab or check that leave requests exist in the system."
          }
        />
      ) : (
        <>
          {actionableFiltered.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allActionableSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someActionableSelected && !allActionableSelected;
                  }}
                  onChange={toggleSelectAllFiltered}
                  className="h-4 w-4 rounded border-border"
                />
                <span>
                  Select all actionable in view ({actionableFiltered.length})
                </span>
              </label>
              {selectedCount > 0 && (
                <button
                  type="button"
                  className="text-sm text-muted underline hover:text-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear selection
                </button>
              )}
            </div>
          )}

          {selectedCount > 0 && (
            <div className="sticky top-2 z-10 rounded-xl border border-primary/30 bg-surface p-4 shadow-md">
              <p className="mb-2 text-sm font-medium text-foreground">
                {selectedCount} selected
                {hasActiveFilters ? " (from current filters)" : ""}
              </p>
              <textarea
                className="mb-3 w-full rounded-lg border border-border bg-background p-2 text-sm"
                placeholder="Comment for all selected (optional)"
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
                rows={2}
                disabled={bulkActing}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={bulkActing}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                  onClick={() => bulkAct("approve")}
                >
                  {bulkActing ? "Processing…" : `Approve ${selectedCount}`}
                </button>
                <button
                  type="button"
                  disabled={bulkActing}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
                  onClick={() => bulkAct("reject")}
                >
                  Reject {selectedCount}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredRows.map((r) => {
              const id = requestId(r);
              const name = r.employeeName || requestUserName(r) || "Employee";
              const projects = requestProjects(r);
              const primaryProject = requestPrimaryProject(r);
              const actionable = canActOnRequest(r);
              const selected = selectedIds.has(id);
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
                <article
                  key={id}
                  className={`rounded-xl border bg-surface p-4 shadow-sm ${
                    selected ? "border-primary ring-1 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {actionable && (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(id)}
                          disabled={bulkActing || acting === id}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                          aria-label={`Select leave request for ${name}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
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
                          {new Date(r.endDate).toLocaleDateString()} ({r.days} day
                          {r.days !== 1 ? "s" : ""})
                        </p>
                        {r.managerName && (
                          <p className="mt-1 text-xs text-muted">Reporting manager: {r.managerName}</p>
                        )}
                        <div className="mt-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Project details
                          </p>
                          <p className="mt-1 text-xs text-foreground">
                            <span className="text-muted">Primary: </span>
                            {primaryProject || "Not assigned"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {projects.length > 0
                              ? `Assigned projects (${projects.length}): ${projects.map((project) => project.name).join(", ")}`
                              : "No active project assignment found"}
                          </p>
                        </div>
                        {r.nextAction && (
                          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                            {r.nextAction}
                          </p>
                        )}
                      </div>
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

                  {actionable && (
                    <>
                      <textarea
                        className="mb-3 w-full rounded-lg border border-border bg-background p-2 text-sm"
                        placeholder={
                          r.status === "pending_tl"
                            ? "HR override reason (optional)"
                            : "HR comment (optional)"
                        }
                        value={comments[id] || ""}
                        onChange={(e) => setComments((c) => ({ ...c, [id]: e.target.value }))}
                        rows={2}
                        disabled={bulkActing}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={acting === id || bulkActing}
                          className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                          onClick={() => act(id, "approve")}
                        >
                          {r.status === "pending_tl"
                            ? "Approve directly (HR override)"
                            : "Final approve"}
                        </button>
                        <button
                          type="button"
                          disabled={acting === id || bulkActing}
                          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50"
                          onClick={() => act(id, "reject")}
                        >
                          {r.status === "pending_tl"
                            ? "Reject directly (HR override)"
                            : "Reject"}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
