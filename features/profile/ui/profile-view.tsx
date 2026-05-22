"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ChevronRight, Clock, House, Mail, MapPin, Phone, Users } from "lucide-react";
import { en } from "@/shared/i18n";

const p = en.profile;

const quickLinkIcons = [Users, Clock, CalendarDays, House] as const;

type TabId = "about" | "activity" | "approvals" | "documents";

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center border-border/80 px-4 py-5 text-center sm:border-r sm:last:border-r-0 dark:border-white/[0.08]">
      <span className="text-[22px] font-bold tabular-nums tracking-tight text-heading sm:text-[24px]">{value}</span>
      <span className="mt-1 text-[12px] font-medium text-fg-muted">{label}</span>
    </div>
  );
}

function SkillBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-heading">{label}</span>
        <span className="text-[12px] font-semibold tabular-nums text-fg-muted">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-border/60 dark:bg-white/[0.06] dark:ring-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-[color-mix(in_oklab,var(--brand-secondary)_65%,var(--brand-primary))]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProfileView() {
  const [tab, setTab] = useState<TabId>("about");

  const tabs: { id: TabId; label: string }[] = [
    { id: "about", label: p.tabAbout },
    { id: "activity", label: p.tabActivity },
    { id: "approvals", label: p.tabApprovals },
    { id: "documents", label: p.tabDocuments },
  ];

  return (
    <div className="mx-auto max-w-[1200px] animate-[fade-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both] px-0 pb-10 pt-1">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-heading sm:text-[28px]">{p.pageTitle}</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-snug text-fg-muted">{p.pageSubtitle}</p>
        </div>
        <nav className="text-[13px] font-medium text-fg-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-primary">
                {en.nav.home}
              </Link>
            </li>
            <li aria-hidden className="text-fg-subtle">
              /
            </li>
            <li className="text-heading">{p.breadcrumbCurrent}</li>
          </ol>
        </nav>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/90 bg-surface shadow-[0_2px_12px_rgba(15,23,42,0.06),0_1px_0_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
        <div className="relative h-[200px] w-full overflow-hidden sm:h-[220px]">
          <div
            className="absolute inset-0 bg-[linear-gradient(118deg,var(--brand-primary-dark)_0%,var(--brand-primary)_38%,var(--brand-secondary)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30 30 60 0 30Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />
        </div>

        <div className="relative px-5 pb-6 pt-0 sm:px-8 sm:pb-8">
          <div className="-mt-[68px] flex flex-col gap-6 sm:-mt-[76px] sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div
                className="h-[120px] w-[120px] shrink-0 rounded-full border-[5px] border-surface bg-[linear-gradient(145deg,color-mix(in_oklab,var(--brand-primary)_18%,white)_0%,color-mix(in_oklab,var(--brand-secondary)_12%,white)_100%)] shadow-[0_12px_40px_-8px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] dark:border-[#141c26] dark:from-[color-mix(in_oklab,var(--brand-primary)_35%,#0f172a)] dark:to-[color-mix(in_oklab,var(--brand-secondary)_28%,#0f172a)] dark:ring-white/10 sm:h-[128px] sm:w-[128px]"
                aria-hidden
              >
                <div className="flex h-full w-full items-center justify-center rounded-full text-[40px] font-bold tracking-tight text-primary dark:text-[color-mix(in_oklab,var(--brand-primary)_75%,white)]">
                  AC
                </div>
              </div>
              <div className="min-w-0 text-center sm:pb-1 sm:text-left">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {p.heroBadge}
                  </span>
                </div>
                <h2 className="text-[22px] font-bold leading-tight tracking-tight text-heading sm:text-[24px]">{p.heroName}</h2>
                <p className="mt-1 text-[14px] font-medium text-fg-muted">{p.heroRole}</p>
                <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-[13px] text-fg-muted sm:justify-start">
                  <MapPin className="h-4 w-4 shrink-0 text-primary/90" strokeWidth={1.75} aria-hidden />
                  <span>{p.heroLocation}</span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-center gap-2.5 sm:justify-end">
              <button
                type="button"
                className="h-10 min-w-[120px] rounded-[10px] border border-border/90 bg-chrome px-5 text-[13px] font-semibold text-heading shadow-sm transition-[background-color,border-color,box-shadow] hover:border-primary/35 hover:bg-chrome-hover dark:border-white/[0.12] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                {p.btnEdit}
              </button>
              <button
                type="button"
                className="h-10 min-w-[120px] rounded-[10px] bg-primary px-5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,112,118,0.55)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
              >
                {p.btnAccount}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 border-t border-border/80 sm:grid-cols-4 dark:border-white/[0.08]">
            <StatCell label={p.statHeadcount} value={p.statHeadcountVal} />
            <StatCell label={p.statPending} value={p.statPendingVal} />
            <StatCell label={p.statTenure} value={p.statTenureVal} />
            <StatCell label={p.statCerts} value={p.statCertsVal} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <section className="overflow-hidden rounded-2xl border border-border/90 bg-surface shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.28)]">
            <div className="border-b border-border/80 px-4 dark:border-white/[0.08] sm:px-6">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map(({ id, label }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`relative shrink-0 px-4 py-3.5 text-[13px] font-semibold transition-colors sm:px-5 ${
                        active ? "text-primary" : "text-fg-muted hover:text-heading"
                      }`}
                    >
                      {label}
                      {active ? (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t bg-primary sm:left-4 sm:right-4" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {tab === "about" ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.aboutTitle}</h3>
                    <p className="mt-3 max-w-[52rem] text-[14px] leading-[1.7] text-fg-muted">{p.aboutBody}</p>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.personalTitle}</h3>
                    <div className="mt-4 grid gap-0 sm:grid-cols-2 sm:gap-x-12">
                      {(() => {
                        const rows = [...p.personalRows];
                        const mid = Math.ceil(rows.length / 2);
                        const left = rows.slice(0, mid);
                        const right = rows.slice(mid);
                        return (
                          <>
                            {[left, right].map((col, ci) => (
                              <div key={ci} className="divide-y divide-border/70 dark:divide-white/[0.08]">
                                {col.map((row) => (
                                  <div
                                    key={row.label}
                                    className="flex items-center justify-between gap-4 py-3.5 text-[13px]"
                                  >
                                    <span className="shrink-0 font-medium text-fg-muted">{row.label}</span>
                                    <span className="min-w-0 text-right font-semibold text-heading">{row.value}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border/90 bg-elevated/40 py-16 text-center dark:bg-white/[0.03]">
                  <p className="text-[14px] font-medium text-fg-muted">
                    {tab === "activity" && p.tabActivity}
                    {tab === "approvals" && p.tabApprovals}
                    {tab === "documents" && p.tabDocuments}
                  </p>
                  <p className="mt-2 max-w-md text-[13px] leading-relaxed text-fg-subtle">{p.tabPlaceholderHint}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-border/90 bg-surface p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.28)]">
            <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.sidebarCompletionTitle}</h3>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative grid h-16 w-16 shrink-0 place-items-center">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                  <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-elevated dark:stroke-white/10" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeDasharray={`${0.88 * 97.4} 97.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-heading">{p.sidebarCompletionPct}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-fg-muted">{p.sidebarCompletionBlurb}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/90 bg-surface p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.28)]">
            <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.sidebarSkillsTitle}</h3>
            <div className="mt-5 space-y-5">
              {p.skills.map((s) => (
                <SkillBar key={s.label} label={s.label} pct={s.pct} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/90 bg-surface p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.28)]">
            <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.sidebarContactTitle}</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">{p.contactEmailLabel}</p>
                  <p className="mt-0.5 break-all text-[13px] font-semibold text-heading">{p.contactEmail}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">{p.contactPhoneLabel}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-heading">{p.contactPhone}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">{p.contactOfficeLabel}</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug text-heading">{p.contactAddress}</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border/90 bg-surface p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] dark:border-white/[0.08] dark:shadow-[0_2px_20px_rgba(0,0,0,0.28)]">
            <h3 className="text-[15px] font-bold tracking-tight text-heading">{p.sidebarQuickLinksTitle}</h3>
            <ul className="mt-3 divide-y divide-border/70 dark:divide-white/[0.08]">
              {p.quickLinks.map((item, i) => {
                const Icon = quickLinkIcons[i] ?? House;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 py-3.5 text-[13px] font-semibold text-heading transition-colors first:pt-0 last:pb-0 hover:text-primary"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-fg-muted ring-1 ring-inset ring-border/60 transition-[color,background-color] group-hover:bg-primary/10 group-hover:text-primary dark:bg-white/[0.05] dark:ring-white/[0.08]">
                        <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
