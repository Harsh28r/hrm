import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Forgot password · HRM",
  description: "Reset your DeltaYards HRM password",
};

function ForgotFallback() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-fg-muted" aria-busy="true">
      Loading…
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
