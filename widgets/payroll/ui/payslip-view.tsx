"use client";

import { Calculator, Download, Printer, Save, Send } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { en } from "@/shared/i18n";
import { fetchPayslipForUser } from "@/entities/payroll";
import type { CalculationBrief, PayslipApi, PayslipDisplay } from "@/features/payroll/model/payroll-types";
import { SalaryCalculationBriefModal } from "@/widgets/payroll/ui/salary-calculation-brief-modal";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n);
}

type LineRow = { code: string; title: string; type: string; amount: number };

function mapLines(record: Record<string, number> | undefined, prefix: string): LineRow[] {
  if (!record) return [];
  return Object.entries(record)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([name, amount], i) => ({
      code: `${prefix}${i + 1}`,
      title: name,
      type: "Fixed",
      amount,
    }));
}

function LineTable({
  title,
  rows,
  totalLabel,
  total,
}: {
  title: string;
  rows: LineRow[];
  totalLabel: string;
  total: number;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border/80">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-[var(--table-header-bg)] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            <th className="px-4 py-3">{title}</th>
            <th className="px-4 py-3">{en.payroll.payslipColTitle}</th>
            <th className="px-4 py-3 text-right">{en.payroll.payslipColAmount}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-t border-[var(--table-divider)]">
              <td className="px-4 py-2.5 font-medium text-heading">{row.code}</td>
              <td className="px-4 py-2.5 text-fg-muted">{row.title}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-heading">
                {formatMoney(row.amount)}
              </td>
            </tr>
          ))}
          <tr className="border-t border-border/90 bg-chrome/50 font-semibold dark:bg-white/[0.04]">
            <td colSpan={2} className="px-4 py-3 text-right text-heading">
              {totalLabel}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-heading">{formatMoney(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  userId: string;
};

