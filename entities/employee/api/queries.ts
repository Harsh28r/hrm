import { hrmBffFetch } from "@/lib/api/hrm-bff";
import type { Employee } from "../model/types";
import type { PaginatedResponse } from "@/types/api";

export async function fetchEmployees(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<Employee>> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  const suffix = q.toString() ? `?${q}` : "";
  const res = await hrmBffFetch<{
    data: Array<{ id: string; fullName: string; email?: string; profile?: unknown }>;
    meta: PaginatedResponse<Employee>["meta"];
  }>(`employees${suffix}`);
  return {
    data: res.data.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      email: e.email,
      jobTitle: undefined,
    })),
    meta: res.meta,
  };
}

export function fetchEmployeeById(id: string) {
  return hrmBffFetch<{ user: unknown; profile: unknown; balances: unknown; campOff: unknown }>(
    `employees/${id}`,
  );
}

export function updateEmployeeProfile(id: string, body: Record<string, unknown>) {
  return hrmBffFetch(`employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
