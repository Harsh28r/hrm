"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  PenLine,
  Save,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { en } from "@/shared/i18n";
import { isApiConfigured } from "@/shared/config";
import { ApiError } from "@/shared/api";
import {
  createManualAttendanceEntry,
  defaultManualEntryFormState,
  fetchManualEntryUsers,
  fetchRecentManualEntries,
  coerceManualEntryText,
  type ManualEntryFormState,
  type ManualEntryUser,
} from "@/entities/attendance";
import {
  combineDateAndTimeToIso,
  resolveWorkedHours,
  statusFromCheckInTime,
  statusFromPunch,
} from "@/entities/attendance/lib/time-rules";
import { ruleDayLabelFromPunch } from "@/entities/attendance/lib/map-punch-to-cell";
import type { DayPunch } from "@/entities/attendance/lib/map-punch-to-cell";
import type { AttendanceAdminRecord } from "@/entities/attendance/model/types";
import { useAttendanceRules } from "@/features/attendance/model/attendance-rules-provider";
import { AttendanceStatusIcon } from "@/widgets/employee-attendance/ui/attendance-status-icon";

const fieldLabel =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function userName(record: AttendanceAdminRecord): string {
  const u = record.user;
  if (!u) return "Unknown";
  return u.name?.trim() || u.email || "Unknown";
}

function creatorName(record: AttendanceAdminRecord): string {
  const by = record.manualEntryBy;
  if (!by) return "—";
  if (typeof by === "string") return by;
  return by.name?.trim() || by.email || "—";
}