export function PayslipView({ userId }: Props) {
  const searchParams = useSearchParams();
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payslip, setPayslip] = useState<PayslipApi | null>(null);
  const [display, setDisplay] = useState<PayslipDisplay | null>(null);
  const [brief, setBrief] = useState<CalculationBrief | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPayslipForUser(userId, month, year);
      setDisplay(res.display ?? res.payslip?.display ?? null);

      if (res.payslip) {
        setPayslip(res.payslip);
        setBrief(res.payslip.calculationBrief ?? null);
        setIsPreview(false);
      } else if (res.preview) {
        setPayslip({
          _id: "",
          month,
          year,
          payableDays: res.preview.calculationBrief.attendance.payableDays,
          calendarDays: res.preview.calculationBrief.attendance.calendarDays,
          lopDays: res.preview.calculationBrief.deductions.lopDays,
          earnings: res.preview.calculationBrief.earnings.prorated,
          deductions: {
            ...res.preview.calculationBrief.deductions.fixedProrated,
            pfEmployee: res.preview.calculationBrief.deductions.statutory.pfEmployee,
            esiEmployee: res.preview.calculationBrief.deductions.statutory.esiEmployee,
            pt: res.preview.calculationBrief.deductions.statutory.pt,
            tds: res.preview.calculationBrief.deductions.statutory.tds,
          },
          gross: res.preview.gross,
          net: res.preview.net,
          statutory: res.preview.calculationBrief.deductions.statutory,
        });
        setBrief(res.preview.calculationBrief);
        setIsPreview(true);
      } else {
        setPayslip(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [userId, month, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const earnings = useMemo(() => mapLines(payslip?.earnings, "E"), [payslip]);
  const deductions = useMemo(() => {
    const d = payslip?.deductions || {};
    const lines = mapLines(
      Object.fromEntries(
        Object.entries(d).filter(([k]) => k !== "lopDays" && !k.endsWith("Employee")),
      ),
      "D",
    );
    const stat = payslip?.statutory;
    if (stat?.pfEmployee)
      lines.push({ code: "PF", title: "Provident Fund", type: "Statutory", amount: stat.pfEmployee });
    if (stat?.esiEmployee)
      lines.push({ code: "ESI", title: "ESI", type: "Statutory", amount: stat.esiEmployee });
    if (stat?.pt) lines.push({ code: "PT", title: "Professional Tax", type: "Statutory", amount: stat.pt });
    if (stat?.tds) lines.push({ code: "TDS", title: "TDS", type: "Statutory", amount: stat.tds });
    return lines;
  }, [payslip]);

  const gross = payslip?.gross ?? 0;
  const deduct = deductions.reduce((s, r) => s + r.amount, 0);
  const net = payslip?.net ?? 0;

  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading) return <p className="text-fg-muted">Loading…</p>;
  if (error) return <p className="text-rose-600">{error}</p>;
  if (!payslip || !display) return <p className="text-fg-muted">{en.payroll.salaryBriefNoData}</p>;

  const emp = display.employee;
  const pay = display.payment;
  const co = display.company;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-primary">
            <Link href="/payroll/list" className="hover:underline">
              {en.payroll.payListTitle}
            </Link>
            <span className="mx-2 text-fg-subtle">/</span>
            {en.payroll.payslipTitle}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-heading">
            {en.payroll.payslipTitle}
          </h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            {emp.name} · {display.payslipNo} · {periodLabel}
            {isPreview ? ` · ${en.payroll.payslipNoRun}` : ""}
          </p>
          <p className="mt-1 text-[12px] text-fg-muted">{en.payroll.payslipFromAttendance}</p>
        </div>
        <button
          type="button"
          onClick={() => setBriefOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-violet-500/40 bg-violet-500/10 px-4 text-[13px] font-semibold text-violet-700 dark:text-violet-200"
        >
          <Calculator className="h-4 w-4" />
          {en.payroll.actionSalaryBrief}
        </button>
      </div>

      <SalaryCalculationBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        employeeName={emp.name}
        brief={brief}
      />

      <article className="overflow-hidden rounded-[14px] border border-border/90 bg-surface shadow-[var(--shadow-card)]">
        <header className="grid gap-6 border-b border-border/90 px-6 py-8 lg:grid-cols-3 lg:items-start">
          <div>
            <p className="text-[20px] font-bold tracking-tight text-primary">{co.name}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
              {co.address}
              {co.email ? (
                <>
                  <br />
                  {co.email}
                </>
              ) : null}
              {co.phone ? (
                <>
                  <br />
                  {co.phone}
                </>
              ) : null}
            </p>
          </div>
          <h2 className="text-center text-[18px] font-semibold uppercase tracking-[0.2em] text-heading lg:pt-2">
            {en.payroll.payslipDocTitle}
          </h2>
          <div className="text-right text-[13px] lg:justify-self-end">
            <p className="font-semibold text-heading">
              {en.payroll.payslipNo} {display.payslipNo}
            </p>
            <p className="mt-2 text-fg-muted">
              {en.payroll.payslipDate}: <span className="text-heading">{display.issueDate}</span>
            </p>
            <p className="text-fg-muted">
              {en.payroll.payslipDue}: <span className="text-heading">{display.dueDate}</span>
            </p>
            <p className="mt-2 text-fg-muted">
              {en.payroll.salaryBriefPayable}:{" "}
              <span className="text-heading">
                {payslip.payableDays} / {payslip.calendarDays}
              </span>
              {" · "}LOP: <span className="text-heading">{payslip.lopDays}</span>
            </p>
          </div>
        </header>

        <section className="border-b border-border/90 px-6 py-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {en.payroll.payslipBillingAddress}
          </h3>
          <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
            <p>
              <span className="text-fg-muted">{en.payroll.payslipName}: </span>
              <span className="font-medium text-heading">{emp.name}</span>
            </p>
            <p>
              <span className="text-fg-muted">{en.payroll.colEmployeeId}: </span>
              <span className="text-heading">{emp.employeeCode}</span>
            </p>
            <p>
              <span className="text-fg-muted">{en.payroll.payslipPosition}: </span>
              <span className="text-heading">{emp.position}</span>
            </p>
            <p>
              <span className="text-fg-muted">{en.payroll.payslipDepartment}: </span>
              <span className="text-heading">{emp.department}</span>
            </p>
            {emp.joiningDate ? (
              <p>
                <span className="text-fg-muted">{en.payroll.colJoiningDate}: </span>
                <span className="text-heading">{emp.joiningDate}</span>
              </p>
            ) : null}
            <p>
              <span className="text-fg-muted">{en.payroll.payslipContact}: </span>
              <span className="text-heading">
                {[emp.email, emp.mobile].filter(Boolean).join(" · ") || "—"}
              </span>
            </p>
            {emp.pan ? (
              <p>
                <span className="text-fg-muted">PAN: </span>
                <span className="text-heading">{emp.pan}</span>
              </p>
            ) : null}
            {emp.uan ? (
              <p>
                <span className="text-fg-muted">UAN: </span>
                <span className="text-heading">{emp.uan}</span>
              </p>
            ) : null}
          </div>
        </section>

        <section className="space-y-6 px-6 py-6">
          <LineTable
            title={en.payroll.payslipEarning}
            rows={earnings}
            totalLabel={en.payroll.payslipTotalEarnings}
            total={gross}
          />
          <LineTable
            title={en.payroll.payslipDeduction}
            rows={deductions}
            totalLabel={en.payroll.payslipTotalDeductions}
            total={deduct}
          />
        </section>

        <footer className="grid gap-8 border-t border-border/90 px-6 py-8 lg:grid-cols-2">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
              {en.payroll.payslipPaymentDetails}
            </h3>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex gap-2">
                <dt className="min-w-[7rem] text-fg-muted">{en.payroll.payslipPaymentMethod}:</dt>
                <dd className="text-heading">{pay.method || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[7rem] text-fg-muted">{en.payroll.payslipAccountName}:</dt>
                <dd className="text-heading">{pay.accountName || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="min-w-[7rem] text-fg-muted">{en.payroll.payslipAccountNo}:</dt>
                <dd className="font-mono text-heading">{pay.accountNumber || "—"}</dd>
              </div>
              {pay.ifsc ? (
                <div className="flex gap-2">
                  <dt className="min-w-[7rem] text-fg-muted">IFSC:</dt>
                  <dd className="font-mono text-heading">{pay.ifsc}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="min-w-[7rem] text-fg-muted">{en.payroll.payslipBank}:</dt>
                <dd className="text-heading">{pay.bankName || "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="lg:justify-self-end lg:text-right">
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-8 lg:justify-end">
                <dt className="font-semibold text-heading">{en.payroll.payslipPayable}</dt>
                <dd className="text-[18px] font-bold tabular-nums text-primary">{formatMoney(net)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap justify-end gap-2 opacity-60">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-cyan-500/90 px-4 text-[12px] font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                {en.payroll.actionPrint}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-600 px-4 text-[12px] font-semibold text-white"
              >
                <Save className="h-3.5 w-3.5" />
                {en.payroll.actionSave}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-amber-500 px-4 text-[12px] font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                {en.payroll.actionDownload}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-violet-600 px-4 text-[12px] font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                {en.payroll.actionSend}
              </button>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
