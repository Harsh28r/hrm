const ROWS = [
  { label: "Annual", pct: 72, color: "bg-primary" },
  { label: "Sick", pct: 38, color: "bg-secondary" },
  { label: "Unpaid", pct: 22, color: "bg-amber-500" },
  { label: "Other", pct: 15, color: "bg-fg-muted" },
] as const;

export function LeaveBarsCard() {
  return (
    <div className="rounded-[14px] border border-border/90 bg-surface p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-[16px] font-semibold tracking-tight text-heading">Leave mix</h3>
      <p className="mt-1 text-[13px] text-fg-muted">Share of approved days YTD</p>
      <ul className="mt-6 space-y-[18px]">
        {ROWS.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-[12px] font-semibold text-heading">
              <span>{row.label}</span>
              <span className="tabular-nums text-fg-muted">{row.pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-border/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
