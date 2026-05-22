/** Browser session keys — aligned with HRM auth provider (not shared with other apps). */
export const AUTH_TOKEN_KEY = "hrm_auth_token";
export const AUTH_USER_KEY = "hrm_auth_user";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUserJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
}

/** True when the access token is persisted in localStorage ("Remember me"); false for session-tab storage only. */
export function isRememberedAuth(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_TOKEN_KEY) != null;
}

export function setStoredSession(token: string, userJson: string, remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, userJson);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, userJson);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}
