import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { grafanaOrigin, grafanaDashboardUrl, isGrafanaHealthy } from "./grafana";

const ENV_KEYS = ["GRAFANA_ORIGIN", "GRAFANA_DASHBOARD_URL", "GRAFANA_HEALTH_URL"] as const;

describe("grafana config", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  describe("grafanaOrigin", () => {
    it("defaults to localhost when unset", () => {
      expect(grafanaOrigin()).toBe("http://localhost:8787");
    });
    it("uses the env value, trimmed and without trailing slash", () => {
      process.env.GRAFANA_ORIGIN = "  http://10.0.0.3:8787/ ";
      expect(grafanaOrigin()).toBe("http://10.0.0.3:8787");
    });
  });

  describe("grafanaDashboardUrl", () => {
    it("is empty when unset", () => {
      expect(grafanaDashboardUrl()).toBe("");
    });
    it("returns the trimmed relative path", () => {
      process.env.GRAFANA_DASHBOARD_URL = "  /grafana/public-dashboards/abc  ";
      expect(grafanaDashboardUrl()).toBe("/grafana/public-dashboards/abc");
    });

    it("is empty for non-grafana paths to avoid self-embedding the app", () => {
      process.env.GRAFANA_DASHBOARD_URL = "/";
      expect(grafanaDashboardUrl()).toBe("");
    });

    it("is empty for absolute URLs; nginx should expose Grafana under the same-origin sub-path", () => {
      process.env.GRAFANA_DASHBOARD_URL = "https://jobs.roger.tw/grafana/public-dashboards/abc";
      expect(grafanaDashboardUrl()).toBe("");
    });
  });

  describe("isGrafanaHealthy", () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockReset();
    });
    afterEach(() => vi.unstubAllGlobals());

    it("is true on a 2xx health response", async () => {
      fetchMock.mockResolvedValue(
        Response.json({ database: "ok", version: "12.0.0", commit: "abc" }),
      );
      await expect(isGrafanaHealthy()).resolves.toBe(true);
    });

    it("is false on a non-2xx response", async () => {
      fetchMock.mockResolvedValue(new Response("", { status: 503 }));
      await expect(isGrafanaHealthy()).resolves.toBe(false);
    });

    it("is false when the request throws (timeout / unreachable)", async () => {
      fetchMock.mockRejectedValue(new Error("network"));
      await expect(isGrafanaHealthy()).resolves.toBe(false);
    });

    it("is false for redirected responses so Next login pages cannot pass the gate", async () => {
      fetchMock.mockResolvedValue(
        new Response("", { status: 307, headers: { location: "/login" } }),
      );
      await expect(isGrafanaHealthy()).resolves.toBe(false);
    });

    it("is false for 2xx HTML responses from a misrouted same-origin path", async () => {
      fetchMock.mockResolvedValue(
        new Response("<!doctype html><title>Job Scheduler</title>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
      await expect(isGrafanaHealthy()).resolves.toBe(false);
    });

    it("is false for JSON that is not the Grafana health payload", async () => {
      fetchMock.mockResolvedValue(Response.json({ authenticated: false }));
      await expect(isGrafanaHealthy()).resolves.toBe(false);
    });

    it("checks the default origin-derived health URL", async () => {
      process.env.GRAFANA_ORIGIN = "http://10.0.0.3:8787";
      fetchMock.mockResolvedValue(Response.json({ database: "ok" }));
      await isGrafanaHealthy();
      expect(fetchMock).toHaveBeenCalledWith(
        "http://10.0.0.3:8787/grafana/api/health",
        expect.objectContaining({ cache: "no-store", redirect: "manual" }),
      );
    });

    it("honours an explicit GRAFANA_HEALTH_URL override", async () => {
      process.env.GRAFANA_HEALTH_URL = "http://custom/health";
      fetchMock.mockResolvedValue(Response.json({ database: "ok" }));
      await isGrafanaHealthy();
      expect(fetchMock).toHaveBeenCalledWith("http://custom/health", expect.anything());
    });
  });
});
