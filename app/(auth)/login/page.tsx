import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in · HRM",
  description: "Sign in to DeltaYards HRM",
};

function LoginFallback() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-fg-muted" aria-busy="true">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <SignInForm />
    </Suspense>
  );
}
