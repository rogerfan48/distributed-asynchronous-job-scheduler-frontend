import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";

/**
 * Session = the backend-issued JWT, stored in an httpOnly cookie so browser
 * JavaScript can never read it (defense against token theft via XSS). The
 * cookie is the single source of auth truth for the BFF.
 */
export { SESSION_COOKIE };

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function setToken(token: string, maxAgeSec: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Cap to the token's own lifetime so the cookie expires with the JWT.
    maxAge: Math.max(0, Math.floor(maxAgeSec)),
  });
}

export async function clearToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
