import { hrmBffFetch } from "@/lib/api/hrm-bff";
import type { LeaveTimelineEntry } from "@/features/leave";

export type LeaveRequest = {
  _id: string;
  id?: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  statusLabel?: string;
  nextAction?: string | null;
  employeeName?: string;
  managerName?: string | null;
  user?: string | { _id?: string; id?: string; name?: string; email?: string };
  assignedTl?: { name?: string; email?: string };
  timeline?: LeaveTimelineEntry[];
  approvalHistory?: Array<{
    step: string;
    action: string;
    actorName?: string;
    comment?: string;
    at: string;
  }>;
  employeeProjects?: Array<{ id: string; name: string }>;
  primaryProjectName?: string | null;
};

export type LeaveListTab =
  | "pending_hr"
  | "pending_tl"
  | "all"
  | "approved"
  | "rejected";

export type LeaveRequestFilters = {
  projectId?: string;
};

export function fetchHrLeaveApprovals() {
  return hrmBffFetch<{ data: LeaveRequest[] }>("leave/approvals/hr");
}

export function fetchLeaveRequests(
  status: LeaveListTab | string = "all",
  filters: LeaveRequestFilters = {},
) {
  const isPendingHr = status === "pending_hr";
  const params = new URLSearchParams();
  if (!isPendingHr) {
    params.set("status", String(status));
  }
  if (filters.projectId) {
    params.set("projectId", filters.projectId);
  }
  const query = params.toString();
  const q = isPendingHr
    ? `leave/approvals/hr${query ? `?${query}` : ""}`
    : `leave/requests${query ? `?${query}` : ""}`;
  return hrmBffFetch<{ data: LeaveRequest[] }>(q);
}

export function hrApproveLeave(id: string, comment?: string) {
  return hrmBffFetch(`leave/requests/${id}/hr-approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function hrRejectLeave(id: string, comment?: string) {
  return hrmBffFetch(`leave/requests/${id}/hr-reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export type BulkLeaveActionResult = {
  id: string;
  ok: boolean;
  error?: string;
};

export async function hrBulkLeaveAction(
  ids: string[],
  action: "approve" | "reject",
  comment?: string,
): Promise<BulkLeaveActionResult[]> {
  const fn = action === "approve" ? hrApproveLeave : hrRejectLeave;
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        await fn(id, comment);
        return { id, ok: true as const };
      } catch (e) {
        return {
          id,
          ok: false as const,
          error: e instanceof Error ? e.message : "Failed",
        };
      }
    }),
  );
  return results;
}

export type AuditEntry = {
  _id?: string;
  action?: string;
  actorName?: string;
  createdAt?: string;
};

export function fetchAudit(entityType: string, entityId: string) {
  return hrmBffFetch<{ data: AuditEntry[] }>(
    `audit?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
  );
}
