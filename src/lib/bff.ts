import "server-only";
import { API_PREFIX } from "./env";
import { backendFetch } from "./backend";
import { getToken } from "./session";

/**
 * Generic Backend-For-Frontend proxy used by the `/api/*` Route Handlers.
 *
 * It forwards the incoming request (method, JSON body, query string) to the
 * backend under `${API_PREFIX}${backendPath}`, attaching the session bearer
 * token, then relays the backend's status + body back to the browser. The JWT
 * stays server-side; the browser only ever talks to this same-origin BFF.
 */
export async function proxyApi(
  req: Request,
  backendPath: string,
  opts: { requireAuth?: boolean } = {},
): Promise<Response> {
  const { requireAuth = true } = opts;
  const token = await getToken();

  if (requireAuth && !token) {
    return Response.json({ detail: "未登入或登入已過期" }, { status: 401 });
  }

  const search = new URL(req.url).search;
  const methodHasBody = req.method !== "GET" && req.method !== "HEAD";

  // Forward the raw bytes so any content-type works (JSON *and* multipart file
  // uploads). Preserve the original Content-Type incl. multipart boundary.
  let body: ArrayBuffer | undefined;
  let contentType: string | undefined;
  if (methodHasBody) {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      body = buf;
      contentType = req.headers.get("content-type") ?? "application/json";
    }
  }

  let res: Response;
  try {
    res = await backendFetch(`${API_PREFIX}${backendPath}${search}`, {
      method: req.method,
      token,
      body,
      headers: contentType ? { "Content-Type": contentType } : undefined,
    });
  } catch {
    return Response.json(
      { detail: "無法連線到後端排程服務，請稍後再試。" },
      { status: 502 },
    );
  }

  const payload = await res.text();
  return new Response(payload || null, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
