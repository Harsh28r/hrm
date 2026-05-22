import type { SalaryBreakdown } from "@/features/payroll/model/mock-payroll-ui";
import type { PayrollRegistryRow, SalaryFormPayload } from "@/features/payroll/model/payroll-types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

export function salaryFormToBreakdown(form: SalaryFormPayload): SalaryBreakdown {
  return {
    basic: form.basic,
    da: form.da,
    ta: form.ta,
    ma: form.ma,
    ba: form.ba,
    others: form.others,
    pf: 0,
    sd: form.sd,
    pl: form.pl,
    el: form.el,
  };
}

export function salaryFormToStrings(form: SalaryFormPayload | null): Record<string, string> {
  if (!form) {
    return {
      basic: "",
      da: "",
      ta: "",
      ma: "",
      ba: "",
      others: "",
      pf: "",
      sd: "",
      pl: "",
      el: "",
    };
  }
  return {
    basic: String(form.basic || ""),
    da: String(form.da || ""),
    ta: String(form.ta || ""),
    ma: String(form.ma || ""),
    ba: String(form.ba || ""),
    others: String(form.others || ""),
    pf: "",
    sd: String(form.sd || ""),
    pl: String(form.pl || ""),
    el: String(form.el || ""),
  };
}

export type PayListRowUi = PayrollRegistryRow & {
  avatarInitials: string;
  salaryBreakdown?: SalaryBreakdown;
};

export function registryToPayListRow(row: PayrollRegistryRow): PayListRowUi {
  return {
    ...row,
    avatarInitials: initials(row.name),
    salaryBreakdown: row.salaryForm ? salaryFormToBreakdown(row.salaryForm) : undefined,
  };
}
