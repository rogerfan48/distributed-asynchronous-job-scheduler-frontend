"use client";

/**
 * Browser-side client for the same-origin BFF (`/api/*`). Never talks to the
 * backend directly — the BFF attaches the httpOnly session token server-side.
 */

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** True when the error indicates the backend is unreachable (BFF returned 502/503). */
export function isBackendDown(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 502 || error.status === 503);
}

/** Best-effort extraction of a human-readable message from a FastAPI error. */
export function errorMessage(error: unknown, fallback = "發生未預期的錯誤"): string {
  if (error instanceof ApiError) {
    const d = error.detail as
      | string
      | { msg?: string }[]
      | { detail?: string }
      | undefined;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0]?.msg) return d.map((e) => e.msg).join("；");
    if (d && typeof d === "object" && "detail" in d && typeof d.detail === "string") {
      return d.detail;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = await parseBody(res);

  if (res.status === 401) {
    // Session missing/expired: drop to login, preserving where we were.
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    throw new ApiError(401, body, "unauthorized");
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as { detail: unknown }).detail
        : body;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

/** SWR fetcher. */
export const fetcher = <T>(path: string): Promise<T> => request<T>(path);

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
