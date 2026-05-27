import { apiFetch } from "@/shared/api";

export type WeekOffSwapRequest = {
  _id: string;
  user: { _id: string; name?: string; email?: string } | string;
  fromDate: string;
  toDate: string;
  weekKey: string;
  reason?: string;
  status: string;
  hrComment?: string;
  createdAt?: string;
};

export async function fetchHrWeekOffSwapApprovals(): Promise<WeekOffSwapRequest[]> {
  const res = await apiFetch<{ requests: WeekOffSwapRequest[] }>(
    "/api/hrm/week-off-swap/approvals/hr",
    { cache: "no-store" },
  );
  return res.requests ?? [];
}

export async function hrApproveWeekOffSwap(id: string, comment?: string) {
  return apiFetch(`/api/hrm/week-off-swap/requests/${id}/hr-approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment: comment || "" }),
  });
}

export async function hrRejectWeekOffSwap(id: string, comment?: string) {
  return apiFetch(`/api/hrm/week-off-swap/requests/${id}/hr-reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment: comment || "" }),
  });
}
