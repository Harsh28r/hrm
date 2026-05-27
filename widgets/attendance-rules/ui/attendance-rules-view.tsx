"use client";

import { CheckCircle2, Clock, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { en } from "@/shared/i18n";
import { isApiConfigured } from "@/shared/config";
import {
  DELTA_ATTENDANCE_PRESET,
  normalizeAttendanceRules,
  updateAttendanceRules,
  validateAttendanceRulesOrder,
  type AttendanceRules,
} from "@/entities/attendance";
import { useAttendanceRules } from "@/features/attendance";
import { AttendanceStatusIcon } from "@/widgets/employee-attendance/ui/attendance-status-icon";
import { BulkWeekOffAssign } from "@/widgets/attendance-rules/ui/bulk-week-off-assign";
import type { AttendanceCellStatus } from "@/entities/attendance/model/grid";

const WEEK_DAYS: { value: number; label: string }[] = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const fieldLabel =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted";

const STATUS_RULES: {
  status: AttendanceCellStatus;
  title: string;
  rule: (r: AttendanceRules) => string;
}[] = [
  {
    status: "holiday",
    title: en.attendance.rules.statusHoliday,
    rule: () => en.attendance.rules.ruleHoliday,
  },
  {
    status: "weekoff",
    title: en.attendance.rules.statusWeekOff,
    rule: (r) =>
      en.attendance.rules.ruleWeekOff.replace(
        "{days}",
        r.weekOffDays.map((d) => WEEK_DAYS.find((w) => w.value === d)?.label ?? String(d)).join(", ") ||
          "—",
      ),
  },
  {
    status: "present",
    title: en.attendance.rules.statusPresent,
    rule: (r) =>
      en.attendance.rules.rulePresent
        .replace("{firstStart}", r.firstHalfStart)
        .replace("{firstEnd}", r.firstHalfEnd)
        .replace("{late}", r.lateAfter)
        .replace("{expectedIn}", r.expectedCheckIn)
        .replace("{expectedOut}", r.expectedCheckOut)
        .replace("{halfDayOut}", r.halfDayCheckoutBefore)
        .replace("{minHours}", String(r.minimumWorkingHours)),
  },
  {
    status: "late",
    title: en.attendance.rules.statusLate,
    rule: (r) =>
      en.attendance.rules.ruleLate
        .replace("{late}", r.lateAfter)
        .replace("{firstStart}", r.firstHalfStart)
        .replace("{firstEnd}", r.firstHalfEnd),
  },
  {
    status: "half_day",
    title: en.attendance.rules.statusHalfDay,
    rule: (r) =>
      en.attendance.rules.ruleHalfDay
        .replace("{firstStart}", r.firstHalfStart)
        .replace("{firstEnd}", r.firstHalfEnd)
        .replace("{secondStart}", r.secondHalfStart)
        .replace("{secondEnd}", r.secondHalfEnd)
        .replace("{expectedOut}", r.expectedCheckOut)
        .replace("{halfDayOut}", r.halfDayCheckoutBefore)
        .replace("{fullHours}", String(r.minimumWorkingHours))
        .replace("{halfHours}", String(r.halfDayMaxHours)),
  },
  {
    status: "absent",
    title: en.attendance.rules.statusAbsent,
    rule: (r) => en.attendance.rules.ruleAbsent.replace("{absentAfter}", r.absentAfterCheckIn),
  },
  {
    status: "on_leave",
    title: en.attendance.rules.statusOnLeave,
    rule: () => en.attendance.rules.ruleOnLeave,
  },
  {
    status: "campoff_earned",
    title: en.attendance.rules.statusCampoffEarned,
    rule: (r) =>
      en.attendance.rules.ruleCampoffEarned.replace(
        "{days}",
        r.weekOffDays
          .map((d) => WEEK_DAYS.find((w) => w.value === d)?.label ?? String(d))
          .join(", ") || "—",
      ),
  },
  {
    status: "campoff_used",
    title: en.attendance.rules.statusCampoffUsed,
    rule: () => en.attendance.rules.ruleCampoffUsed,
  },
];

function RulesSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-[4.25rem] animate-pulse rounded-[12px] bg-chrome/80 dark:bg-white/[0.06]" />
      ))}
    </div>
  );
}

