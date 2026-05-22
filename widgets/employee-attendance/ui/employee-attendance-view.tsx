"use client";

import {
  AlarmClock,
  CalendarRange,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  RefreshCw,
  Settings2,
  UserX,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { en } from "@/shared/i18n";
import { isApiConfigured } from "@/shared/config";
import { StatCard } from "@/widgets/hrm-dashboard/ui/stat-card";
import {
  addDays,
  formatLongRangeLabel,
  isTodayLocal,
  parseDateInputLocal,
  startOfLocalMonth,
  toDateInputValue,
} from "@/widgets/employee-attendance/lib/date-helpers";
import type { AttendanceRow } from "@/widgets/employee-attendance/ui/attendance-log-table";
import { AttendanceLogPagination } from "@/widgets/employee-attendance/ui/attendance-log-pagination";
import { AttendanceLogTable } from "@/widgets/employee-attendance/ui/attendance-log-table";
import { AttendanceWeekStrip } from "@/widgets/employee-attendance/ui/attendance-week-strip";
import {
  buildAttendanceGrid,
  endOfLocalMonth,
  fetchAttendanceAdminAll,
  fetchAttendancePunchesForMatrix,
  fetchCampOffMatrix,
  fetchAttendanceSummary,
  mapAdminAttendanceToRows,
  mergeAttendanceRecords,
  gridEmployeesFromPicker,
  mergeMatrixEmployees,
  punchUserId,
  type AttendanceDateFilter,
  type AttendanceGridModel,
  type AttendanceCellStatus,
} from "@/entities/attendance";
import { useAttendanceRules } from "@/features/attendance";
import { fetchPickerUsers } from "@/entities/user";
import { AttendanceMatrixTable } from "@/widgets/employee-attendance/ui/attendance-matrix-table";
import type { AttendanceAdminAllResponse } from "@/entities/attendance/model/types";
import type { DaySummaryRow } from "@/entities/attendance/api/summary-queries";
import type { CampOffMatrixUser } from "@/entities/attendance/api/campoff-queries";
import type { AttendanceGridEmployee } from "@/entities/attendance/model/grid";
import { ApiError } from "@/shared/api";
import { fetchLeaveRequests } from "@/entities/leave/api/queries";
import { approvedLeaveSpansFromRequests } from "@/entities/attendance/lib/merge-approved-leave-days";

/** Full roster for matrix (checked-in + not); paginated client-side. */
const MATRIX_ROSTER_LIMIT = 2000;
/** Camp-off API is batched — cap personalized week-off when roster is huge. */
const MATRIX_CAMPOFF_MAX_USERS = 150;

type MatrixGridCache = {
  year: number;
  month: number;
  search: string;
  baseEmployees: AttendanceGridEmployee[];
  summaries: DaySummaryRow[];
  campOffByUser?: Record<string, CampOffMatrixUser>;
};

function sliceMatrixPage(
  full: AttendanceGridModel,
  page: number,
  pageSize: number,
): AttendanceGridModel {
  const rowStart = (page - 1) * pageSize;
  return {
    ...full,
    rows: full.rows.slice(rowStart, rowStart + pageSize),
  };
}

type FilterMode = "day" | "range";
type ViewMode = "log" | "matrix";

function buildMockGrid(
  month: Date,
  opts: { page: number; pageSize: number; search: string },
): { grid: AttendanceGridModel; total: number } {
  const year = month.getFullYear();
  const m = month.getMonth();
  const dim = new Date(year, m + 1, 0).getDate();
  const cycle: AttendanceCellStatus[] = [
    "present",
    "present",
    "late",
    "absent",
    "on_leave",
    "weekoff",
    "holiday",
    "half_day",
  ];
  const q = opts.search.trim().toLowerCase();
  let pool = MOCK_ROWS.map((r) => ({ id: r.id, name: r.name }));
  if (q) pool = pool.filter((e) => e.name.toLowerCase().includes(q));
  const total = pool.length;
  const start = (opts.page - 1) * opts.pageSize;
  const pageSlice = pool.slice(start, start + opts.pageSize);
  const rows = pageSlice.map((emp, i) => {
    const cells: Record<number, AttendanceCellStatus> = {};
    const offset = start + i;
    for (let d = 1; d <= dim; d++) {
      cells[d] = cycle[(d + offset) % cycle.length] ?? "present";
    }
    return { employee: emp, cells };
  });
  return {
    grid: { year, month: m, daysInMonth: dim, rows },
    total,
  };
}

function localTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function initialRange(): { from: Date; to: Date } {
  const to = localTodayMidnight();
  return { from: startOfLocalMonth(to), to };
}

const MOCK_ROWS: AttendanceRow[] = [
  {
    id: "1",
    name: "Sarah Chen",
    employeeId: "DY-10482",
    department: "Engineering",
    workDate: null,
    checkIn: "08:54",
    checkOut: "17:12",
    hours: "8h 18m",
    status: "present",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    employeeId: "DY-09103",
    department: "Operations",
    workDate: null,
    checkIn: "09:22",
    checkOut: "17:05",
    hours: "7h 43m",
    status: "late",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
  {
    id: "3",
    name: "Elena Rossi",
    employeeId: "DY-11209",
    department: "People",
    workDate: null,
    checkIn: null,
    checkOut: null,
    hours: null,
    status: "leave",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
  {
    id: "4",
    name: "Dev Patel",
    employeeId: "DY-08871",
    department: "Finance",
    workDate: null,
    checkIn: "08:41",
    checkOut: "17:02",
    hours: "8h 21m",
    status: "remote",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
  {
    id: "5",
    name: "Aisha Khan",
    employeeId: "DY-10255",
    department: "Sales",
    workDate: null,
    checkIn: null,
    checkOut: null,
    hours: null,
    status: "absent",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
  {
    id: "6",
    name: "Tom Weber",
    employeeId: "DY-07644",
    department: "Engineering",
    workDate: null,
    checkIn: "08:02",
    checkOut: "16:58",
    hours: "8h 56m",
    status: "present",
    checkInSelfieUrl: null,
    checkOutSelfieUrl: null,
  },
];

const kpiIcon = { size: 26 as const, strokeWidth: 1.65 as const, absoluteStrokeWidth: true as const };
const chevron = { size: 22 as const, strokeWidth: 1.65 as const, absoluteStrokeWidth: true as const };

const dateInputClass =
  "ui-field h-11 min-w-[11.5rem] cursor-pointer px-3 text-[13px] font-medium text-heading tabular-nums";

const filterChip = (active: boolean) =>
  `h-10 rounded-[10px] px-4 text-[13px] font-semibold transition-colors ${
    active
      ? "bg-primary text-white shadow-[0_8px_24px_-8px_rgba(0,112,118,0.45)]"
      : "border border-border/90 bg-chrome text-fg-muted hover:border-primary/35 hover:text-heading dark:border-white/[0.12] dark:bg-white/[0.06]"
  }`;

function viewFromSearch(view: string | null): ViewMode {
  return view === "matrix" ? "matrix" : "log";
}

export function EmployeeAttendanceView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlView = searchParams?.get("view") ?? null;
  const [viewMode, setViewMode] = useState<ViewMode>(() => viewFromSearch(urlView));

  useEffect(() => {
    setViewMode(viewFromSearch(urlView));
  }, [urlView]);

  const setViewModeWithUrl = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      const next = mode === "matrix" ? "/attendance?view=matrix" : "/attendance";
      router.replace(next, { scroll: false });
    },
    [router],
  );

  const [filterMode, setFilterMode] = useState<FilterMode>("day");
  const [selected, setSelected] = useState(() => new Date());
  const [rangeFrom, setRangeFrom] = useState<Date>(() => initialRange().from);
  const [rangeTo, setRangeTo] = useState<Date>(() => initialRange().to);
  const [matrixMonth, setMatrixMonth] = useState(() => startOfLocalMonth(new Date()));

  const apiReady = isApiConfigured();
  const {
    rules: attendanceRules,
    loading: rulesLoading,
    error: rulesError,
    apiReady: rulesApiReady,
  } = useAttendanceRules();

  const [liveRows, setLiveRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    checkedIn: number;
    checkedOut: number;
    absent: number;
  } | null>(null);
  const [pagination, setPagination] = useState<AttendanceAdminAllResponse["pagination"] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [grid, setGrid] = useState<AttendanceGridModel | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(15);
  const [gridSearch, setGridSearch] = useState("");
  const [gridSearchDebounced, setGridSearchDebounced] = useState("");
  const [gridTotal, setGridTotal] = useState(0);
  const [companyWeekOffDays, setCompanyWeekOffDays] = useState<number[]>([0]);
  const matrixGridCacheRef = useRef<MatrixGridCache | null>(null);
  const matrixFullGridRef = useRef<AttendanceGridModel | null>(null);

  const longDate = useMemo(
    () =>
      selected.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [selected],
  );

  const rangeLabel = useMemo(() => formatLongRangeLabel(rangeFrom, rangeTo), [rangeFrom, rangeTo]);

  const periodHeading = filterMode === "day" ? longDate : rangeLabel;

  const filterForApi = useMemo((): AttendanceDateFilter => {
    if (filterMode === "day") return { kind: "day", day: selected };
    return { kind: "range", from: rangeFrom, to: rangeTo };
  }, [filterMode, selected, rangeFrom, rangeTo]);

  const filterKey = useMemo(
    () =>
      `${filterMode}|${toDateInputValue(selected)}|${toDateInputValue(rangeFrom)}|${toDateInputValue(rangeTo)}`,
    [filterMode, selected, rangeFrom, rangeTo],
  );

  useLayoutEffect(() => {
    setPage(1);
  }, [filterKey, pageSize]);

  const loadLive = useCallback(async () => {
    if (!apiReady || !attendanceRules) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    setPagination(null);
    setLiveRows([]);
    try {
      const res = await fetchAttendanceAdminAll({
        filter: filterForApi,
        page,
        limit: pageSize,
      });
      setLiveRows(
        mapAdminAttendanceToRows(res.attendance, {
          includeWorkDate: filterMode === "range",
          rules: attendanceRules,
        }),
      );
      setSummary(res.summary);
      setPagination(res.pagination);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : en.errors.generic;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiReady, attendanceRules, filterForApi, filterMode, page, pageSize]);

  useEffect(() => {
    if (viewMode !== "log") return;
    if (!apiReady || rulesLoading || !attendanceRules) return;
    void loadLive();
  }, [viewMode, loadLive, apiReady, rulesLoading, attendanceRules]);

  const matrixLabel = useMemo(
    () =>
      matrixMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [matrixMonth],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setGridSearchDebounced(gridSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [gridSearch]);

  const loadGrid = useCallback(async () => {
    if (!apiReady) {
      const mock = buildMockGrid(matrixMonth, {
        page: gridPage,
        pageSize: gridPageSize,
        search: gridSearchDebounced,
      });
      setGrid(mock.grid);
      setGridTotal(mock.total);
      return;
    }
    if (!attendanceRules) {
      setGrid(null);
      setGridTotal(0);
      return;
    }
    setGridLoading(true);
    setGridError(null);
    try {
      const year = matrixMonth.getFullYear();
      const month = matrixMonth.getMonth();
      const start = new Date(year, month, 1);
      const end = endOfLocalMonth(year, month);
      const rules = attendanceRules;

      const search = gridSearchDebounced.trim();
      const dateFrom = toDateInputValue(start);
      const dateTo = toDateInputValue(end);

      const [sumRes, punchRes, pickerRes, leaveRes] = await Promise.all([
        fetchAttendanceSummary({
          startDate: dateFrom,
          endDate: dateTo,
        }),
        fetchAttendancePunchesForMatrix({ year, month }),
        fetchPickerUsers({ search: search || undefined, limit: MATRIX_ROSTER_LIMIT }),
        fetchLeaveRequests("approved").catch(() => ({ data: [] as Awaited<ReturnType<typeof fetchLeaveRequests>>["data"] })),
      ]);
      const approvedLeaves = approvedLeaveSpansFromRequests(leaveRes.data ?? []);

      const now = new Date();
      const isViewingCurrentMonth =
        year === now.getFullYear() && month === now.getMonth();
      let monthPunches = punchRes.attendance;
      if (isViewingCurrentMonth) {
        const todayLog = await fetchAttendanceAdminAll({
          filter: { kind: "day", day: now },
          page: 1,
          limit: 500,
        });
        monthPunches = mergeAttendanceRecords(monthPunches, todayLog.attendance);
      }

      const baseEmployees = gridEmployeesFromPicker(pickerRes.users);
      const employees = mergeMatrixEmployees(baseEmployees, monthPunches, search || undefined);

      const campOffUserIds =
        employees.length > MATRIX_CAMPOFF_MAX_USERS
          ? [...new Set(monthPunches.map((att) => punchUserId(att)).filter((id): id is string => Boolean(id)))]
          : employees.map((e) => e.id);

      const campOffRes = campOffUserIds.length
        ? await fetchCampOffMatrix({
            startDate: dateFrom,
            endDate: dateTo,
            userIds: campOffUserIds,
          })
        : { byUser: {}, companyWeekOffDays: [0] };

      setCompanyWeekOffDays(
        campOffRes.companyWeekOffDays?.length
          ? campOffRes.companyWeekOffDays
          : rules.weekOffDays?.length
            ? rules.weekOffDays
            : [0],
      );
      matrixGridCacheRef.current = {
        year,
        month,
        search,
        baseEmployees,
        summaries: sumRes.data,
        campOffByUser: campOffRes.byUser,
      };
      const fullGrid = buildAttendanceGrid({
        year,
        month,
        employees,
        summaries: sumRes.data,
        punches: monthPunches,
        rules,
        campOffByUser: campOffRes.byUser,
        approvedLeaves,
      });
      matrixFullGridRef.current = fullGrid;
      setGrid(sliceMatrixPage(fullGrid, 1, gridPageSize));
      setGridTotal(fullGrid.rows.length);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : en.errors.generic;
      setGridError(msg);
      setGrid(null);
      setGridTotal(0);
    } finally {
      setGridLoading(false);
    }
  }, [apiReady, attendanceRules, matrixMonth, gridSearchDebounced]);

  useEffect(() => {
    const full = matrixFullGridRef.current;
    if (viewMode !== "matrix" || !full) return;
    setGrid(sliceMatrixPage(full, gridPage, gridPageSize));
  }, [gridPage, gridPageSize, viewMode]);

  useEffect(() => {
    if (viewMode !== "matrix") return;
    if (apiReady && (rulesLoading || !attendanceRules)) return;
    void loadGrid();
  }, [viewMode, loadGrid, apiReady, rulesLoading, attendanceRules]);

  useLayoutEffect(() => {
    if (viewMode === "matrix") setGridPage(1);
  }, [matrixMonth, gridPageSize, gridSearchDebounced, viewMode]);

  const gridTotalPages = useMemo(
    () => Math.max(1, Math.ceil(gridTotal / Math.max(1, gridPageSize))),
    [gridTotal, gridPageSize],
  );

  const shiftMatrixMonth = (delta: number) => {
    setMatrixMonth((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      return next;
    });
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

  const shiftDay = (delta: number) => {
    setSelected((d) => addDays(d, delta));
  };

  const goToday = () => setSelected(new Date());

  const setPresetLast7 = () => {
    const to = localTodayMidnight();
    setRangeFrom(addDays(to, -6));
    setRangeTo(to);
  };

  const setPresetThisMonth = () => {
    const to = localTodayMidnight();
    setRangeFrom(startOfLocalMonth(to));
    setRangeTo(to);
  };

  const setPresetLast30 = () => {
    const to = localTodayMidnight();
    setRangeFrom(addDays(to, -29));
    setRangeTo(to);
  };

  const onRangeFromInput = (ymd: string) => {
    if (!ymd) return;
    const d = parseDateInputLocal(ymd);
    setRangeFrom(d);
    if (d.getTime() > rangeTo.getTime()) setRangeTo(d);
  };

  const onRangeToInput = (ymd: string) => {
    if (!ymd) return;
    const d = parseDateInputLocal(ymd);
    setRangeTo(d);
    if (d.getTime() < rangeFrom.getTime()) setRangeFrom(d);
  };

  const attendanceDataBlocked = rulesApiReady && (rulesLoading || !!rulesError || !attendanceRules);
  const tableRows = !apiReady ? MOCK_ROWS : attendanceDataBlocked ? [] : liveRows;
  const tableLoading = apiReady && (loading || rulesLoading);
  const showDateColumn = apiReady && filterMode === "range";

  const onLeaveCount = useMemo(
    () => liveRows.filter((r) => r.status === "on_leave").length,
    [liveRows],
  );

  const kpiCheckedOut = !apiReady ? "156" : loading ? "…" : error ? "—" : String(summary?.checkedOut ?? "—");
  const kpiCheckedIn = !apiReady ? "12" : loading ? "…" : error ? "—" : String(summary?.checkedIn ?? "—");
  const kpiAbsent = !apiReady ? "18" : loading ? "…" : error ? "—" : String(summary?.absent ?? "—");
  const kpiOnLeave = !apiReady ? "7" : loading ? "…" : error ? "—" : String(onLeaveCount);

  const tableDescription = useMemo(() => {
    if (!apiReady) return en.attendance.tableDescription;
    const period = filterMode === "day" ? longDate : rangeLabel;
    return `${en.attendance.tableDescriptionLive} ${period}.`;
  }, [apiReady, filterMode, longDate, rangeLabel]);

  const tableEmpty =
    filterMode === "range" ? en.attendance.tableEmptyRange : en.attendance.tableEmpty;

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
          <li className="font-medium text-heading">{en.attendance.pageTitle}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-heading md:text-[30px]">
            {en.attendance.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{en.attendance.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/attendance/rules"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border/90 bg-surface px-4 text-[13px] font-medium text-heading shadow-sm transition-colors hover:bg-chrome/60"
          >
            <Settings2 className="h-4 w-4 text-fg-muted" aria-hidden />
            {en.nav.attendanceRules}
          </Link>
          <Link
            href="/attendance/manual-entry"
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-primary/30 bg-primary/10 px-4 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <ClipboardPen className="h-4 w-4" aria-hidden />
            {en.nav.attendanceManualEntry}
          </Link>
        </div>
      </header>

      {!apiReady ? (
        <div className="rounded-[14px] border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-[13px] leading-relaxed text-amber-950 shadow-[var(--shadow-card)] dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
          <span className="font-semibold">{en.attendance.apiBannerTitle}</span>{" "}
          <span className="text-amber-900/95 dark:text-amber-200/95">{en.attendance.apiBannerBody}</span>
        </div>
      ) : null}

      {rulesApiReady && rulesLoading ? (
        <div className="rounded-[14px] border border-border/90 bg-chrome/30 px-4 py-3 text-[13px] text-fg-muted">
          {en.attendance.rulesLoading}
        </div>
      ) : null}

      {rulesApiReady && rulesError ? (
        <div className="rounded-[14px] border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-[13px] leading-relaxed text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
          <span className="font-semibold">{en.attendance.rulesLoadErrorTitle}</span>{" "}
          {rulesError}{" "}
          <Link href="/attendance/rules" className="font-semibold text-primary hover:underline">
            {en.nav.attendanceRules}
          </Link>
          . {en.attendance.rulesLoadErrorBody}
        </div>
      ) : null}

      {apiReady && error && !rulesError ? (
        <div className="rounded-[14px] border border-rose-300/80 bg-rose-50 px-4 py-3.5 text-[13px] leading-relaxed text-rose-950 shadow-[var(--shadow-card)] dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-100">
          <span className="font-semibold">{en.attendance.loadErrorTitle}</span> {error}
        </div>
      ) : null}

      <section className="rounded-[14px] border border-border/90 bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border/90 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={filterChip(filterMode === "day")}
              onClick={() => setFilterMode("day")}
            >
              {en.attendance.filterSingleDay}
            </button>
            <button
              type="button"
              className={filterChip(filterMode === "range")}
              onClick={() => setFilterMode("range")}
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {en.attendance.filterDateRange}
              </span>
            </button>
          </div>
          {filterMode === "day" ? (
            <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
              {en.attendance.pickDate}
              <input
                type="date"
                className={dateInputClass}
                value={toDateInputValue(selected)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setSelected(parseDateInputLocal(v));
                }}
              />
            </label>
          ) : null}
        </div>

        {filterMode === "day" ? (
          <>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  {en.attendance.selectedDay}
                </p>
                <p className="mt-1.5 truncate text-[18px] font-semibold leading-snug text-heading sm:text-[20px]">
                  {periodHeading}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftDay(-1)}
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[color:var(--input-border)] bg-[var(--input-bg)] text-heading shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[background-color,transform] hover:bg-chrome-hover active:scale-[0.96] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                  aria-label={en.attendance.prevDay}
                >
                  <ChevronLeft {...chevron} />
                </button>
                <button
                  type="button"
                  onClick={() => shiftDay(1)}
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[color:var(--input-border)] bg-[var(--input-bg)] text-heading shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[background-color,transform] hover:bg-chrome-hover active:scale-[0.96] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                  aria-label={en.attendance.nextDay}
                >
                  <ChevronRight {...chevron} />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  disabled={isTodayLocal(selected)}
                  className="h-11 rounded-[10px] border border-primary/30 bg-primary/10 px-5 text-[13px] font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-[opacity,transform] hover:bg-primary/[0.14] disabled:pointer-events-none disabled:opacity-45"
                >
                  {en.attendance.today}
                </button>
              </div>
            </div>

            <div className="mt-6 border-t border-border/90 pt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                {en.attendance.weekStrip}
              </p>
              <AttendanceWeekStrip selected={selected} onSelect={setSelected} />
            </div>
          </>
        ) : (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                {en.attendance.rangeHeading}
              </p>
              <p className="mt-1.5 text-[18px] font-semibold leading-snug text-heading sm:text-[20px]">
                {periodHeading}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[11.5rem] flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                {en.attendance.rangeFrom}
                <input
                  type="date"
                  className={dateInputClass}
                  value={toDateInputValue(rangeFrom)}
                  onChange={(e) => onRangeFromInput(e.target.value)}
                />
              </label>
              <label className="flex min-w-[11.5rem] flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                {en.attendance.rangeTo}
                <input
                  type="date"
                  className={dateInputClass}
                  value={toDateInputValue(rangeTo)}
                  onChange={(e) => onRangeToInput(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2 pb-0.5 sm:ml-auto">
                <button
                  type="button"
                  onClick={setPresetLast7}
                  className="h-10 rounded-[10px] border border-border/90 bg-chrome px-3.5 text-[12px] font-semibold text-heading transition-colors hover:border-primary/35 hover:bg-chrome-hover dark:border-white/[0.12] dark:bg-white/[0.06]"
                >
                  {en.attendance.presetLast7}
                </button>
                <button
                  type="button"
                  onClick={setPresetThisMonth}
                  className="h-10 rounded-[10px] border border-border/90 bg-chrome px-3.5 text-[12px] font-semibold text-heading transition-colors hover:border-primary/35 hover:bg-chrome-hover dark:border-white/[0.12] dark:bg-white/[0.06]"
                >
                  {en.attendance.presetThisMonth}
                </button>
                <button
                  type="button"
                  onClick={setPresetLast30}
                  className="h-10 rounded-[10px] border border-border/90 bg-chrome px-3.5 text-[12px] font-semibold text-heading transition-colors hover:border-primary/35 hover:bg-chrome-hover dark:border-white/[0.12] dark:bg-white/[0.06]"
                >
                  {en.attendance.presetLast30}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={en.attendance.kpiCheckedOut}
          value={kpiCheckedOut}
          delta={apiReady ? en.attendance.kpiLiveHint : en.attendance.kpiPresentDelta}
          icon={<Users {...kpiIcon} />}
          tone="teal"
        />
        <StatCard
          title={en.attendance.kpiCheckedIn}
          value={kpiCheckedIn}
          hint={en.attendance.kpiCheckedInHint}
          icon={<AlarmClock {...kpiIcon} />}
          tone="amber"
        />
        <StatCard
          title={en.attendance.kpiAbsent}
          value={kpiAbsent}
          delta={apiReady ? undefined : en.attendance.kpiAbsentDelta}
          deltaPositive={false}
          icon={<UserX {...kpiIcon} />}
          tone="rose"
        />
        <StatCard
          title={en.attendance.kpiOnLeave}
          value={kpiOnLeave}
          hint={en.attendance.kpiOnLeaveHint}
          icon={<CalendarX {...kpiIcon} />}
          tone="blue"
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={filterChip(viewMode === "log")}
          onClick={() => setViewModeWithUrl("log")}
        >
          {en.attendance.viewLog}
        </button>
        <button
          type="button"
          className={filterChip(viewMode === "matrix")}
          onClick={() => {
            setViewModeWithUrl("matrix");
            if (filterMode === "day") {
              setMatrixMonth(startOfLocalMonth(selected));
            } else {
              setMatrixMonth(startOfLocalMonth(rangeFrom));
            }
          }}
        >
          {en.attendance.viewMatrix}
        </button>
        <button
          type="button"
          disabled={
            !apiReady ||
            rulesLoading ||
            !attendanceRules ||
            (viewMode === "log" ? loading : gridLoading)
          }
          onClick={() => void (viewMode === "matrix" ? loadGrid() : loadLive())}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-border/90 bg-surface px-4 text-[13px] font-semibold text-heading shadow-sm transition-colors hover:bg-chrome/60 disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${viewMode === "log" && loading ? "animate-spin" : viewMode === "matrix" && gridLoading ? "animate-spin" : ""}`}
            aria-hidden
          />
          {en.attendance.refresh}
        </button>
      </div>

      {apiReady && gridError && viewMode === "matrix" ? (
        <div className="rounded-[14px] border border-rose-300/80 bg-rose-50 px-4 py-3.5 text-[13px] text-rose-950 dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-100">
          <span className="font-semibold">{en.attendance.loadErrorTitle}</span> {gridError}
        </div>
      ) : null}

      {viewMode === "matrix" ? (
        <AttendanceMatrixTable
          grid={grid}
          loading={apiReady && gridLoading}
          monthLabel={matrixLabel}
          companyWeekOffDays={companyWeekOffDays}
          onPrevMonth={() => shiftMatrixMonth(-1)}
          onNextMonth={() => shiftMatrixMonth(1)}
          search={gridSearch}
          onSearchChange={setGridSearch}
          page={gridPage}
          pageSize={gridPageSize}
          total={gridTotal}
          totalPages={gridTotalPages}
          onPageChange={setGridPage}
          onPageSizeChange={setGridPageSize}
          onRefresh={() => void loadGrid()}
          refreshing={gridLoading}
          labels={{
            title: en.attendance.matrixTitle,
            description: en.attendance.matrixDescriptionManual,
            employee: en.attendance.colEmployee,
            searchPlaceholder: en.attendance.matrixSearch,
            showEntries: en.attendance.matrixShowEntries,
            loading: en.attendance.matrixLoading,
            empty: en.attendance.matrixEmpty,
            legendNote: en.attendance.matrixLegendNote,
            legendHoliday: en.attendance.matrixLegendHoliday,
            legendWeekOff: en.attendance.matrixLegendWeekOff,
            legendCheckedIn: en.attendance.matrixLegendCheckedIn,
            legendPresent: en.attendance.matrixLegendPresent,
            legendManualPresent: en.attendance.matrixLegendManualPresent,
            legendHalfDay: en.attendance.matrixLegendHalfDay,
            legendLate: en.attendance.matrixLegendLate,
            legendAbsent: en.attendance.matrixLegendAbsent,
            legendOnLeave: en.attendance.matrixLegendOnLeave,
            legendCampoffEarned: en.attendance.matrixLegendCampoffEarned,
            legendCampoffUsed: en.attendance.matrixLegendCampoffUsed,
            weekOffPrefix: en.attendance.matrixWeekOffPrefix,
            prevMonth: en.attendance.matrixPrevMonth,
            nextMonth: en.attendance.matrixNextMonth,
            refresh: en.attendance.refresh,
            pagination: paginationLabels,
          }}
        />
      ) : (
      <AttendanceLogTable
        rows={tableRows}
        loading={tableLoading}
        showDateColumn={showDateColumn}
        footer={
          apiReady && pagination && !error ? (
            <AttendanceLogPagination
              page={page}
              totalPages={
                pagination.total > 0
                  ? Math.max(
                      1,
                      pagination.totalPages ||
                        Math.ceil(pagination.total / Math.max(1, pagination.limit)),
                    )
                  : 1
              }
              total={pagination.total}
              pageSize={pageSize}
              disabled={tableLoading}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              labels={{
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
              }}
            />
          ) : null
        }
        labels={{
          title: en.attendance.tableTitle,
          description: tableDescription,
          employee: en.attendance.colEmployee,
          id: en.attendance.colId,
          department: en.attendance.colRole,
          date: en.attendance.colDate,
          checkIn: en.attendance.colCheckIn,
          checkOut: en.attendance.colCheckOut,
          hours: en.attendance.colHours,
          selfies: en.attendance.colSelfies,
          selfieInAria: en.attendance.selfieInAria,
          selfieOutAria: en.attendance.selfieOutAria,
          selfieViewerTitle: en.attendance.selfieViewerTitle,
          selfieViewerClose: en.attendance.selfieViewerClose,
          status: en.attendance.colStatus,
          loading: en.attendance.tableLoading,
          empty: tableEmpty,
        }}
      />
      )}
    </div>
  );
}
