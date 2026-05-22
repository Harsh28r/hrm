import Link from "next/link";
import { Briefcase, CalendarCheck2, TrendingUp, Users } from "lucide-react";
import { en } from "@/shared/i18n";
import { HeadcountChart } from "@/widgets/hrm-dashboard/ui/headcount-chart";
import { LeaveBarsCard } from "@/widgets/hrm-dashboard/ui/leave-bars-card";
import { RecentEmployeesTable } from "@/widgets/hrm-dashboard/ui/recent-employees-table";
import { StatCard } from "@/widgets/hrm-dashboard/ui/stat-card";

export type HrmDashboardViewProps = {
  apiConfigured: boolean;
};

const kpiIcon = { size: 26 as const, strokeWidth: 1.65 as const, absoluteStrokeWidth: true as const };

export function HrmDashboardView({ apiConfigured }: HrmDashboardViewProps) {
  return (
    <div className="animate-[fade-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both] space-y-6">
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
          <li className="font-medium text-heading">{en.dashboard.title}</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-heading md:text-[30px]">
            {en.dashboard.title}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">{en.dashboard.subtitle}</p>
        </div>
      </header>

      {!apiConfigured ? (
        <div className="rounded-[14px] border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-[13px] leading-relaxed text-amber-950 shadow-[var(--shadow-card)] dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100">
          <span className="font-semibold">API not configured.</span>{" "}
          <span className="text-amber-900/95 dark:text-amber-200/95">
            Add <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-[12px] dark:bg-amber-900/60">NEXT_PUBLIC_API_BASE_URL</code> to{" "}
            <span className="font-mono text-[12px]">.env.local</span> for live HR data. Charts below are sample previews.
          </span>
        </div>
      ) : (
        <div className="rounded-[14px] border border-emerald-300/80 bg-emerald-50/95 px-4 py-3.5 text-[13px] text-emerald-950 shadow-[var(--shadow-card)] dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-100">
          <span className="font-semibold">API reachable.</span>{" "}
          <span className="text-emerald-900/95 dark:text-emerald-200/95">Replace sample widgets with real queries from entities.</span>
        </div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total employees"
          value="1,248"
          delta="+2.4% vs last month"
          icon={<Users {...kpiIcon} />}
          tone="teal"
        />
        <StatCard
          title="On leave today"
          value="18"
          hint="Across all sites"
          icon={<CalendarCheck2 {...kpiIcon} />}
          tone="blue"
        />
        <StatCard
          title="Open roles"
          value="24"
          delta="+3 new requisitions"
          icon={<Briefcase {...kpiIcon} />}
          tone="amber"
        />
        <StatCard
          title="Avg. tenure"
          value="3.2 yrs"
          delta="-0.1 vs Q4"
          deltaPositive={false}
          icon={<TrendingUp {...kpiIcon} />}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeadcountChart />
        </div>
        <div className="lg:col-span-1">
          <LeaveBarsCard />
        </div>
      </section>

      <section>
        <RecentEmployeesTable />
      </section>
    </div>
  );
}
