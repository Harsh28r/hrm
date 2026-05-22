"use client";

import {
  Calculator,
  Eye,
  Lock,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { en } from "@/shared/i18n";
import {
  createPayrollRun,
  fetchPayrollRegistry,
  lockPayrollRun,
  fetchPayrollPreview,
  type PayrollRun,
} from "@/entities/payroll";
import { fetchEmployees } from "@/entities/employee";
import type { CalculationBrief } from "@/features/payroll/model/payroll-types";
import { registryToPayListRow, type PayListRowUi } from "@/features/payroll/lib/registry-mapper";
import { StatCard } from "@/widgets/hrm-dashboard/ui/stat-card";
import { AttendanceLogPagination } from "@/widgets/employee-attendance/ui/attendance-log-pagination";
import { EmployeeSalaryModal } from "@/widgets/payroll/ui/employee-salary-modal";
import { SalaryCalculationBriefModal } from "@/widgets/payroll/ui/salary-calculation-brief-modal";

const PAGE_SIZES = [10, 25, 50] as const;

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ status }: { status: PayListRowUi["status"] }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex min-w-[4.5rem] justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        paid
          ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          : "bg-sky-500/12 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
      }`}
    >
      {paid ? en.payroll.statusPaid : en.payroll.statusUnpaid}
    </span>
  );
}

export function PayListView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<PayListRowUi[]>([]);
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [metaTotal, setMetaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [salaryModalMode, setSalaryModalMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<PayListRowUi | null>(null);
  const [allEmployees, setAllEmployees] = useState<
    Array<{ id: string; label: string; designation: string; email: string }>
  >([]);

  const [briefOpen, setBriefOpen] = useState(false);
  const [briefName, setBriefName] = useState("");
  const [brief, setBrief] = useState<CalculationBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPayrollRegistry({
        month,
        year,
        page,
        limit: pageSize,
        search: search.trim() || undefined,
      });
      setRows(res.data.map(registryToPayListRow));
      setMetaTotal(res.meta.total);
      setPayrollRun(res.payrollRun);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [month, year, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchEmployees({ limit: 500 });
        setAllEmployees(
          res.data.map((e) => ({
            id: e.id,
            label: e.fullName,
            designation: e.jobTitle || "—",
            email: e.email || "",
          })),
        );
      } catch {
        /* registry rows still usable */
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const paid = rows.filter((r) => r.status === "paid").length;
    const unpaid = rows.filter((r) => r.status === "unpaid").length;
    const withSalary = rows.filter((r) => r.hasSalaryStructure).length;
    return { paid, unpaid, withSalary, total: metaTotal };
  }, [rows, metaTotal]);

  const totalPages = Math.max(1, Math.ceil(metaTotal / pageSize));
  const safePage = Math.min(page, totalPages);

  const employeeOptions = useMemo(() => {
    const inRegistry = new Set(rows.map((r) => r.id));
    const extra = allEmployees.filter((e) => !inRegistry.has(e.id));
    return [
      ...rows.map((r) => ({
        id: r.id,
        label: r.name,
        designation: r.designation,
        email: r.email,
      })),
      ...extra,
    ];
  }, [rows, allEmployees]);

  const openBrief = async (row: PayListRowUi) => {
    setBriefName(row.name);
    setBriefOpen(true);
    setBriefLoading(true);
    setBriefError(null);
    setBrief(null);
    try {
      const res = await fetchPayrollPreview(row.id, month, year);
      setBrief(res.calculationBrief);
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setBriefLoading(false);
    }
  };

  const generatePayroll = async () => {
    try {
      setActionLoading(true);
      await createPayrollRun(month, year);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setActionLoading(false);
    }
  };

  const lockRun = async () => {
    if (!payrollRun?._id) return;
    try {
      setActionLoading(true);
      await lockPayrollRun(payrollRun._id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setActionLoading(false);
    }
  };

  const paginationLabels = {
    showing: en.attendance.paginationShowing,
    rangeSep: en.attendance.paginationRangeSep,
    ofTotal: en.attendance.paginationOfTotal,
    perPage: en.attendance.paginationPerPage,
    first: en.attendance.paginationFirst,
    prev: en.attendance.paginationPrev,
    next: en.attendance.paginationNext,
    last: en.attendance.paginationLast,
    page: en.attendance.paginationPage,
    ofPages: en.attendance.paginationOfPages,
  };

  const periodLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[13px] font-medium text-primary">{en.nav.home}</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-heading">
            {en.payroll.payListTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-fg-muted">{en.payroll.payListSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[12px] text-fg-muted">
            {en.payroll.payrollPeriod}
            <select
              className="ui-field ml-2 h-9 rounded-[8px] px-2 text-[13px]"
              value={month}
              onChange={(e) => {
                setMonth(+e.target.value);
                setPage(1);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleDateString("en-US", { month: "short" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="ui-field ml-2 h-9 w-20 rounded-[8px] px-2 text-[13px]"
              value={year}
              onChange={(e) => {
                setYear(+e.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            type="button"
            disabled={actionLoading || payrollRun?.status === "locked"}
            onClick={() => void generatePayroll()}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-[13px] font-semibold text-heading hover:bg-chrome disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {en.payroll.generatePayroll}
          </button>
          {payrollRun?.status === "draft" ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void lockRun()}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-4 text-[13px] font-semibold text-amber-800 dark:text-amber-200"
            >
              <Lock className="h-4 w-4" />
              {en.payroll.lockPayroll}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setSalaryModalMode("add");
              setEditingRow(null);
              setSalaryModalOpen(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-5 text-[13px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {en.payroll.create}
          </button>
        </div>
      </div>

      <p className="text-[13px] text-fg-muted">
        {periodLabel}
        {" · "}
        {payrollRun
          ? payrollRun.status === "locked"
            ? en.payroll.payrollRunLocked
            : en.payroll.payrollRunDraft
          : en.payroll.payrollRunNone}
      </p>

      {error ? (
        <p className="rounded-[10px] border border-rose-300/60 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <EmployeeSalaryModal
        open={salaryModalOpen}
        mode={salaryModalMode}
        editingRow={editingRow}
        onClose={() => {
          setSalaryModalOpen(false);
          setEditingRow(null);
        }}
        employees={employeeOptions}
        onSaved={() => void load()}
      />

      <SalaryCalculationBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        employeeName={briefName}
        brief={brief}
        loading={briefLoading}
        error={briefError}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={en.payroll.statTotalEmployees}
          value={stats.total.toLocaleString()}
          icon={<Settings className="h-[26px] w-[26px]" strokeWidth={1.75} />}
          tone="teal"
        />
        <StatCard
          title={en.payroll.statTotalPaid}
          value={stats.paid.toLocaleString()}
          icon={<ShieldCheck className="h-[26px] w-[26px]" strokeWidth={1.75} />}
          tone="blue"
        />
        <StatCard
          title={en.payroll.statTotalUnpaid}
          value={stats.unpaid.toLocaleString()}
          icon={<UserRound className="h-[26px] w-[26px]" strokeWidth={1.75} />}
          tone="amber"
        />
        <StatCard
          title="With salary structure"
          value={String(stats.withSalary)}
          icon={<Users className="h-[26px] w-[26px]" strokeWidth={1.75} />}
          tone="rose"
        />
      </section>

      <section className="overflow-hidden rounded-[14px] border border-border/90 bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex items-center gap-2 text-[13px] text-fg-muted">
            <span>{en.payroll.showEntries}</span>
            <select
              className="ui-field h-9 rounded-[8px] px-2 text-[13px] font-medium text-heading"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={en.payroll.searchPlaceholder}
              className="ui-field h-10 w-full rounded-[10px] pl-9 pr-3 text-[13px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-6 py-8 text-[13px] text-fg-muted">Loading…</p>
          ) : (
            <table className="w-full min-w-[960px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[var(--table-header-bg)] text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
                  <th className="px-5 py-3.5">{en.payroll.colEmployeeId}</th>
                  <th className="px-5 py-3.5">{en.payroll.colEmployeeName}</th>
                  <th className="px-5 py-3.5">{en.payroll.colDesignation}</th>
                  <th className="px-5 py-3.5">{en.payroll.colEmail}</th>
                  <th className="px-5 py-3.5">{en.payroll.colJoiningDate}</th>
                  <th className="px-5 py-3.5">{en.payroll.colSalary}</th>
                  <th className="px-5 py-3.5">{en.payroll.colStatus}</th>
                  <th className="px-5 py-3.5 text-center">{en.payroll.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--table-divider)] hover:bg-[var(--table-row-hover)]"
                  >
                    <td className="px-5 py-3 font-medium tabular-nums text-heading">{row.employeeId}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {row.avatarInitials}
                        </span>
                        <span className="font-medium text-heading">{row.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3 text-fg-muted">{row.designation}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-fg-muted">{row.email}</td>
                    <td className="px-5 py-3 tabular-nums text-fg-muted">{row.joiningDate}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-heading">
                      {row.hasSalaryStructure ? formatInr(row.salaryMonthly) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/payroll/payslip/${row.id}?month=${month}&year=${year}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary hover:bg-primary/20"
                          title={en.payroll.actionView}
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void openBrief(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 hover:bg-violet-500/20 dark:text-violet-300"
                          title={en.payroll.actionSalaryBrief}
                        >
                          <Calculator className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSalaryModalMode("edit");
                            setEditingRow(row);
                            setSalaryModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                          title={en.payroll.actionEdit}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AttendanceLogPagination
          page={safePage}
          totalPages={totalPages}
          total={metaTotal}
          pageSize={pageSize}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          labels={paginationLabels}
        />
      </section>
    </div>
  );
}
