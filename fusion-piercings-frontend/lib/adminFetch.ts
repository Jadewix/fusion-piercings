// lib/adminFetch.ts
//
// The admin session, and fetch() for the owner-only API routes.
//
// Logging in trades the admin password for a signed token that expires
// (POST /admin/auth). It is kept in sessionStorage, so it ends with the tab, and
// sent as a Bearer header on every admin request. The server enforces it; the
// expiry kept here only avoids showing a dashboard whose first request would
// fail.

const SESSION_KEY = 'admin_session';

interface AdminSession {
  token: string;
  expiresAt: number;
}

type Listener = () => void;
const expiredListeners = new Set<Listener>();

// Bumped on every login, so a 401 can tell whether it belongs to the current
// session or to a request sent before the owner logged in again.
let sessionVersion = 0;

export function saveAdminSession(session: AdminSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, expiresAt: session.expiresAt }));
  sessionVersion++;
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** The stored token, or null when there is none or it has expired. */
export function getAdminToken(): string | null {
  try {
    const session: AdminSession | null = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (session && typeof session.token === 'string' && session.expiresAt > Date.now()) return session.token;
  } catch { /* malformed — treat as logged out */ }
  return null;
}

/**
 * Calls `listener` when an admin request is refused because the session has
 * expired or been revoked. Returns an unsubscribe function.
 */
export function onAdminSessionExpired(listener: Listener): () => void {
  expiredListeners.add(listener);
  return () => { expiredListeners.delete(listener); };
}

/**
 * fetch() with the admin token attached. `path` is relative to
 * NEXT_PUBLIC_API_URL, e.g. '/admin/orders'.
 *
 * A 401 clears the session and notifies onAdminSessionExpired listeners. The
 * response is still returned, so the caller's own error handling runs as usual.
 */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const sentWithVersion = sessionVersion;

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && sentWithVersion === sessionVersion) {
    clearAdminSession();
    expiredListeners.forEach(listener => listener());
  }
  return res;
}
