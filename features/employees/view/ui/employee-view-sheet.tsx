"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchEmployeeById, updateEmployeeProfile } from "@/entities/employee";
import { fetchEmployeeSalaryForm, fetchPayrollPreview } from "@/entities/payroll";
import { formatWeekOffDays } from "@/entities/attendance/lib/time-rules";
import { en } from "@/shared/i18n";
import type { CalculationBrief, SalaryFormPayload } from "@/features/payroll/model/payroll-types";
import { registryToPayListRow, type PayListRowUi } from "@/features/payroll/lib/registry-mapper";
import { EmployeeSalaryModal } from "@/widgets/payroll/ui/employee-salary-modal";
import { SalaryCalculationBriefModal } from "@/widgets/payroll/ui/salary-calculation-brief-modal";

const WEEK_DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

type BankDetails = {
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
};

type Profile = {
  employmentType?: string;
  employeeCode?: string;
  department?: string;
  location?: string;
  pan?: string;
  uan?: string;
  bankDetails?: BankDetails;
  weekOffConfig?: { fixedWeekdays?: number[] };
};

type EmployeeDetail = {
  user: { name?: string; email?: string };
  profile: Profile;
  campOff?: { available?: number; credited?: number; consumed?: number };
  weekOffDays?: number[];
  companyWeekOffDays?: number[];
  weekOffUsesCompanyDefault?: boolean;
};

