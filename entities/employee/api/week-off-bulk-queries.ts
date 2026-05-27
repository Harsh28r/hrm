import { hrmBffFetch } from "@/lib/api/hrm-bff";

export type WeekOffRosterEmployee = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  projects: { id: string; name: string }[];
  weekOffDays: number[];
  weekOffUsesCompanyDefault: boolean;
  customWeekOffDays: number[];
};

export type WeekOffRosterResponse = {
  employees: WeekOffRosterEmployee[];
  projects: { id: string; name: string }[];
  companyWeekOffDays: number[];
};

export async function fetchWeekOffRoster(params?: {
  projectId?: string;
  search?: string;
}): Promise<WeekOffRosterResponse> {
  const q = new URLSearchParams();
  if (params?.projectId) q.set("projectId", params.projectId);
  if (params?.search) q.set("search", params.search);
  q.set("limit", "500");
  const suffix = q.toString() ? `?${q}` : "";
  return hrmBffFetch<WeekOffRosterResponse>(`employees/week-off-roster${suffix}`);
}

export async function bulkAssignWeekOff(body: {
  userIds: string[];
  fixedWeekdays: number[];
  useCompanyDefault: boolean;
}) {
  return hrmBffFetch<{ updated: number }>("employees/bulk-week-off", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
