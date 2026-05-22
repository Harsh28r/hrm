"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { getPasswordStrength } from "@/lib/auth/password-strength";
import { authValidationMessages, EMAIL_REGEX } from "@/lib/auth/validation";
import { en } from "@/shared/i18n";

const inputClass = "ui-auth-field";

const inputErrorClass =
  "!border-red-500/55 focus:!border-red-500/55 focus:!shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand-accent)_28%,transparent)] dark:!border-red-400/50";

const btnPrimary =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white shadow-[0_14px_36px_-16px_rgba(0,112,118,0.65)] transition-[transform,box-shadow,background-color,opacity] duration-200 hover:bg-primary-dark hover:shadow-[0_18px_40px_-14px_rgba(0,57,61,0.55)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55";

export function ForgotPasswordForm() {
  const a = en.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requestOtp: requestOtpApi, verifyOtp: verifyOtpApi, resetPassword: resetPasswordApi, loading, resendCooldown } =
    useForgotPassword();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpTouched, setOtpTouched] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "otp" | null>(null);
  const [attemptedSendCode, setAttemptedSendCode] = useState(false);
  const [attemptedVerify, setAttemptedVerify] = useState(false);

  const emailId = useId();
  const otpId = useId();
  const newPwdId = useId();
  const confirmPwdId = useId();

  useEffect(() => {
    const v = searchParams.get("email")?.trim();
    if (v) setEmail(v);
  }, [searchParams]);

  const emailTrim = email.trim().toLowerCase();
  const otpDigits = otp.replace(/\D/g, "").slice(0, 6);
  const emailValid = !!emailTrim && EMAIL_REGEX.test(emailTrim);
  const showEmailError = !emailValid && ((emailTouched && focusedField !== "email") || attemptedSendCode);
  const emailErrorMsg = !emailTrim ? authValidationMessages.emailRequired : authValidationMessages.emailInvalid;
  const showOtpError = otpDigits.length !== 6 && ((otpTouched && focusedField !== "otp") || attemptedVerify);

  const strength = getPasswordStrength(newPassword, { email: emailTrim });
  const canSubmitPassword =
    Boolean(newPassword && confirmPassword && newPassword === confirmPassword && strength.valid);

  const setErr = useCallback((msg: string) => {
    setStatusMessage(msg);
    setStatusType("error");
  }, []);

  const setInfo = useCallback((msg: string) => {
    setStatusMessage(msg);
    setStatusType("info");
  }, []);

  const handleBack = () => {
    setStatusMessage("");
    if (step > 1) setStep((s) => s - 1);
    else router.push("/login");
  };

  const handleRequestOtp = async () => {
    setEmailTouched(true);
    setAttemptedSendCode(true);
    if (!emailTrim) {
      setErr(a.forgotEnterEmail);
      return;
    }
    if (!EMAIL_REGEX.test(emailTrim)) {
      setErr(a.forgotEnterValidEmail);
      return;
    }
    setInfo(a.forgotSendingCode);
    const result = await requestOtpApi(emailTrim);
    if (result.ok) {
      setAttemptedSendCode(false);
      setOtpTouched(false);
      setAttemptedVerify(false);
      setStep(2);
      setOtp("");
      setStatusMessage("");
    } else {
      setErr(result.message);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpTouched(true);
    setAttemptedVerify(true);
    if (otpDigits.length !== 6) {
      setErr(a.forgotOtpError);
      return;
    }
    setInfo(a.forgotVerifying);
    const result = await verifyOtpApi(emailTrim, otpDigits);
    if (result.ok) {
      setAttemptedVerify(false);
      setResetToken(result.resetToken);
      setStep(3);
      setNewPassword("");
      setConfirmPassword("");
      setStatusMessage("");
      setStatusType("info");
    } else {
      setErr(result.message);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setInfo(a.forgotSendingCode);
    const result = await requestOtpApi(emailTrim);
    if (result.ok) {
      setStatusMessage("");
    } else {
      setErr(result.message);
    }
  };

  const handleResetPassword = async () => {
    if (!strength.valid) {
      setErr(authValidationMessages.fixPasswordRequirements);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr(authValidationMessages.passwordsDoNotMatch);
      return;
    }
    setInfo(a.forgotUpdating);
    const result = await resetPasswordApi(resetToken, newPassword, confirmPassword);
    if (result.ok) {
      setStatusType("success");
      setStatusMessage(a.forgotRedirecting);
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } else {
      setErr(result.message);
    }
  };

  const title =
    step === 1 ? a.forgotStep1Title : step === 2 ? a.forgotStep2Title : a.forgotStep3Title;

  const subtitle =
    step === 1
      ? a.forgotStep1Subtitle
      : step === 2
        ? `${a.forgotStep2SubtitlePrefix} ${emailTrim || "…"}.`
        : a.forgotStep3Subtitle;

  return (
    <div className="animate-[fade-in_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
      <button
        type="button"
        onClick={handleBack}
        className="mb-5 flex items-center gap-1.5 text-[13px] font-semibold text-sky-400/95 transition-colors hover:text-sky-300"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {a.forgotBack}
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-[1.65rem]">{title}</h1>
        <p className="text-sm leading-relaxed text-fg-muted">{subtitle}</p>
      </div>

      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${step === s ? "bg-primary shadow-[0_0_10px_rgba(0,112,118,0.55)]" : "bg-fg-muted/30 dark:bg-white/20"}`}
          />
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <label htmlFor={emailId} className="text-[13px] font-semibold text-heading">
                {a.emailLabel}
              </label>
              <div className="relative">
                <Mail
                  className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${showEmailError ? "text-red-500" : "text-fg-muted"}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={a.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => {
                    setFocusedField(null);
                    setEmailTouched(true);
                  }}
                  disabled={loading}
                  className={`${inputClass} pr-3.5 ${showEmailError ? inputErrorClass : ""}`}
                />
              </div>
              {showEmailError ? <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{emailErrorMsg}</p> : null}
            </div>
            <button type="button" onClick={handleRequestOtp} disabled={loading} className={btnPrimary}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
              {a.forgotSendCode}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <label htmlFor={otpId} className="text-[13px] font-semibold text-heading">
                {a.forgotOtpLabel}
              </label>
              <div className="relative">
                <KeyRound
                  className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${showOtpError ? "text-red-500" : "text-fg-muted"}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  id={otpId}
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={a.forgotOtpPlaceholder}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onFocus={() => setFocusedField("otp")}
                  onBlur={() => {
                    setFocusedField(null);
                    setOtpTouched(true);
                  }}
                  maxLength={6}
                  disabled={loading}
                  className={`${inputClass} pr-3.5 tracking-[0.35em] ${showOtpError ? inputErrorClass : ""}`}
                />
              </div>
              {showOtpError ? <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{a.forgotOtpError}</p> : null}
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading || otpDigits.length !== 6}
              className={btnPrimary}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
              {a.forgotVerify}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="w-full text-center text-[13px] font-semibold text-sky-400/95 transition-colors hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {resendCooldown > 0 ? `${a.forgotResendIn} ${resendCooldown}s` : a.forgotResend}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1.5">
              <label htmlFor={newPwdId} className="text-[13px] font-semibold text-heading">
                {a.forgotNewPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-muted" strokeWidth={1.75} aria-hidden />
                <input
                  id={newPwdId}
                  name="newPassword"
                  type={showNewPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={a.forgotNewPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setStatusMessage("");
                  }}
                  disabled={loading}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-elevated hover:text-heading dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={showNewPwd ? a.hidePassword : a.showPassword}
                >
                  {showNewPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {newPassword.length > 0 ? (
              <div className="rounded-lg border border-border/80 bg-elevated/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[12px] font-semibold" style={{ color: strength.color }}>
                  {a.forgotStrengthPrefix} {strength.label}
                </p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {strength.rules.map((r) => (
                    <li
                      key={r.rule}
                      className={`text-[11px] leading-snug ${r.pass ? "text-emerald-600 dark:text-emerald-400/95" : "text-fg-muted"}`}
                    >
                      {r.pass ? "✓" : "✗"} {r.rule}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor={confirmPwdId} className="text-[13px] font-semibold text-heading">
                {a.forgotConfirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-muted" strokeWidth={1.75} aria-hidden />
                <input
                  id={confirmPwdId}
                  name="confirmPassword"
                  type={showConfirmPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={a.forgotConfirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setStatusMessage("");
                  }}
                  disabled={loading}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-elevated hover:text-heading dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={showConfirmPwd ? a.hidePassword : a.showPassword}
                >
                  {showConfirmPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {confirmPassword.length > 0 ? (
              <p
                className={`text-[12px] font-medium ${confirmPassword === newPassword ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {confirmPassword === newPassword ? a.forgotPasswordsMatchOk : authValidationMessages.passwordsDoNotMatch}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={!canSubmitPassword || loading}
              className={btnPrimary}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
              {a.forgotUpdatePassword}
            </button>
          </>
        )}

        {statusMessage ? (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-center text-[13px] font-medium ${
              statusType === "error"
                ? "bg-red-500/15 text-red-800 dark:text-red-300"
                : statusType === "success"
                  ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                  : "bg-elevated/80 text-fg-muted dark:bg-white/5 dark:text-slate-300"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
      </div>

      <p className="mt-8 text-center text-[13px] text-fg-muted">
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline hover:text-primary-dark dark:hover:text-teal-200">
          {en.nav.login}
        </Link>
      </p>
    </div>
  );
}
