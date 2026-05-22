const ATTENDANCE_RULES_CHANGED = "attendance-rules-changed";

export function notifyAttendanceRulesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ATTENDANCE_RULES_CHANGED));
}

export function subscribeAttendanceRulesChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ATTENDANCE_RULES_CHANGED, handler);
  return () => window.removeEventListener(ATTENDANCE_RULES_CHANGED, handler);
}
