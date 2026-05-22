/** Lightweight SVG area chart — visually aligned with Apex-style fills used in admin previews. */
const DATA = [42, 48, 44, 52, 50, 58, 55, 62, 60, 68, 65, 72];

function buildPath(values: number[], width: number, height: number): { line: string; area: string } {
  const pad = 8;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = innerW / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1]!.x.toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
  return { line, area };
}

export function HeadcountChart({ className = "" }: { className?: string }) {
  const w = 640;
  const h = 220;
  const { line, area } = buildPath(DATA, w, h);

  return (
    <div
      className={`rounded-[14px] border border-border/90 bg-surface p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-heading">Headcount trend</h3>
          <p className="mt-1 text-[13px] text-fg-muted">Rolling 12 months (sample)</p>
        </div>
        <div className="text-right">
          <span className="text-[28px] font-semibold tabular-nums text-heading">72</span>
          <span className="ml-1 text-[13px] font-medium text-fg-muted">FTE</span>
        </div>
      </div>
      <div className="mt-5 -mx-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-[200px] w-full text-primary"
          preserveAspectRatio="none"
          role="img"
          aria-label="Headcount area chart"
        >
          <defs>
            <linearGradient id="hrm-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#hrm-area-fill)" className="text-primary" />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
      </div>
    </div>
  );
}
