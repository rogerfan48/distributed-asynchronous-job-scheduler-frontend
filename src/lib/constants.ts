/** Shared constants safe to import from any runtime (edge proxy, server, client). */

/** Name of the httpOnly cookie holding the backend JWT. */
export const SESSION_COOKIE = "js_session";

/** Routes reachable without a session. */
export const PUBLIC_PATHS = ["/login", "/register"] as const;

/** Where to land after a successful login. */
export const DEFAULT_AUTHED_PATH = "/tasks";
