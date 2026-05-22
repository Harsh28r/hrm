export type PayListStatus = "paid" | "unpaid";

/** Earning / deduction line amounts for add & edit salary modals. */
export type SalaryBreakdown = {
  basic: number;
  da: number;
  ta: number;
  ma: number;
  ba: number;
  others: number;
  pf: number;
  sd: number;
  pl: number;
  el: number;
};

export type PayListRow = {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  email: string;
  joiningDate: string;
  salaryMonthly: number;
  status: PayListStatus;
  avatarInitials: string;
  salaryBreakdown?: SalaryBreakdown;
};

export function monthlyFromBreakdown(b: SalaryBreakdown): number {
  const earnings = b.basic + b.da + b.ta + b.ma + b.ba + b.others;
  const deductions = b.pf + b.sd + b.pl + b.el;
  return Math.max(0, Math.round(earnings - deductions));
}

/** Approximate split when editing legacy rows without stored breakdown. */
export function estimateBreakdownFromMonthly(monthly: number): SalaryBreakdown {
  const gross = Math.round(monthly / 0.84);
  return {
    basic: Math.round(gross * 0.55),
    da: Math.round(gross * 0.1),
    ta: Math.round(gross * 0.08),
    ma: Math.round(gross * 0.05),
    ba: Math.round(gross * 0.04),
    others: Math.max(0, gross - Math.round(gross * 0.82)),
    pf: Math.round(gross * 0.06),
    sd: Math.round(gross * 0.03),
    pl: Math.round(gross * 0.04),
    el: Math.round(gross * 0.03),
  };
}

export function breakdownToFormStrings(
  row: PayListRow,
): Record<keyof SalaryBreakdown, string> & { employeeId: string } {
  const b = row.salaryBreakdown ?? estimateBreakdownFromMonthly(row.salaryMonthly);
  return {
    employeeId: row.id,
    basic: String(b.basic),
    da: String(b.da),
    ta: String(b.ta),
    ma: String(b.ma),
    ba: String(b.ba),
    others: String(b.others),
    pf: String(b.pf),
    sd: String(b.sd),
    pl: String(b.pl),
    el: String(b.el),
  };
}

export type PayslipLine = {
  code: string;
  title: string;
  type: string;
  amount: number;
};

