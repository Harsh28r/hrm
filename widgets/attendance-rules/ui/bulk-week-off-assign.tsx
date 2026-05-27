"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { en } from "@/shared/i18n";
import { isApiConfigured } from "@/shared/config";
import {
  bulkAssignWeekOff,
  fetchWeekOffRoster,
  type WeekOffRosterEmployee,
} from "@/entities/employee/api/week-off-bulk-queries";
const WEEK_DAYS: { value: number; label: string }[] = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function formatDays(days: number[]) {
  return (
    days
      .map((d) => WEEK_DAYS.find((w) => w.value === d)?.label ?? String(d))
      .join(", ") || "—"
  );
}

export function BulkWeekOffAssign() {
  const apiReady = isApiConfigured();
  const [assignDays, setAssignDays] = useState<number[]>([0]);
  const [useCompanyDefault, setUseCompanyDefault] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<WeekOffRosterEmployee[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [companyWeekOff, setCompanyWeekOff] = useState<number[]>([0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!apiReady) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWeekOffRoster({
        projectId: projectFilter === "all" ? undefined : projectFilter,
        search: search.trim() || undefined,
      });
      setEmployees(res.employees);
      setProjects(res.projects);
      setCompanyWeekOff(res.companyWeekOffDays ?? [0]);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [apiReady, projectFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const filtered = employees;

  const allSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleDay = (day: number) => {
    setUseCompanyDefault(false);
    setAssignDays((prev) => {
      const set = new Set(prev);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return [...set].sort((a, b) => a - b);
    });
  };

  const toggleEmployee = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((e) => e.id)));
  };

  const apply = async () => {
    if (selected.size === 0) {
      setError(en.attendance.rules.bulkWeekOffSelectEmployees);
      return;
    }
    if (!useCompanyDefault && assignDays.length === 0) {
      setError(en.attendance.rules.bulkWeekOffSelectDays);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await bulkAssignWeekOff({
        userIds: [...selected],
        fixedWeekdays: assignDays,
        useCompanyDefault,
      });
      setSuccess(
        en.attendance.rules.bulkWeekOffSuccess.replace("{count}", String(res.updated)),
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  const assignPreview = useMemo(() => {
    if (useCompanyDefault) return formatDays(companyWeekOff) + " (company default)";
    return formatDays(assignDays);
  }, [useCompanyDefault, assignDays, companyWeekOff]);

  return (
    <div className="mt-8 border-t border-border/90 pt-6">
      <h3 className="text-[14px] font-semibold text-heading">
        {en.attendance.rules.bulkWeekOffTitle}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
        {en.attendance.rules.bulkWeekOffHint}
      </p>
      <p className="mt-2 text-[12px]">
        <Link
          href="/attendance/week-off-swaps"
          className="font-semibold text-primary hover:underline"
        >
          {en.nav.attendanceWeekOffSwaps}
        </Link>
        {" — "}
        {en.attendance.rules.bulkWeekOffSwapLinkHint}
      </p>

      {error ? (
        <p className="mt-3 text-[13px] text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-3 text-[13px] font-medium text-primary">{success}</p>
      ) : null}

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
        {en.attendance.rules.bulkWeekOffDaysLabel}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-fg-muted">
          <input
            type="checkbox"
            checked={useCompanyDefault}
            onChange={(e) => setUseCompanyDefault(e.target.checked)}
          />
          {en.attendance.rules.bulkWeekOffUseCompany.replace(
            "{days}",
            formatDays(companyWeekOff),
          )}
        </label>
      </div>
      {!useCompanyDefault ? (
        <div className="mt-2 grid grid-cols-7 gap-2">
          {WEEK_DAYS.map(({ value, label }) => {
            const on = assignDays.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                className={`flex h-11 flex-col items-center justify-center rounded-[10px] border text-[11px] font-bold uppercase tracking-wide ${
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-[color:var(--input-border)] bg-[var(--input-bg)] text-fg-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="ui-field h-10 min-w-[160px] normal-case tracking-normal"
        >
          <option value="all">{en.attendance.rules.bulkWeekOffAllProjects}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder={en.attendance.rules.bulkWeekOffSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ui-field h-10 min-w-[200px] flex-1 normal-case tracking-normal"
        />
      </div>

      <div className="mt-4 max-h-[320px] overflow-auto rounded-[12px] border border-border/80">
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0 bg-chrome/90 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="p-2">{en.attendance.rules.bulkWeekOffColEmployee}</th>
              <th className="p-2">{en.attendance.rules.bulkWeekOffColProject}</th>
              <th className="p-2">{en.attendance.rules.bulkWeekOffColCurrent}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-fg-muted">
                  {en.attendance.rules.loading}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-fg-muted">
                  {en.attendance.rules.bulkWeekOffEmpty}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-t border-border/60">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleEmployee(e.id)}
                    />
                  </td>
                  <td className="p-2 font-medium text-heading">
                    {e.name}
                    {e.email ? (
                      <span className="block text-[11px] font-normal text-fg-muted">
                        {e.email}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 text-fg-muted">
                    {e.projects.map((p) => p.name).join(", ") || "—"}
                  </td>
                  <td className="p-2 text-fg-muted">
                    {e.weekOffUsesCompanyDefault
                      ? `Default (${formatDays(e.weekOffDays)})`
                      : formatDays(e.customWeekOffDays)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] text-fg-muted">
        {en.attendance.rules.bulkWeekOffPreview.replace("{days}", assignPreview)} ·{" "}
        {selected.size} selected
      </p>

      <button
        type="button"
        disabled={!apiReady || saving || selected.size === 0}
        onClick={() => void apply()}
        className="mt-3 inline-flex h-10 items-center justify-center rounded-[10px] bg-primary px-5 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        {saving ? en.attendance.rules.saving : en.attendance.rules.bulkWeekOffApply}
      </button>
    </div>
  );
}
