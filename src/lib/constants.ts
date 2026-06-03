/** Shared constants safe to import from any runtime (edge proxy, server, client). */

/** Name of the httpOnly cookie holding the backend JWT. */
export const SESSION_COOKIE = "js_session";

/** Routes reachable without a session. */
export const PUBLIC_PATHS = ["/login", "/register"] as const;

/** Where to land after a successful login. */
export const DEFAULT_AUTHED_PATH = "/tasks";

/** Shown when the backend is unreachable (service maintenance / outage). */
export const MAINTENANCE_MESSAGE = "系統維護中，暫時無法連線，請稍後再試。";
