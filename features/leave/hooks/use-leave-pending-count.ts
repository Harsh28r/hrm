"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHrLeaveApprovals } from "@/entities/leave";

let sharedCount = 0;
let fetchInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

async function loadPendingCount() {
  if (fetchInFlight) return fetchInFlight;
  fetchInFlight = (async () => {
    try {
      const res = await fetchHrLeaveApprovals();
      sharedCount = res.data?.length ?? 0;
      notifyListeners();
    } catch {
      /* keep last count */
    } finally {
      fetchInFlight = null;
    }
  })();
  return fetchInFlight;
}

/**
 * HR leave approval badge count — fetch only via `refresh()` (no polling).
 */
export function useLeavePendingCount() {
  const [count, setCount] = useState(sharedCount);

  const refresh = useCallback(async () => {
    await loadPendingCount();
  }, []);

  useEffect(() => {
    const sync = () => setCount(sharedCount);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return { count, refresh };
}