/** CRM `apps/attendance/admin/manual-entry` — ported for HRM. */
export function ManualEntryView() {
  const { rules, loading: rulesLoading, error: rulesError, apiReady } = useAttendanceRules();
  const [form, setForm] = useState<ManualEntryFormState>(defaultManualEntryFormState);
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<ManualEntryUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [entries, setEntries] = useState<AttendanceAdminRecord[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async (search: string) => {
    if (!isApiConfigured()) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }
    try {
      setUsersLoading(true);
      setError(null);
      const list = await fetchManualEntryUsers(search);
      setUsers(list);
      if (list.length === 0 && !search.trim()) {
        setError(en.attendance.manualEntry.noUsers);
      }
    } catch (e) {
      setUsers([]);
      setError(e instanceof ApiError ? e.message : en.attendance.manualEntry.loadUsersFailed);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    if (!isApiConfigured()) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }
    try {
      setEntriesLoading(true);
      setEntries(await fetchRecentManualEntries(20));
    } catch {
      /* optional */
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers(userSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [loadUsers, userSearch]);

  const filteredUsers = users;

  const rulesShiftLine = useMemo(() => {
    if (!rules) return "";
    return en.attendance.manualEntry.rulesShiftLine
      .replace("{expectedIn}", rules.expectedCheckIn)
      .replace("{expectedOut}", rules.expectedCheckOut)
      .replace("{late}", rules.lateAfter)
      .replace("{firstStart}", rules.firstHalfStart)
      .replace("{firstEnd}", rules.firstHalfEnd);
  }, [rules]);

  const predictedPreview = useMemo(() => {
    if (!rules || !form.date || !form.checkInTime) return null;
    const tz = rules.timezone ?? "Asia/Kolkata";
    const checkInIso = combineDateAndTimeToIso(form.date, form.checkInTime, tz);
    if (!checkInIso) return null;
    const checkOutIso = form.checkOutTime
      ? combineDateAndTimeToIso(form.date, form.checkOutTime, tz)
      : null;
    const hours = resolveWorkedHours({
      checkInIso,
      checkOutIso,
      totalHours: null,
    });
    const status = statusFromPunch(checkInIso, rules, {
      checkOutIso,
      totalHours: hours,
    });
    const punch: DayPunch = {
      userId: "",
      dayOfMonth: 1,
      checkInTime: checkInIso,
      checkOutTime: checkOutIso,
      totalHours: hours,
      totalBreakMinutes: null,
      isManualEntry: true,
      recordStatus: checkOutIso ? "checked-out" : "checked-in",
    };
    const label = ruleDayLabelFromPunch(
      punch,
      rules,
      status,
      statusFromCheckInTime(checkInIso, rules),
    );
    return { status, label };
  }, [form.date, form.checkInTime, form.checkOutTime, rules]);

  const validate = (): string | null => {
    if (!rules) return en.attendance.rulesLoadErrorTitle;
    if (!form.userId) return en.attendance.manualEntry.errUser;
    if (!form.date) return en.attendance.manualEntry.errDate;
    if (!form.checkInTime) return en.attendance.manualEntry.errCheckIn;
    if (!form.reason.trim()) return en.attendance.manualEntry.errReason;
    const tz = rules.timezone ?? "Asia/Kolkata";
    if (rules.minimumWorkingHours > 0 && !form.checkOutTime.trim()) {
      return en.attendance.manualEntry.errCheckOutRequired;
    }
    if (form.checkOutTime) {
      const inDt = combineDateAndTimeToIso(form.date, form.checkInTime, tz);
      const outDt = combineDateAndTimeToIso(form.date, form.checkOutTime, tz);
      if (!inDt || !outDt || new Date(outDt).getTime() <= new Date(inDt).getTime()) {
        return en.attendance.manualEntry.errCheckOutOrder;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!isApiConfigured() || !rules) {
      setError(en.attendance.manualEntry.apiNotConfigured);
      return;
    }

    try {
      setSubmitting(true);
      const tz = rules.timezone ?? "Asia/Kolkata";
      const checkInDateTime = combineDateAndTimeToIso(form.date, form.checkInTime, tz);
      if (!checkInDateTime) {
        setError(en.attendance.manualEntry.errCheckIn);
        return;
      }
      let checkOutDateTime: string | undefined;
      if (form.checkOutTime) {
        checkOutDateTime = combineDateAndTimeToIso(form.date, form.checkOutTime, tz) ?? undefined;
        if (!checkOutDateTime) {
          setError(en.attendance.manualEntry.errCheckOutOrder);
          return;
        }
      }

      await createManualAttendanceEntry({
        userId: form.userId,
        date: form.date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        notes: form.notes.trim() || undefined,
        reason: form.reason.trim(),
      });

      setSuccess(en.attendance.manualEntry.success);
      setForm(defaultManualEntryFormState());
      setUserSearch("");
      await loadEntries();
    } catch (ex) {
      setError(ex instanceof ApiError ? ex.message : en.attendance.manualEntry.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(defaultManualEntryFormState());
    setUserSearch("");
    setError(null);
    setSuccess(null);
  };

  if (apiReady && rulesLoading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 py-16 text-[14px] text-fg-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        {en.attendance.rulesLoading}
      </div>
    );
  }

  if (apiReady && (rulesError || !rules)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <p className="text-[14px] text-rose-700 dark:text-rose-300">
          <span className="font-semibold">{en.attendance.rulesLoadErrorTitle}</span>{" "}
          {rulesError ?? en.attendance.rulesLoadErrorBody}
        </p>
        <Link href="/attendance/rules" className="text-[13px] font-semibold text-primary hover:underline">
          {en.nav.attendanceRules}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-[fade-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both] space-y-6 pb-10">
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
          <li className="font-medium text-heading">{en.nav.attendanceManualEntry}</li>
        </ol>
      </nav>

      <header>
        <h1 className="text-[22px] font-semibold tracking-tight text-heading md:text-[26px]">
          {en.attendance.manualEntry.pageTitle}
        </h1>
        <p className="mt-1 text-[14px] leading-relaxed text-fg-muted">
          {en.attendance.manualEntry.subtitle}
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-800 dark:text-emerald-200"
        >
          {success}
        </div>
      ) : null}

      <section className="rounded-[14px] border border-border/80 bg-chrome/40 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-heading">
              {en.attendance.manualEntry.notesTitle}
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-fg-muted">
              {en.attendance.manualEntry.notesBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-[14px] border border-border/80 bg-surface px-5 py-6 shadow-sm dark:border-white/[0.08]"
      >
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={fieldLabel}>
              {en.attendance.manualEntry.employeeLabel}
              <span className="text-rose-500">*</span>
            </span>
            {!usersLoading && users.length > 0 ? (
              <span className="text-[11px] text-fg-muted">
                {users.length} {en.attendance.manualEntry.employeesAvailable}
              </span>
            ) : null}
          </div>
          {usersLoading ? (
            <div className="flex items-center gap-2 py-3 text-[13px] text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {en.attendance.manualEntry.loadingUsers}
            </div>
          ) : users.length === 0 ? (
            <p className="text-[13px] text-amber-700 dark:text-amber-300">
              {en.attendance.manualEntry.noUsers}
            </p>
          ) : (
            <>
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={en.attendance.manualEntry.searchUsers}
                className="ui-field mb-2 h-11 w-full normal-case tracking-normal"
              />
              <select
                required
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                className="ui-field h-11 w-full normal-case tracking-normal"
              >
                <option value="">
                  {en.attendance.manualEntry.selectUser} ({filteredUsers.length})
                </option>
                {filteredUsers.length === 0 && userSearch.trim() ? (
                  <option value="" disabled>
                    {en.attendance.manualEntry.noSearchMatches}
                  </option>
                ) : null}
                {filteredUsers.map((u) => {
                  const name = coerceManualEntryText(u.name);
                  const email = coerceManualEntryText(u.email);
                  const role = coerceManualEntryText(u.role);
                  return (
                    <option key={u.id} value={u.id}>
                      {name} — {email}
                      {role ? ` (${role})` : ""}
                    </option>
                  );
                })}
              </select>
            </>
          )}
        </div>

        <label className={fieldLabel}>
          {en.attendance.manualEntry.dateLabel}
          <span className="text-rose-500">*</span>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="ui-field h-11 w-full pl-10 normal-case tracking-normal"
            />
          </div>
        </label>

        <label className={fieldLabel}>
          {en.attendance.manualEntry.checkInLabel}
          <span className="text-rose-500">*</span>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="time"
              required
              value={form.checkInTime}
              onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
              className="ui-field h-11 w-full pl-10 normal-case tracking-normal"
            />
          </div>
          <span className="text-[12px] font-normal normal-case tracking-normal text-fg-muted">
            {en.attendance.manualEntry.checkInHint}
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-border/60 bg-chrome/30 px-3 py-2 dark:border-white/[0.08]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
              {en.attendance.manualEntry.predictedStatus}
            </span>
            {predictedPreview ? (
              <>
                <AttendanceStatusIcon status="manual_present" />
                <span className="max-w-[min(100%,20rem)] text-[12px] font-medium leading-snug text-heading">
                  {predictedPreview.label}
                </span>
              </>
            ) : (
              <span className="text-[12px] text-fg-muted">
                {en.attendance.manualEntry.predictedStatusEmpty}
              </span>
            )}
          </div>
        </label>

        <label className={fieldLabel}>
          {en.attendance.manualEntry.checkOutLabel}
          <span className="text-[12px] font-normal normal-case tracking-normal text-fg-muted">
            ({en.attendance.manualEntry.optional})
          </span>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
              className="ui-field h-11 w-full pl-10 normal-case tracking-normal"
            />
          </div>
          <span className="text-[12px] font-normal normal-case tracking-normal text-fg-muted">
            {rules
              ? en.attendance.manualEntry.checkOutHint.replace(
                  "{expectedOut}",
                  rules.expectedCheckOut,
                )
              : en.attendance.manualEntry.checkOutHint}
          </span>
        </label>

        <label className={fieldLabel}>
          {en.attendance.manualEntry.reasonLabel}
          <span className="text-rose-500">*</span>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder={en.attendance.manualEntry.reasonPlaceholder}
            className="ui-field min-h-[88px] w-full resize-y normal-case tracking-normal"
          />
        </label>

        <label className={fieldLabel}>
          <span className="inline-flex items-center gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            {en.attendance.manualEntry.notesLabel}
            <span className="text-[12px] font-normal normal-case tracking-normal text-fg-muted">
              ({en.attendance.manualEntry.optional})
            </span>
          </span>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={en.attendance.manualEntry.notesPlaceholder}
            className="ui-field min-h-[72px] w-full resize-y normal-case tracking-normal"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting || usersLoading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitting ? en.attendance.manualEntry.submitting : en.attendance.manualEntry.submit}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center rounded-[10px] border border-border px-4 py-2.5 text-[14px] font-medium text-heading hover:bg-chrome/60 disabled:opacity-50"
          >
            {en.attendance.manualEntry.reset}
          </button>
        </div>
      </form>

      <section className="rounded-[14px] border border-amber-500/25 bg-amber-500/10 px-5 py-4">
        <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-100">
          {en.attendance.manualEntry.warningTitle}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
          {en.attendance.manualEntry.warningBody}
        </p>
      </section>

      <section className="rounded-[14px] border border-border/80 bg-surface px-5 py-5 dark:border-white/[0.08]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-heading">
            {en.attendance.manualEntry.recentTitle}
          </h2>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary">
            {entries.length}
          </span>
        </div>

        {entriesLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-fg-muted" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-fg-muted">
            {en.attendance.manualEntry.recentEmpty}
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-[12px] border border-border/70 p-4 transition-colors hover:bg-chrome/40 dark:border-white/[0.06]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-heading">{userName(entry)}</span>
                      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                        {en.attendance.manualEntry.badgeManual}
                      </span>
                    </div>
                    {entry.user?.email ? (
                      <p className="mt-0.5 text-[12px] text-fg-muted">{entry.user.email}</p>
                    ) : null}
                  </div>
                  <span className="text-[11px] text-fg-muted">
                    {entry.createdAt ? formatDate(entry.createdAt) : formatDate(entry.date)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
                  <div>
                    <span className="text-fg-muted">{en.attendance.manualEntry.colDate}: </span>
                    <span className="font-medium text-heading">{formatDate(entry.date)}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted">{en.attendance.manualEntry.colCheckIn}: </span>
                    <span className="font-medium text-heading">
                      {formatTime(entry.checkIn?.time)}
                    </span>
                  </div>
                  <div>
                    <span className="text-fg-muted">{en.attendance.manualEntry.colCheckOut}: </span>
                    <span className="font-medium text-heading">
                      {formatTime(entry.checkOut?.time)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-[12px] text-fg-muted">
                  {en.attendance.manualEntry.createdBy}{" "}
                  <span className="font-medium text-primary">{creatorName(entry)}</span>
                </p>

                {entry.manualEntryReason ? (
                  <p className="mt-2 rounded-[8px] bg-amber-500/10 px-3 py-2 text-[13px] text-heading">
                    <span className="font-semibold">{en.attendance.manualEntry.colReason}: </span>
                    {entry.manualEntryReason}
                  </p>
                ) : null}

                {(entry.checkIn?.notes || entry.checkOut?.notes) && (
                  <p className="mt-2 text-[13px] text-fg-muted">
                    {entry.checkIn?.notes || entry.checkOut?.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
