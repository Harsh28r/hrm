"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/features/auth/model/auth-provider";
import { en } from "@/shared/i18n";

export function SignInForm() {
  const a = en.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);
  /** Unchecked = sessionStorage (tab-scoped); checked = localStorage (survives browser restart). */
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nextPath = searchParams.get("next")?.trim() || "/";

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return;
    router.replace(nextPath.startsWith("/") ? nextPath : "/");
  }, [isBootstrapping, isAuthenticated, router, nextPath]);

  if (isBootstrapping) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-fg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-[1.65rem]">{a.signInTitle}</h1>
        <p className="text-sm leading-relaxed text-fg-muted">{a.signInSubtitle}</p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setFormError(null);
          const fd = new FormData(e.currentTarget);
          const email = String(fd.get("email") ?? "");
          const password = String(fd.get("password") ?? "");
          setSubmitting(true);
          const result = await login(email, password, remember);
          setSubmitting(false);
          if (!result.ok) {
            setFormError(result.message);
            return;
          }
          router.replace(nextPath.startsWith("/") ? nextPath : "/");
        }}
        noValidate
      >
        <div className="space-y-1.5">
          <label htmlFor={emailId} className="text-[13px] font-semibold text-heading">
            {a.emailLabel}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={a.emailPlaceholder}
              required
              disabled={submitting}
              className="ui-auth-field disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={passwordId} className="text-[13px] font-semibold text-heading">
              {a.passwordLabel}
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-semibold text-sky-400/95 transition-colors hover:text-sky-300"
            >
              {a.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={a.passwordPlaceholder}
              required
              disabled={submitting}
              className="ui-auth-field pr-12 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-elevated hover:text-heading dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={showPassword ? a.hidePassword : a.showPassword}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            name="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={submitting}
            className="h-4 w-4 rounded border-border bg-chrome text-primary focus:ring-[3px] focus:ring-[color-mix(in_oklab,var(--brand-primary)_45%,transparent)] dark:border-white/25 dark:bg-white/[0.04]"
          />
          <span className="text-[13px] font-medium text-fg-muted">{a.rememberMe}</span>
        </label>

        {formError ? (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-center text-[13px] font-medium text-red-700 dark:text-red-300" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white shadow-[0_14px_36px_-16px_rgba(0,112,118,0.65)] transition-[transform,box-shadow,background-color,opacity] duration-200 hover:bg-primary-dark hover:shadow-[0_18px_40px_-14px_rgba(0,57,61,0.55)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
          {a.signInCta}
        </button>
      </form>
    </div>
  );
}
