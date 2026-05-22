export type SalaryFormPayload = {
  basic: number;
  da: number;
  ta: number;
  ma: number;
  ba: number;
  others: number;
  sd: number;
  pl: number;
  el: number;
};

export type PayrollRegistryRow = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  joiningDate: string;
  salaryMonthly: number;
  salaryGross: number;
  hasSalaryStructure: boolean;
  salaryForm: SalaryFormPayload | null;
  status: "paid" | "unpaid";
  payslipId: string | null;
  payslip?: {
    payableDays: number;
    lopDays: number;
    gross: number;
    net: number;
  } | null;
};

export type CalculationBrief = {
  period: { month: number; year: number };
  attendance: {
    calendarDays: number;
    weekoffs: number;
    holidays: number;
    onLeave: number;
    present: number;
    lop: number;
    payableDays: number;
    formula: string;
    summaryCount?: number;
  };
  proration: {
    factor: number;
    payableDays: number;
    calendarDays: number;
    explanation: string;
  };
  earnings: {
    fullMonth: Record<string, number>;
    prorated: Record<string, number>;
    grossFull: number;
    grossProrated: number;
  };
  deductions: {
    fixedFull: Record<string, number>;
    fixedProrated: Record<string, number>;
    fixedTotal: number;
    statutory: {
      pfEmployee: number;
      esiEmployee: number;
      pt: number;
      tds: number;
      total: number;
    };
    lopDays: number;
  };
  totals: { net: number; netBeforeStatutory: number };
  steps: Array<{ step: number; label: string; detail: string }>;
};

export type PayslipDisplay = {
  payslipNo: string;
  issueDate: string;
  dueDate: string;
  period: { month: number; year: number };
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
  };
  employee: {
    name: string;
    email: string;
    mobile: string;
    position: string;
    department: string;
    employeeCode: string;
    employmentType: string;
    joiningDate: string;
    pan: string;
    uan: string;
  };
  payment: {
    method: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
};

export type PayslipApi = {
  _id: string;
  user?: { name?: string; email?: string; mobile?: string };
  employeeProfile?: { department?: string; employeeCode?: string; bankDetails?: Record<string, string> };
  month: number;
  year: number;
  payableDays: number;
  calendarDays: number;
  lopDays: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  gross: number;
  net: number;
  statutory?: Record<string, number>;
  calculationBrief?: CalculationBrief | null;
  display?: PayslipDisplay | null;
};
