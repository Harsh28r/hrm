import { hrmBffFetch } from "@/lib/api/hrm-bff";
import type {
  CalculationBrief,
  PayrollRegistryRow,
  PayslipApi,
  PayslipDisplay,
  SalaryFormPayload,
} from "@/features/payroll/model/payroll-types";

export type PayrollRun = {
  _id: string;
  month: number;
  year: number;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
};

export type PayslipListItem = {
  _id: string;
  user?: { name?: string; email?: string };
  gross: number;
  net: number;
  payableDays: number;
  lopDays: number;
  statutory?: Record<string, number>;
};

export function fetchPayrollRegistry(params: {
  month: number;
  year: number;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams({
    month: String(params.month),
    year: String(params.year),
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });
  if (params.search) q.set("search", params.search);
  return hrmBffFetch<{
    data: PayrollRegistryRow[];
    meta: { page: number; pageSize: number; total: number };
    payrollRun: PayrollRun | null;
    period: { month: number; year: number };
  }>(`payroll/registry?${q}`);
}

export function fetchPayrollRuns() {
  return hrmBffFetch<{ data: PayrollRun[] }>("payroll/runs");
}

export function createPayrollRun(month: number, year: number) {
  return hrmBffFetch<PayrollRun>("payroll/runs", {
    method: "POST",
    body: JSON.stringify({ month, year }),
  });
}

export function lockPayrollRun(id: string) {
  return hrmBffFetch(`payroll/runs/${id}/lock`, { method: "POST", body: "{}" });
}

export function fetchPayslips(runId: string) {
  return hrmBffFetch<{ data: PayslipListItem[] }>(`payroll/runs/${runId}/payslips`);
}

export function fetchPayslipById(id: string) {
  return hrmBffFetch<PayslipApi>(`payslips/${id}`);
}

export function fetchPayslipForUser(userId: string, month: number, year: number) {
  const q = new URLSearchParams({ month: String(month), year: String(year) });
  return hrmBffFetch<{
    payslip: PayslipApi | null;
    preview: { calculationBrief: CalculationBrief; net: number; gross: number } | null;
    payrollRun: PayrollRun | null;
    display: PayslipDisplay | null;
  }>(`payroll/users/${userId}/payslip?${q}`);
}

export function fetchEmployeeSalaryForm(userId: string) {
  return hrmBffFetch<{
    hasSalary: boolean;
    salaryForm: SalaryFormPayload | null;
  }>(`employees/${userId}/salary`);
}

export function upsertEmployeeSalary(userId: string, body: SalaryFormPayload) {
  return hrmBffFetch(`employees/${userId}/salary`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function fetchPayrollPreview(userId: string, month: number, year: number) {
  const q = new URLSearchParams({ month: String(month), year: String(year) });
  return hrmBffFetch<{ calculationBrief: CalculationBrief; net: number; gross: number }>(
    `employees/${userId}/payroll-preview?${q}`,
  );
}

export function fetchStatutoryConfig() {
  return hrmBffFetch<Record<string, unknown>>("statutory-config");
}

export function fetchSalaryStructures() {
  return hrmBffFetch<{ data: unknown[] }>("salary-structures");
}
