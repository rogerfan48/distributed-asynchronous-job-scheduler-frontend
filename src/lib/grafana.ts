import "server-only";

export function grafanaOrigin(): string {
  return (process.env.GRAFANA_ORIGIN?.trim() || "http://localhost:8787").replace(/\/+$/, "");
}

export function grafanaDashboardUrl(): string {
  return (
    process.env.GRAFANA_DASHBOARD_URL?.trim() ||
    `${grafanaOrigin()}/dashboards?query=cloudNative`
  );
}
