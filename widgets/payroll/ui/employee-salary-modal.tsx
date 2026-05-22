"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { en } from "@/shared/i18n";
import { upsertEmployeeSalary } from "@/entities/payroll";
import type { SalaryFormPayload } from "@/features/payroll/model/payroll-types";
import { salaryFormToStrings } from "@/features/payroll/lib/registry-mapper";
import type { PayListRowUi } from "@/features/payroll/lib/registry-mapper";

export type SalaryFormValues = {
  employeeId: string;
  basic: string;
  da: string;
  ta: string;
  ma: string;
  ba: string;
  others: string;
  pf: string;
  sd: string;
  pl: string;
  el: string;
};

const EMPTY_FORM: SalaryFormValues = {
  employeeId: "",
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

function parseAmount(raw: string): number {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formToPayload(form: SalaryFormValues): SalaryFormPayload {
  return {
    basic: parseAmount(form.basic),
    da: parseAmount(form.da),
    ta: parseAmount(form.ta),
    ma: parseAmount(form.ma),
    ba: parseAmount(form.ba),
    others: parseAmount(form.others),
    sd: parseAmount(form.sd),
    pl: parseAmount(form.pl),
    el: parseAmount(form.el),
  };
}

type EmployeeOption = { id: string; label: string; designation: string; email: string };

export type EmployeeSalaryModalMode = "add" | "edit";

type Props = {
  open: boolean;
  mode: EmployeeSalaryModalMode;
  onClose: () => void;
  employees: EmployeeOption[];
  editingRow?: PayListRowUi | null;
  onSaved: () => void;
};

const fieldLabel =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted";

function MoneyField({
  id,
  label,
  required,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className={fieldLabel}>
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      <input
        id={id}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="ui-field h-10 w-full rounded-[10px] px-3 text-[13px] tabular-nums text-heading disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="0"
      />
    </label>
  );
}

export function EmployeeSalaryModal({
  open,
  mode,
  onClose,
  employees,
  editingRow,
  onSaved,
}: Props) {
  const isEdit = mode === "edit";
  const titleId = useId();
  const [form, setForm] = useState<SalaryFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editingRow?.salaryForm) {
      const s = salaryFormToStrings(editingRow.salaryForm);
      setForm({
        employeeId: editingRow.id,
        basic: s.basic,
        da: s.da,
        ta: s.ta,
        ma: s.ma,
        ba: s.ba,
        others: s.others,
        pf: s.pf,
        sd: s.sd,
        pl: s.pl,
        el: s.el,
      });
    } else if (isEdit && editingRow) {
      setForm({ ...EMPTY_FORM, employeeId: editingRow.id });
    } else {
      setForm({ ...EMPTY_FORM });
    }
    setError(null);
  }, [open, isEdit, editingRow]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key: keyof SalaryFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      setError(en.payroll.salaryModalEmployeeRequired);
      return;
    }
    if (!form.basic.trim() || parseAmount(form.basic) <= 0) {
      setError(en.payroll.salaryModalBasicRequired);
      return;
    }

    try {
      setSubmitting(true);
      await upsertEmployeeSalary(form.employeeId, formToPayload(form));
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : en.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit ? en.payroll.salaryModalEditTitle : en.payroll.salaryModalTitle;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label={en.payroll.salaryModalClose}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,820px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[16px] border border-border/90 bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border/90 px-6 py-4">
          <h2 id={titleId} className="text-[17px] font-semibold text-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-muted transition-colors hover:bg-chrome hover:text-heading"
            aria-label={en.payroll.salaryModalClose}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="text-[13px] font-semibold text-heading">
                {en.payroll.salaryModalEmployeeSection}
              </h3>
              <label htmlFor="salary-employee" className="mt-3 block">
                <span className={fieldLabel}>
                  {en.payroll.salaryModalEmployeeName}
                  {!isEdit ? <span className="ml-0.5 text-rose-500">*</span> : null}
                </span>
                <select
                  id="salary-employee"
                  value={form.employeeId}
                  disabled={isEdit}
                  onChange={(e) => set("employeeId", e.target.value)}
                  className="ui-field h-10 w-full rounded-[10px] px-3 text-[13px] text-heading disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{en.payroll.salaryModalSelectEmployee}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="mt-6">
              <h3 className="text-[13px] font-semibold text-heading">
                {en.payroll.salaryModalEarningSection}
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <MoneyField
                  id="salary-basic"
                  label={en.payroll.salaryFieldBasic}
                  required
                  value={form.basic}
                  onChange={(v) => set("basic", v)}
                />
                <MoneyField
                  id="salary-da"
                  label={en.payroll.salaryFieldDa}
                  value={form.da}
                  onChange={(v) => set("da", v)}
                />
                <MoneyField
                  id="salary-ta"
                  label={en.payroll.salaryFieldTa}
                  value={form.ta}
                  onChange={(v) => set("ta", v)}
                />
                <MoneyField
                  id="salary-ma"
                  label={en.payroll.salaryFieldMa}
                  value={form.ma}
                  onChange={(v) => set("ma", v)}
                />
                <MoneyField
                  id="salary-ba"
                  label={en.payroll.salaryFieldBa}
                  value={form.ba}
                  onChange={(v) => set("ba", v)}
                />
                <MoneyField
                  id="salary-others"
                  label={en.payroll.salaryFieldOthers}
                  value={form.others}
                  onChange={(v) => set("others", v)}
                />
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-[13px] font-semibold text-heading">
                {en.payroll.salaryModalDeductionSection}
              </h3>
              <p className="mt-1 text-[12px] text-fg-muted">
                PF / ESI / PT / TDS are computed at payroll run from statutory rules and prorated
                attendance.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <MoneyField
                  id="salary-sd"
                  label={en.payroll.salaryFieldSd}
                  value={form.sd}
                  onChange={(v) => set("sd", v)}
                />
                <MoneyField
                  id="salary-pl"
                  label={en.payroll.salaryFieldPl}
                  value={form.pl}
                  onChange={(v) => set("pl", v)}
                />
                <MoneyField
                  id="salary-el"
                  label={en.payroll.salaryFieldEl}
                  value={form.el}
                  onChange={(v) => set("el", v)}
                />
              </div>
            </section>

            {error ? (
              <p className="mt-4 rounded-[10px] border border-rose-300/60 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-200">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-border/90 px-6 py-4">
            <button
              type="submit"
              disabled={submitting}
              className="mx-auto flex h-11 min-w-[140px] items-center justify-center rounded-[10px] bg-primary px-8 text-[14px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "…" : en.payroll.salaryModalSubmit}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
