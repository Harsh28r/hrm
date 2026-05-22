import { hrmBffFetch } from "@/lib/api/hrm-bff";

export type DaySummaryRow = {
  _id: string;
  user?: { _id?: string; name?: string; email?: string } | string;
  date: string;
  dayType: string;
  isLop?: boolean;
};

export function fetchAttendanceSummary(params: {
  startDate: string;
  endDate: string;
  userIds?: string[];
}) {
  const q = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  });
  if (params.userIds?.length) {
    q.set("userIds", params.userIds.join(","));
  }
  return hrmBffFetch<{ data: DaySummaryRow[] }>(`attendance/summary?${q}`);
}
