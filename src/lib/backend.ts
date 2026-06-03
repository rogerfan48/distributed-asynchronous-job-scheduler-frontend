import "server-only";
import { redirect } from "next/navigation";
import { API_PREFIX, backendOrigin } from "./env";
import { getToken } from "./session";

/**
 * Low-level server-side fetch to the backend. Attaches the session bearer
 * token by default and never caches (job/run state is always live).
 *
 * `path` may be an absolute backend path (e.g. "/healthz" or
 * `${API_PREFIX}/jobs`). Pass `token: null` to call without auth.
 */
export async function backendFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, headers, ...rest } = init;
  const bearer = token === undefined ? await getToken() : token;

  const finalHeaders = new Headers(headers);
  if (bearer) finalHeaders.set("Authorization", `Bearer ${bearer}`);
  if (rest.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${backendOrigin()}${path}`;
  return fetch(url, { ...rest, headers: finalHeaders, cache: "no-store" });
}

/**
 * Server-side GET that classifies failures: backend unreachable / 5xx →
 * treat as maintenance and bounce to the login page (which shows a maintenance
 * notice) instead of the error boundary. Returns the raw Response otherwise.
 * On 401 → redirect to /login. NOTE: redirect() throws NEXT_REDIRECT.
 */
async function serverGet(apiPath: string): Promise<Response> {
  let res: Response;
  try {
    res = await backendFetch(`${API_PREFIX}${apiPath}`);
  } catch {
    // network error / backend unreachable
    redirect("/login?reason=maintenance");
  }
  if (res.status === 401) redirect("/login");
  if (res.status >= 500) redirect("/login?reason=maintenance");
  return res;
}

/**
 * Page-facing typed GET for Server Components. Throws on non-OK 4xx
 * (genuine error → error boundary). Backend-down/5xx/401 are handled by serverGet.
 */
export async function serverJson<T>(apiPath: string): Promise<T> {
  const res = await serverGet(apiPath);
  if (!res.ok) {
    throw new Error(`Backend request failed (${res.status}) for ${apiPath}`);
  }
  return (await res.json()) as T;
}

/** Like serverJson but tolerates 404 by returning null (e.g. latest-run). */
export async function serverJsonOrNull<T>(apiPath: string): Promise<T | null> {
  const res = await serverGet(apiPath);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Backend request failed (${res.status}) for ${apiPath}`);
  }
  return (await res.json()) as T;
}
