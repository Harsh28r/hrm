"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isApiConfigured } from "@/shared/config";
import { fetchAttendanceRules } from "@/entities/attendance/api/rules-queries";
import { subscribeAttendanceRulesChanged } from "@/entities/attendance/lib/attendance-rules-events";
import type { AttendanceRules } from "@/entities/attendance/model/rules";
import { AttendanceRulesError } from "@/entities/attendance/model/rules";

type AttendanceRulesContextValue = {
  rules: AttendanceRules | null;
  loading: boolean;
  error: string | null;
  apiReady: boolean;
  refresh: () => Promise<void>;
};

const AttendanceRulesContext = createContext<AttendanceRulesContextValue | null>(null);

export function AttendanceRulesProvider({ children }: { children: ReactNode }) {
  const apiReady = isApiConfigured();
  const [rules, setRules] = useState<AttendanceRules | null>(null);
  const [loading, setLoading] = useState(apiReady);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!apiReady) {
      setRules(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const next = await fetchAttendanceRules();
      if (!mountedRef.current) return;
      setRules(next);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setRules(null);
      const msg =
        e instanceof AttendanceRulesError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load attendance rules.";
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiReady]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const unsub = subscribeAttendanceRulesChanged(() => {
      void refresh();
    });
    return unsub;
  }, [refresh]);

  const value = useMemo(
    () => ({ rules, loading, error, apiReady, refresh }),
    [rules, loading, error, apiReady, refresh],
  );

  return (
    <AttendanceRulesContext.Provider value={value}>{children}</AttendanceRulesContext.Provider>
  );
}

export function useAttendanceRules(): AttendanceRulesContextValue {
  const ctx = useContext(AttendanceRulesContext);
  if (!ctx) {
    throw new Error("useAttendanceRules must be used within AttendanceRulesProvider");
  }
  return ctx;
}
