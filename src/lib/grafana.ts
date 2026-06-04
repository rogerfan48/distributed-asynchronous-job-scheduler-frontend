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
  return process.env.GRAFANA_DASHBOARD_URL?.trim() || "";
}

/**
 * Server-side liveness check (over WireGuard). True only when Grafana answers
 * 2xx on its health endpoint. Used to gate the embed vs. a maintenance notice.
 */
export async function isGrafanaHealthy(): Promise<boolean> {
  const url = process.env.GRAFANA_HEALTH_URL?.trim() || `${grafanaOrigin()}/grafana/api/health`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}
