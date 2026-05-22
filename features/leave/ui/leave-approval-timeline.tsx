"use client";

export type LeaveTimelineEntry = {
  id?: string;
  step: string;
  stepLabel?: string;
  action: string;
  actionLabel?: string;
  actorName?: string;
  comment?: string;
  at: string;
  summary?: string;
};

type Props = {
  timeline?: LeaveTimelineEntry[];
  status: string;
  managerName?: string | null;
  compact?: boolean;
};

const FLOW = [
  { step: "employee", title: "Employee" },
  { step: "tl", title: "Reporting manager" },
  { step: "hr", title: "HR (final)" },
] as const;

function stepState(
  step: string,
  status: string,
  timeline: LeaveTimelineEntry[],
): "done" | "current" | "upcoming" | "rejected" {
  const entry = timeline.find((t) => t.step === step);
  if (entry?.action === "rejected") return "rejected";
  if (entry?.action === "approved" || entry?.action === "submitted") return "done";
  if (step === "tl" && status === "pending_tl") return "current";
  if (step === "hr" && status === "pending_hr") return "current";
  if (status === "approved") return entry ? "done" : "upcoming";
  if (status.startsWith("rejected")) {
    if (step === "hr" && status === "rejected_hr") return "rejected";
    if (step === "tl" && status === "rejected_tl") return "rejected";
    return entry ? "done" : "upcoming";
  }
  return "upcoming";
}

export function LeaveApprovalTimeline({ timeline = [], status, managerName, compact }: Props) {
  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {FLOW.map(({ step, title }) => {
        const entry = timeline.find((t) => t.step === step);
        const state = stepState(step, status, timeline);
        const dot =
          state === "done"
            ? "bg-emerald-500"
            : state === "current"
              ? "bg-amber-500 ring-4 ring-amber-500/20"
              : state === "rejected"
                ? "bg-red-500"
                : "bg-border";

        const subtitle =
          step === "tl" && !entry && managerName
            ? `Assigned: ${managerName}`
            : step === "tl" && status === "pending_tl"
              ? managerName
                ? `Waiting for ${managerName}`
                : "Waiting for manager"
              : step === "hr" && status === "pending_hr"
                ? "Waiting for HR approval"
                : null;

        return (
          <li key={step} className="flex gap-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{title}</p>
              {entry ? (
                <p className="text-xs text-muted">
                  {entry.actorName || "Someone"}{" "}
                  {entry.action === "submitted"
                    ? "submitted"
                    : entry.action === "approved"
                      ? "approved"
                      : "rejected"}
                  {entry.at ? ` · ${new Date(entry.at).toLocaleString()}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted capitalize">{state === "current" ? subtitle || "In progress" : state}</p>
              )}
              {entry?.comment && (
                <p className="mt-1 rounded bg-muted/10 px-2 py-1 text-xs text-muted">&ldquo;{entry.comment}&rdquo;</p>
              )}
              {!entry && subtitle && state !== "current" && (
                <p className="text-xs text-muted">{subtitle}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