export function EmployeeViewSheet({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({});
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [companyWeekOff, setCompanyWeekOff] = useState<number[]>([0]);
  const [useCompanyWeekOff, setUseCompanyWeekOff] = useState(true);
  const [customWeekOff, setCustomWeekOff] = useState<number[]>([0]);
  const [campOffBalance, setCampOffBalance] = useState(0);
  const [saved, setSaved] = useState(false);
  const [salaryForm, setSalaryForm] = useState<SalaryFormPayload | null>(null);
  const [salaryGross, setSalaryGross] = useState(0);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState<CalculationBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = (await fetchEmployeeById(id)) as EmployeeDetail;
    setUser(res.user);
    setProfile(res.profile || {});
    setCompanyWeekOff(res.companyWeekOffDays ?? [0]);
    setUseCompanyWeekOff(res.weekOffUsesCompanyDefault !== false);
    setCustomWeekOff(res.weekOffDays ?? res.companyWeekOffDays ?? [0]);
    setCampOffBalance(res.campOff?.available ?? 0);
    try {
      const sal = await fetchEmployeeSalaryForm(id);
      setSalaryForm(sal.salaryForm);
      if (sal.salaryForm) {
        const g =
          sal.salaryForm.basic +
          sal.salaryForm.da +
          sal.salaryForm.ta +
          sal.salaryForm.ma +
          sal.salaryForm.ba +
          sal.salaryForm.others;
        setSalaryGross(g);
      } else {
        setSalaryGross(0);
      }
    } catch {
      setSalaryForm(null);
      setSalaryGross(0);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleCustomDay = (day: number) => {
    setCustomWeekOff((prev) => {
      const set = new Set(prev);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return [...set].sort((a, b) => a - b);
    });
  };

  const save = async () => {
    const body: Record<string, unknown> = {
      ...profile,
      weekOffConfig: useCompanyWeekOff
        ? { fixedWeekdays: [] }
        : { fixedWeekdays: customWeekOff },
    };
    await updateEmployeeProfile(id, body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
  };

  const openBrief = async () => {
    const now = new Date();
    setBriefOpen(true);
    setBriefLoading(true);
    setBrief(null);
    try {
      const res = await fetchPayrollPreview(id, now.getMonth() + 1, now.getFullYear());
      setBrief(res.calculationBrief);
    } catch {
      setBrief(null);
    } finally {
      setBriefLoading(false);
    }
  };

  const payListRow: PayListRowUi | null = salaryForm
    ? registryToPayListRow({
        id,
        employeeId: profile.employeeCode || id,
        name: user?.name || "",
        email: user?.email || "",
        designation: profile.department || "—",
        joiningDate: "—",
        salaryMonthly: salaryGross,
        salaryGross,
        hasSalaryStructure: true,
        salaryForm,
        status: "unpaid",
        payslipId: null,
      })
    : null;

  if (loading) return <p className="text-muted">Loading…</p>;

  const effectiveWeekOff = useCompanyWeekOff ? companyWeekOff : customWeekOff;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
      <div>
        <h2 className="text-xl font-semibold">{user?.name || "Employee"}</h2>
        <p className="text-sm text-muted">{user?.email}</p>
        <p className="mt-2 text-[13px] text-fg-muted">
          Camp-off balance: <span className="font-semibold text-heading">{campOffBalance}</span> day
          {campOffBalance === 1 ? "" : "s"} available
        </p>
      </div>

      <section className="rounded-[12px] border border-border/90 bg-chrome/40 p-4">
        <h3 className="text-[15px] font-semibold text-heading">{en.payroll.profileSalaryTitle}</h3>
        {salaryForm ? (
          <p className="mt-2 text-[13px] text-fg-muted">
            {en.payroll.profileSalaryGross}:{" "}
            <span className="font-semibold text-heading">
              ₹{salaryGross.toLocaleString("en-IN")}
            </span>
            <span className="text-fg-subtle"> / month (before attendance proration)</span>
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-fg-muted">{en.payroll.profileSalaryNone}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSalaryModalOpen(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-heading hover:bg-chrome"
          >
            {en.payroll.profileSalaryEdit}
          </button>
          {salaryForm ? (
            <button
              type="button"
              onClick={() => void openBrief()}
              className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-[13px] font-medium text-violet-700 dark:text-violet-200"
            >
              {en.payroll.profileSalaryViewBrief}
            </button>
          ) : null}
          <Link
            href={`/payroll/payslip/${id}`}
            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[13px] font-medium text-primary"
          >
            {en.payroll.actionView}
          </Link>
        </div>
      </section>

      <EmployeeSalaryModal
        open={salaryModalOpen}
        mode={salaryForm ? "edit" : "add"}
        editingRow={payListRow}
        onClose={() => setSalaryModalOpen(false)}
        employees={[
          {
            id,
            label: user?.name || "",
            designation: profile.department || "—",
            email: user?.email || "",
          },
        ]}
        onSaved={() => void load()}
      />

      <SalaryCalculationBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        employeeName={user?.name || ""}
        brief={brief}
        loading={briefLoading}
      />

      <section className="rounded-[12px] border border-border/90 bg-chrome/40 p-4">
        <h3 className="text-[15px] font-semibold text-heading">Scheduled week off</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
          Company default is <strong className="text-heading">{formatWeekOffDays(companyWeekOff)}</strong>.
          Working on those days earns camp-off. Saturday is a normal working day unless you set a custom
          schedule below.
        </p>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={useCompanyWeekOff}
            onChange={(e) => setUseCompanyWeekOff(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          Use company default ({formatWeekOffDays(companyWeekOff)})
        </label>

        {!useCompanyWeekOff ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
              Custom off days for this employee
            </p>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {WEEK_DAYS.map(({ value, label }) => {
                const on = customWeekOff.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleCustomDay(value)}
                    className={`flex h-10 items-center justify-center rounded-[10px] border text-[11px] font-bold ${
                      on
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-fg-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="mt-3 text-[12px] text-fg-muted">
          Effective schedule: <span className="font-medium text-heading">{formatWeekOffDays(effectiveWeekOff)}</span>
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          Type
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.employmentType || "field"}
            onChange={(e) => setProfile((p) => ({ ...p, employmentType: e.target.value }))}
          >
            <option value="field">Field</option>
            <option value="hq">HQ</option>
          </select>
        </label>
        <label className="text-sm">
          Code
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.employeeCode || ""}
            onChange={(e) => setProfile((p) => ({ ...p, employeeCode: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          Department
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.department || ""}
            onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          State (PT)
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.location || ""}
            onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          PAN
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.pan || ""}
            onChange={(e) => setProfile((p) => ({ ...p, pan: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          UAN
          <input
            className="mt-1 w-full rounded border px-2 py-1"
            value={profile.uan || ""}
            onChange={(e) => setProfile((p) => ({ ...p, uan: e.target.value }))}
          />
        </label>
      </div>

      <section className="rounded-[12px] border border-border/90 bg-chrome/40 p-4">
        <h3 className="text-[15px] font-semibold text-heading">{en.payroll.payslipPaymentDetails}</h3>
        <p className="mt-1 text-[12px] text-fg-muted">Used on payslip (name, account, IFSC, bank).</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            {en.payroll.payslipAccountName}
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={profile.bankDetails?.accountHolderName || ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  bankDetails: { ...p.bankDetails, accountHolderName: e.target.value },
                }))
              }
            />
          </label>
          <label className="text-sm">
            {en.payroll.payslipAccountNo}
            <input
              className="mt-1 w-full rounded border px-2 py-1 font-mono"
              value={profile.bankDetails?.accountNumber || ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  bankDetails: { ...p.bankDetails, accountNumber: e.target.value },
                }))
              }
            />
          </label>
          <label className="text-sm">
            IFSC
            <input
              className="mt-1 w-full rounded border px-2 py-1 font-mono uppercase"
              value={profile.bankDetails?.ifsc || ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  bankDetails: { ...p.bankDetails, ifsc: e.target.value.toUpperCase() },
                }))
              }
            />
          </label>
          <label className="text-sm">
            {en.payroll.payslipBank}
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={profile.bankDetails?.bankName || ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  bankDetails: { ...p.bankDetails, bankName: e.target.value },
                }))
              }
            />
          </label>
        </div>
      </section>

      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-white" onClick={() => void save()}>
        Save profile
      </button>
      {saved && <span className="ml-3 text-sm text-green-600">Saved</span>}
    </div>
  );
}
