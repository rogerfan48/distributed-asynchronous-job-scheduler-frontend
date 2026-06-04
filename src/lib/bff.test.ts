import { describe, it, expect, vi, beforeEach } from "vitest";

const { getTokenMock, backendFetchMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(async () => "tok" as string | null),
  backendFetchMock: vi.fn(),
}));
vi.mock("./session", () => ({ getToken: getTokenMock }));
vi.mock("./backend", () => ({ backendFetch: backendFetchMock }));
vi.mock("./env", () => ({ API_PREFIX: "/api/v1" }));

import { proxyApi } from "./bff";

beforeEach(() => {
  getTokenMock.mockReset();
  getTokenMock.mockResolvedValue("tok");
  backendFetchMock.mockReset();
});

describe("proxyApi auth gate", () => {
  it("returns 401 without forwarding when auth is required and absent", async () => {
    getTokenMock.mockResolvedValue(null);
    const res = await proxyApi(new Request("http://app/api/jobs"), "/jobs");
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ detail: "未登入或登入已過期" });
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("forwards unauthenticated when requireAuth is false", async () => {
    getTokenMock.mockResolvedValue(null);
    backendFetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await proxyApi(new Request("http://app/api/auth/login", { method: "POST" }), "/auth/login", {
      requireAuth: false,
    });
    expect(backendFetchMock).toHaveBeenCalled();
  });
});

describe("proxyApi forwarding", () => {
  it("preserves the path, query string, method, token and body", async () => {
    backendFetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 201 }));
    const req = new Request("http://app/api/jobs?enabled=true&limit=5", {
      method: "POST",
      body: JSON.stringify({ name: "x" }),
      headers: { "content-type": "application/json" },
    });
    await proxyApi(req, "/jobs");

    const [path, init] = backendFetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/jobs?enabled=true&limit=5");
    expect(init.method).toBe("POST");
    expect(init.token).toBe("tok");
    expect(new TextDecoder().decode(init.body)).toBe(JSON.stringify({ name: "x" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("sends no body for a GET", async () => {
    backendFetchMock.mockResolvedValue(new Response("[]", { status: 200 }));
    await proxyApi(new Request("http://app/api/jobs"), "/jobs");
    const [, init] = backendFetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  it("relays the backend status, body and content-type", async () => {
    backendFetchMock.mockResolvedValue(
      new Response("teapot", { status: 418, headers: { "content-type": "text/plain" } }),
    );
    const res = await proxyApi(new Request("http://app/api/x"), "/x");
    expect(res.status).toBe(418);
    expect(res.headers.get("content-type")).toBe("text/plain");
    await expect(res.text()).resolves.toBe("teapot");
  });

  it("relays an empty body verbatim", async () => {
    backendFetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const res = await proxyApi(new Request("http://app/api/x", { method: "DELETE" }), "/x");
    expect(res.status).toBe(204);
    await expect(res.text()).resolves.toBe("");
  });

  it("returns 502 when the backend is unreachable", async () => {
    backendFetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await proxyApi(new Request("http://app/api/jobs"), "/jobs");
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ detail: expect.stringContaining("後端") });
  });
});
