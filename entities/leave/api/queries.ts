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
};

export type LeaveListTab =
  | "pending_hr"
  | "pending_tl"
  | "all"
  | "approved"
  | "rejected";

export function fetchHrLeaveApprovals() {
  return hrmBffFetch<{ data: LeaveRequest[] }>("leave/approvals/hr");
}

export function fetchLeaveRequests(status: LeaveListTab | string = "all") {
  const q = status === "pending_hr" ? "leave/approvals/hr" : `leave/requests?status=${encodeURIComponent(status)}`;
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
