type SessionExpiredHandler = () => void;

let onSessionExpired: SessionExpiredHandler | null = null;

/** Register handler from AuthProvider; apiFetch calls this on 401. */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

export function notifySessionExpired() {
  onSessionExpired?.();
}