export function AttendanceRulesView() {
  const apiReady = isApiConfigured();
  const { rules: loadedRules, loading, error: loadError } = useAttendanceRules();
  const [rules, setRules] = useState<AttendanceRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loadedRules) setRules(loadedRules);
  }, [loadedRules]);

  const toggleWeekDay = (day: number) => {
    setRules((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.weekOffDays);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, weekOffDays: [...set].sort((a, b) => a - b) };
    });
    setSaved(false);
  };

  const setWorkingHoursField = (key: "halfDayMaxHours" | "minimumWorkingHours", raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(24, Math.max(0, Math.round(n * 100) / 100));
    setRules((r) => (r ? { ...r, [key]: clamped } : r));
    setSaved(false);
  };

  const save = async () => {
    if (!apiReady || !rules) {
      setError(en.attendance.apiBannerTitle);
      return;
    }
    if (
      !Number.isFinite(rules.halfDayMaxHours) ||
      rules.halfDayMaxHours < 0 ||
      !Number.isFinite(rules.minimumWorkingHours) ||
      rules.minimumWorkingHours < 0
    ) {
      setError("Working hours must be 0 or greater.");
      return;
    }
    if (
      rules.halfDayMaxHours > 0 &&
      rules.minimumWorkingHours > 0 &&
      rules.halfDayMaxHours > rules.minimumWorkingHours
    ) {
      setError("Half day minimum hours cannot exceed full day minimum hours.");
      return;
    }
    const orderErr = validateAttendanceRulesOrder(rules);
    if (orderErr) {
      setError(orderErr);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateAttendanceRules(rules);
      setRules(normalizeAttendanceRules(updated));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl animate-[fade-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both] space-y-6">
      <nav className="text-[12px] font-medium text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              {en.nav.home}
            </Link>
          </li>
          <li aria-hidden className="text-fg-subtle">
            /
          </li>
          <li>
            <Link href="/attendance" className="transition-colors hover:text-primary">
              {en.nav.attendance}
            </Link>
          </li>
          <li aria-hidden className="text-fg-subtle">
            /
          </li>
          <li className="font-medium text-heading">{en.attendance.rules.pageTitle}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 border-b border-border/90 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {en.nav.attendance}
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-heading md:text-[30px]">
            {en.attendance.rules.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            {en.attendance.rules.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || loading || !apiReady}
            onClick={() => {
              setRules({ ...DELTA_ATTENDANCE_PRESET });
              setSaved(false);
            }}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-border/90 px-4 text-[13px] font-semibold text-heading hover:bg-chrome/60"
          >
            {en.attendance.rules.applyDeltaPreset}
          </button>
          <button
            type="button"
            disabled={saving || loading || !apiReady}
            onClick={() => void save()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,112,118,0.45)] transition-[opacity,transform] hover:bg-primary/95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
          {saving ? en.attendance.rules.saving : en.attendance.rules.save}
          </button>
        </div>
      </header>

      {!apiReady ? (
        <div className="rounded-[14px] border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-[13px] leading-relaxed text-amber-950 shadow-[var(--shadow-card)] dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
          <span className="font-semibold">{en.attendance.apiBannerTitle}</span>{" "}
          <span className="text-amber-900/95 dark:text-amber-200/95">{en.attendance.apiBannerBody}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[14px] border border-rose-300/80 bg-rose-50 px-4 py-3.5 text-[13px] leading-relaxed text-rose-950 shadow-[var(--shadow-card)] dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-100">
          <span className="font-semibold">{en.attendance.loadErrorTitle}</span> {error}
        </div>
      ) : null}

      {saved ? (
        <div
          className="flex items-center gap-2.5 rounded-[12px] border border-primary/30 bg-primary/10 px-4 py-3 text-[13px] font-medium text-primary shadow-[var(--shadow-card)]"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {en.attendance.rules.saved}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="border-b border-border/90 pb-4">
            <h2 className="text-[16px] font-semibold text-heading">{en.attendance.rules.checkInPolicyTitle}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{en.attendance.rules.shiftHint}</p>
          </div>

          {loading || !rules ? (
            <RulesSkeleton />
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>
                  {en.attendance.rules.expectedCheckIn}
                  <input
                    type="time"
                    value={rules.expectedCheckIn}
                    onChange={(e) => {
                      setRules((r) => (r ? { ...r, expectedCheckIn: e.target.value } : r));
                      setSaved(false);
                    }}
                    className="ui-field h-11 w-full normal-case tracking-normal"
                  />
                </label>
                <label className={fieldLabel}>
                  {en.attendance.rules.lateAfter}
                  <input
                    type="time"
                    value={rules.lateAfter}
                    onChange={(e) => {
                      setRules((r) => (r ? { ...r, lateAfter: e.target.value } : r));
                      setSaved(false);
                    }}
                    className="ui-field h-11 w-full normal-case tracking-normal"
                  />
                </label>
                <label className={fieldLabel}>
                  {en.attendance.rules.absentAfterCheckIn}
                  <input
                    type="time"
                    value={rules.absentAfterCheckIn}
                    onChange={(e) => {
                      setRules((r) => (r ? { ...r, absentAfterCheckIn: e.target.value } : r));
                      setSaved(false);
                    }}
                    className="ui-field h-11 w-full normal-case tracking-normal"
                  />
                </label>
              </div>

              <div className="mt-8 border-t border-border/90 pt-6">
                <h3 className="text-[14px] font-semibold text-heading">{en.attendance.rules.halfDayTitle}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{en.attendance.rules.halfDayHint}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  First half window
                </p>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>
                    {en.attendance.rules.firstHalfStart}
                    <input
                      type="time"
                      value={rules.firstHalfStart}
                      onChange={(e) => {
                        setRules((r) => (r ? { ...r, firstHalfStart: e.target.value } : r));
                        setSaved(false);
                      }}
                      className="ui-field h-11 w-full normal-case tracking-normal"
                    />
                  </label>
                  <label className={fieldLabel}>
                    {en.attendance.rules.firstHalfEnd}
                    <input
                      type="time"
                      value={rules.firstHalfEnd}
                      onChange={(e) => {
                        setRules((r) => (r ? { ...r, firstHalfEnd: e.target.value } : r));
                        setSaved(false);
                      }}
                      className="ui-field h-11 w-full normal-case tracking-normal"
                    />
                  </label>
                </div>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  Second half window
                </p>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>
                    {en.attendance.rules.secondHalfStart}
                    <input
                      type="time"
                      value={rules.secondHalfStart}
                      onChange={(e) => {
                        setRules((r) => (r ? { ...r, secondHalfStart: e.target.value } : r));
                        setSaved(false);
                      }}
                      className="ui-field h-11 w-full normal-case tracking-normal"
                    />
                  </label>
                  <label className={fieldLabel}>
                    {en.attendance.rules.secondHalfEnd}
                    <input
                      type="time"
                      value={rules.secondHalfEnd}
                      onChange={(e) => {
                        setRules((r) => (r ? { ...r, secondHalfEnd: e.target.value } : r));
                        setSaved(false);
                      }}
                      className="ui-field h-11 w-full normal-case tracking-normal"
                    />
                  </label>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>
                      {en.attendance.rules.halfDayMaxHours}
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        inputMode="decimal"
                        value={rules.halfDayMaxHours}
                        onChange={(e) => setWorkingHoursField("halfDayMaxHours", e.target.value)}
                        className="ui-field h-11 w-full normal-case tracking-normal"
                      />
                    </label>
                    <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                      {en.attendance.rules.halfDayMaxHoursHint}
                    </p>
                  </div>
                  <div>
                    <label className={fieldLabel}>
                      {en.attendance.rules.minimumWorkingHours}
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        inputMode="decimal"
                        value={rules.minimumWorkingHours}
                        onChange={(e) =>
                          setWorkingHoursField("minimumWorkingHours", e.target.value)
                        }
                        className="ui-field h-11 w-full normal-case tracking-normal"
                      />
                    </label>
                    <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                      {en.attendance.rules.minimumWorkingHoursHint}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border/90 pt-6">
                <h3 className="text-[14px] font-semibold text-heading">
                  {en.attendance.rules.checkOutPolicyTitle}
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>
                    {en.attendance.rules.halfDayCheckoutBefore}
                    <input
                      type="time"
                      value={rules.halfDayCheckoutBefore}
                      onChange={(e) => {
                        setRules((r) =>
                          r ? { ...r, halfDayCheckoutBefore: e.target.value } : r,
                        );
                        setSaved(false);
                      }}
                      className="ui-field h-11 w-full normal-case tracking-normal"
                    />
                  </label>
                  <div>
                    <label className={fieldLabel}>
                      {en.attendance.rules.expectedCheckOut}
                      <input
                        type="time"
                        value={rules.expectedCheckOut}
                        onChange={(e) => {
                          setRules((r) => (r ? { ...r, expectedCheckOut: e.target.value } : r));
                          setSaved(false);
                        }}
                        className="ui-field h-11 w-full normal-case tracking-normal"
                      />
                    </label>
                    <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                      {en.attendance.rules.expectedCheckOutHint.replace(
                        "{halfDayOut}",
                        rules.halfDayCheckoutBefore,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border/90 pt-6">
                <label className={fieldLabel}>
                  {en.attendance.rules.attendanceWeekStartDay}
                  <select
                    value={rules.attendanceWeekStartDay}
                    onChange={(e) => {
                      setRules((r) =>
                        r ? { ...r, attendanceWeekStartDay: Number(e.target.value) } : r,
                      );
                      setSaved(false);
                    }}
                    className="ui-field h-11 w-full normal-case tracking-normal"
                  >
                    {WEEK_DAYS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">
                  {en.attendance.rules.attendanceWeekHint}
                </p>
              </div>

              <div className="mt-8 border-t border-border/90 pt-6">
                <p className={fieldLabel}>{en.attendance.rules.weekOffTitle}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
                  {en.attendance.rules.weekOffCompanyHint}
                </p>
                <div className="mt-3 grid grid-cols-7 gap-2">
                  {WEEK_DAYS.map(({ value, label }) => {
                    const on = rules.weekOffDays.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleWeekDay(value)}
                        className={`flex h-11 flex-col items-center justify-center rounded-[10px] border text-[11px] font-bold uppercase tracking-wide transition-[background-color,border-color,color,transform] active:scale-[0.96] ${
                          on
                            ? "border-primary bg-primary text-white shadow-[0_6px_16px_-6px_rgba(0,112,118,0.55)]"
                            : "border-[color:var(--input-border)] bg-[var(--input-bg)] text-fg-muted hover:border-primary/35 hover:text-heading"
                        }`}
                        aria-pressed={on}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <BulkWeekOffAssign />
            </>
          )}

          <button
            type="button"
            disabled={saving || loading || !apiReady}
            onClick={() => void save()}
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,112,118,0.45)] disabled:opacity-50 sm:hidden"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
            {saving ? en.attendance.rules.saving : en.attendance.rules.save}
          </button>
        </section>

        <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-[calc(var(--shell-header-h,64px)+1.5rem)]">
          <div className="border-b border-border/90 pb-4">
            <h2 className="text-[16px] font-semibold text-heading">{en.attendance.rules.statusTitle}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{en.attendance.rules.statusHint}</p>
          </div>
          <ul className="mt-4 space-y-2.5">
            {rules &&
              STATUS_RULES.map(({ status, title, rule }) => (
              <li
                key={status}
                className="flex gap-3 rounded-[12px] border border-border/80 bg-chrome/40 px-3.5 py-3 transition-colors hover:bg-chrome/70 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border/80 bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/[0.1] dark:bg-white/[0.04] dark:shadow-none">
                  <AttendanceStatusIcon status={status} size={18} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] font-semibold text-heading">{title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{rule(rules)}</p>
                </div>
              </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