export type PayslipDetail = {
  id: string;
  payslipNo: string;
  date: string;
  dateDue: string;
  employee: {
    name: string;
    position: string;
    department: string;
    email: string;
    phone: string;
  };
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  payment: {
    method: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  rebate: number;
};

export const PAY_LIST_MOCK: PayListRow[] = [
  {
    id: "1",
    employeeId: "DY-MZ-114",
    name: "Ethan Mitchell",
    designation: "Business Intelligence Analyst",
    email: "ethan.mitchell@deltayards.com",
    joiningDate: "Jan 14 2024",
    salaryMonthly: 4500,
    status: "paid",
    avatarInitials: "EM",
  },
  {
    id: "2",
    employeeId: "DY-MZ-115",
    name: "John Smith",
    designation: "Data Scientist",
    email: "john.smith@deltayards.com",
    joiningDate: "Feb 02 2024",
    salaryMonthly: 5200,
    status: "unpaid",
    avatarInitials: "JS",
  },
  {
    id: "3",
    employeeId: "DY-MZ-116",
    name: "Priya Sharma",
    designation: "Sales Manager",
    email: "priya.sharma@deltayards.com",
    joiningDate: "Mar 18 2023",
    salaryMonthly: 4800,
    status: "paid",
    avatarInitials: "PS",
  },
  {
    id: "4",
    employeeId: "DY-MZ-117",
    name: "Aisha Khan",
    designation: "HR Executive",
    email: "aisha.khan@deltayards.com",
    joiningDate: "Jun 09 2022",
    salaryMonthly: 3900,
    status: "unpaid",
    avatarInitials: "AK",
  },
  {
    id: "5",
    employeeId: "DY-MZ-118",
    name: "Dev Patel",
    designation: "Field Associate",
    email: "dev.patel@deltayards.com",
    joiningDate: "Aug 21 2024",
    salaryMonthly: 3200,
    status: "paid",
    avatarInitials: "DP",
  },
  {
    id: "6",
    employeeId: "DY-MZ-119",
    name: "Elena Rossi",
    designation: "Finance Analyst",
    email: "elena.rossi@deltayards.com",
    joiningDate: "Nov 03 2021",
    salaryMonthly: 5100,
    status: "unpaid",
    avatarInitials: "ER",
  },
  {
    id: "7",
    employeeId: "DY-MZ-120",
    name: "Marcus Johnson",
    designation: "Operations Lead",
    email: "marcus.johnson@deltayards.com",
    joiningDate: "Apr 27 2020",
    salaryMonthly: 5500,
    status: "paid",
    avatarInitials: "MJ",
  },
  {
    id: "8",
    employeeId: "DY-MZ-121",
    name: "Sofia Nguyen",
    designation: "Marketing Specialist",
    email: "sofia.nguyen@deltayards.com",
    joiningDate: "Dec 11 2023",
    salaryMonthly: 4100,
    status: "paid",
    avatarInitials: "SN",
  },
];

const BASE_PAYSLIP: Omit<PayslipDetail, "id" | "payslipNo" | "employee"> = {
  date: "2026-04-30",
  dateDue: "2026-05-05",
  earnings: [
    { code: "BS", title: "Basic Salary", type: "Fixed", amount: 1200 },
    { code: "DA", title: "Dearness Allowance", type: "Fixed", amount: 200 },
    { code: "TA", title: "Transport Allowance", type: "Fixed", amount: 150 },
    { code: "MA", title: "Mobile Allowance", type: "As per need", amount: 100 },
    { code: "OT", title: "OverTime", type: "As per need", amount: 120 },
    { code: "BN", title: "Bonus", type: "Percentage", amount: 80 },
    { code: "OP", title: "Other Payment", type: "As per need", amount: 0 },
  ],
  deductions: [
    { code: "PF", title: "Provident Fund", type: "Fixed", amount: 120 },
    { code: "PL", title: "Personal Loan", type: "As per need", amount: 80 },
    { code: "SD", title: "Security Deposit", type: "Fixed", amount: 50 },
    { code: "EL", title: "Early Leaving", type: "As per need", amount: 50 },
  ],
  payment: {
    method: "Bank account",
    accountName: "Employee",
    accountNumber: "3456 **** **** **34",
    bankName: "DeltaYards Partner Bank",
  },
  rebate: 0,
};

export function getPayslipForEmployee(row: PayListRow): PayslipDetail {
  const gross = row.salaryMonthly;
  const scale = gross / 1850;
  return {
    id: row.id,
    payslipNo: row.employeeId.replace("DY-", ""),
    employee: {
      name: row.name,
      position: row.designation,
      department: "People & Operations",
      email: row.email,
      phone: "+91 98 0000 0000",
    },
    ...BASE_PAYSLIP,
    earnings: BASE_PAYSLIP.earnings.map((e, i) =>
      i === 0 ? { ...e, amount: Math.round(gross * 0.55) } : { ...e, amount: Math.round(e.amount * scale) },
    ),
    deductions: BASE_PAYSLIP.deductions.map((d) => ({
      ...d,
      amount: Math.round(d.amount * scale),
    })),
    payment: {
      ...BASE_PAYSLIP.payment,
      accountName: row.name,
    },
    rebate: 0,
  };
}

export function payslipTotals(slip: PayslipDetail) {
  const gross = slip.earnings.reduce((s, e) => s + e.amount, 0);
  const deduct = slip.deductions.reduce((s, d) => s + d.amount, 0);
  const net = gross - deduct - slip.rebate;
  return { gross, deduct, net };
}

export const PAY_LIST_STATS = {
  totalEmployees: 8450,
  totalPaid: 950,
  totalUnpaid: 3130,
  totalLeave: 55,
};
