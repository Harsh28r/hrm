"use client";

import { useEffect } from "react";

const CLS = "auth-route-lock";

/** Locks document scroll while auth screens are mounted (fixed shell + no body gutter). */
export function AuthBodyLock() {
  useEffect(() => {
    document.documentElement.classList.add(CLS);
    return () => {
      document.documentElement.classList.remove(CLS);
    };
  }, []);
  return null;
}
