import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { redirectMock, getTokenMock } = vi.hoisted(() => ({
  // redirect() throws NEXT_REDIRECT in Next; emulate with an identifiable throw.
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  getTokenMock: vi.fn(async () => "tok" as string | null),
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("./session", () => ({ getToken: getTokenMock }));
vi.mock("./env", () => ({ API_PREFIX: "/api/v1", backendOrigin: () => "http://backend" }));

import { backendFetch, serverJson, serverJsonOrNull } from "./backend";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  redirectMock.mockClear();
  getTokenMock.mockClear();
  getTokenMock.mockResolvedValue("tok");
});
afterEach(() => vi.unstubAllGlobals());

describe("backendFetch", () => {
  it("builds an absolute URL and attaches the bearer token", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await backendFetch("/healthz", { token: "abc" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend/healthz");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer abc");
    expect(init.cache).toBe("no-store");
  });

  it("passes through an already-absolute URL", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await backendFetch("http://other/x", { token: null });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://other/x");
    expect((init.headers as Headers).has("Authorization")).toBe(false);
  });

  it("falls back to the session token when token is undefined", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await backendFetch("/api/v1/jobs");
    expect(getTokenMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer tok");
  });

  it("defaults the content-type for a body, but respects an explicit one", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await backendFetch("/x", { method: "POST", body: "data", token: null });
    expect((fetchMock.mock.calls[0][1].headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );

    fetchMock.mockClear();
    await backendFetch("/x", {
      method: "POST",
      body: "data",
      token: null,
      headers: { "Content-Type": "text/plain" },
    });
    expect((fetchMock.mock.calls[0][1].headers as Headers).get("Content-Type")).toBe("text/plain");
  });
});

describe("serverJson", () => {
  it("returns the parsed JSON on success", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 7 }), { status: 200 }));
    await expect(serverJson("/jobs/7")).resolves.toEqual({ id: 7 });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend/api/v1/jobs/7");
  });

  it("redirects to /login on 401", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));
    await expect(serverJson("/jobs")).rejects.toThrow("REDIRECT /login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects to maintenance on a 5xx", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    await expect(serverJson("/jobs")).rejects.toThrow("REDIRECT /login?reason=maintenance");
    expect(redirectMock).toHaveBeenCalledWith("/login?reason=maintenance");
  });

  it("redirects to maintenance when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(serverJson("/jobs")).rejects.toThrow("REDIRECT /login?reason=maintenance");
  });

  it("throws (→ error boundary) on a genuine 4xx", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 400 }));
    await expect(serverJson("/jobs")).rejects.toThrow(/Backend request failed \(400\)/);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("serverJsonOrNull", () => {
  it("returns null on 404", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }));
    await expect(serverJsonOrNull("/jobs/1/latest-run")).resolves.toBeNull();
  });

  it("returns the parsed JSON on success", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(serverJsonOrNull("/jobs/1/latest-run")).resolves.toEqual({ ok: true });
  });

  it("still throws on other non-OK statuses", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 418 }));
    await expect(serverJsonOrNull("/x")).rejects.toThrow(/Backend request failed \(418\)/);
  });
});
