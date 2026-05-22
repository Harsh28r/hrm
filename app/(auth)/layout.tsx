import type { ReactNode } from "react";
import { AuthBackdrop, AuthBodyLock, AuthCover, AuthMobileBrand } from "@/features/auth";

/**
 * Document scroll is locked (AuthBodyLock). Vertical overflow scrolls only inside
 * `main`, so the scrollbar sits on the viewport’s right edge — not on the aside gutter.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthBodyLock />
      <div className="fixed left-0 top-0 z-20 flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden overscroll-none">
        <AuthBackdrop />

        <AuthMobileBrand />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row lg:items-stretch">
          <aside
            className="relative z-10 hidden min-h-0 w-[min(44vw,520px)] shrink-0 overflow-x-hidden overflow-y-hidden border-r border-white/[0.06] lg:flex lg:flex-col"
            aria-label="Product story"
          >
            <AuthCover />
          </aside>

          <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
            <div className="flex min-h-full min-w-0 w-full flex-1 flex-col justify-center px-4 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-7 xl:px-16">
              <div className="mx-auto w-full max-w-[440px] shrink-0 py-1">
                <div className="auth-panel p-6 sm:p-7 lg:p-9 [@media(max-height:720px)]:p-5">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
