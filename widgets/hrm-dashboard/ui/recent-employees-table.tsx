import Link from "next/link";

const ROWS = [
  { name: "Sarah Chen", dept: "Engineering", status: "Active", joined: "Apr 2, 2026" },
  { name: "Marcus Johnson", dept: "Operations", status: "Active", joined: "Mar 18, 2026" },
  { name: "Elena Rossi", dept: "People", status: "Probation", joined: "Mar 4, 2026" },
  { name: "Dev Patel", dept: "Finance", status: "Active", joined: "Feb 22, 2026" },
  { name: "Aisha Khan", dept: "Sales", status: "Active", joined: "Feb 9, 2026" },
] as const;

function badgeClass(status: string) {
  if (status === "Active")
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/18 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-500/25";
  if (status === "Probation")
    return "bg-amber-50 text-amber-900 ring-amber-600/18 dark:bg-amber-950/45 dark:text-amber-200 dark:ring-amber-500/25";
  return "bg-elevated text-heading ring-border/80 dark:bg-white/10 dark:text-slate-200 dark:ring-white/15";
}

export function RecentEmployeesTable() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border/90 bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/90 px-6 py-[18px]">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-heading">Recent hires</h3>
          <p className="mt-1 text-[13px] text-fg-muted">Sample rows — wire to your API</p>
        </div>
        <Link
          href="/employees"
          className="text-[13px] font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border/90 bg-[var(--table-header-bg)] text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
              <th className="px-6 py-3.5">Employee</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Start date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--table-divider)]">
            {ROWS.map((row) => (
              <tr key={row.name} className="transition-colors hover:bg-[var(--table-row-hover)]">
                <td className="px-6 py-[14px] font-semibold text-heading">{row.name}</td>
                <td className="px-6 py-[14px] text-fg-muted">{row.dept}</td>
                <td className="px-6 py-[14px]">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${badgeClass(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-[14px] text-right tabular-nums text-fg-muted">{row.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
