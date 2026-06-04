import "server-only";

/** Server-only Grafana origin (reached over WireGuard). Real value via env. */
export function grafanaOrigin(): string {
  return (process.env.GRAFANA_ORIGIN?.trim() || "http://localhost:8787").replace(/\/+$/, "");
}

/**
 * Browser-facing dashboard URL — a same-origin path (e.g.
 * `/grafana/public-dashboards/<id>`) that nginx reverse-proxies over WireGuard.
 * Empty when unconfigured → the monitoring page shows a maintenance notice.
 */
export function grafanaDashboardUrl(): string {
  const url = process.env.GRAFANA_DASHBOARD_URL?.trim() || "";
  return url.startsWith("/grafana/") ? url : "";
}

function isGrafanaHealthPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.database === "string" ||
    typeof payload.version === "string" ||
    typeof payload.commit === "string"
  );
}

/**
 * Server-side liveness check (over WireGuard). True only when Grafana answers
 * 2xx with its health JSON. Redirects/HTML are treated as unhealthy so a
 * misrouted `/grafana/*` path cannot make the app iframe itself.
 */
export async function isGrafanaHealthy(): Promise<boolean> {
  const url = process.env.GRAFANA_HEALTH_URL?.trim() || `${grafanaOrigin()}/grafana/api/health`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return false;

    return isGrafanaHealthPayload(await res.json());
  } catch {
    return false;
  }
}
