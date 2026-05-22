import { redirect } from "next/navigation";

/** Payslip tab default — open first mock employee. */
export default function PayslipIndexPage() {
  redirect("/payroll/payslip/1");
}
