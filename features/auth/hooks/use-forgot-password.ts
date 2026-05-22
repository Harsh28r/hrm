"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authBffPaths } from "@/features/auth/api/auth-bff";

async function postForgotPassword(body: Record<string, unknown>): Promise<{ res: Response; data: Record<string, unknown> }> {
  const res = await fetch(authBffPaths.forgotPassword, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  return { res, data };
}

export type VerifyOtpResult =
  | { ok: true; resetToken: string; message?: string }
  | { ok: false; message: string };

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, [resendCooldown]);

  const requestOtp = useCallback(async (email: string): Promise<{ ok: true; message?: string } | { ok: false; message: string }> => {
    const e = (email || "").toString().trim().toLowerCase();
    setLoading(true);
    try {
      const { res, data } = await postForgotPassword({ action: "request", email: e });
      if (res.status === 429) {
        return { ok: false, message: "Too many attempts. Please try again later." };
      }
      if (!res.ok) {
        const msg = typeof data?.message === "string" ? data.message : "Request failed. Please try again.";
        return { ok: false, message: msg };
      }
      setResendCooldown(60);
      return {
        ok: true,
        message:
          typeof data?.message === "string"
            ? data.message
            : "If this email is registered, you will receive an OTP shortly.",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isNetwork = /network|fetch|failed to fetch/i.test(msg);
      return {
        ok: false,
        message: isNetwork ? "Network error. Check your connection and try again." : "Something went wrong. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<VerifyOtpResult> => {
    const e = (email || "").toString().trim().toLowerCase();
    const otpTrim = (otp || "").toString().replace(/\D/g, "").slice(0, 6);
    setLoading(true);
    try {
      const { res, data } = await postForgotPassword({ action: "verify", email: e, otp: otpTrim });
      if (res.status === 429) {
        return { ok: false, message: "Too many attempts. Please try again later." };
      }
      const token = typeof data?.resetToken === "string" ? data.resetToken : "";
      if (!res.ok || !token) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : "Invalid or expired code. Please try again or request a new code.";
        return { ok: false, message: msg };
      }
      return { ok: true, resetToken: token, message: typeof data?.message === "string" ? data.message : "Code verified successfully." };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isNetwork = /network|fetch|failed to fetch/i.test(msg);
      return {
        ok: false,
        message: isNetwork ? "Network error. Check your connection and try again." : "Something went wrong. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string, confirmPassword: string): Promise<{ ok: true; message?: string } | { ok: false; message: string }> => {
    setLoading(true);
    try {
      const { res, data } = await postForgotPassword({
        action: "reset",
        resetToken,
        newPassword,
        confirmPassword,
      });
      if (res.status === 429) {
        return { ok: false, message: "Too many attempts. Please try again later." };
      }
      if (!res.ok) {
        const msg = typeof data?.message === "string" ? data.message : "Invalid or expired reset. Please start again.";
        return { ok: false, message: msg };
      }
      return {
        ok: true,
        message: typeof data?.message === "string" ? data.message : "Password updated successfully.",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const isNetwork = /network|fetch|failed to fetch/i.test(msg);
      return {
        ok: false,
        message: isNetwork ? "Network error. Check your connection and try again." : "Something went wrong. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requestOtp,
    verifyOtp,
    resetPassword,
    loading,
    resendCooldown,
  };
}
