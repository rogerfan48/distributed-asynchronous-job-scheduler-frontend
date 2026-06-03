import "server-only";

/**
 * Server-only environment access. Imported by Route Handlers and Server
 * Components — never by client code (the `server-only` import enforces this).
 */

export const API_PREFIX = "/api/v1";

/** Backend API origin, normalized without a trailing slash. Throws if unset. */
export function backendOrigin(): string {
  const value = process.env.BACKEND_ORIGIN?.trim();
  if (!value) {
    throw new Error(
      "BACKEND_ORIGIN is not configured. Set it in .env (see .env.example).",
    );
  }
  return value.replace(/\/+$/, "");
}
