import { describe, it, expect, vi, beforeEach } from "vitest";

const { backendFetchMock, setTokenMock } = vi.hoisted(() => ({
  backendFetchMock: vi.fn(),
  setTokenMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/backend", () => ({ backendFetch: backendFetchMock }));
vi.mock("@/lib/session", () => ({ setToken: setTokenMock }));
vi.mock("@/lib/env", () => ({ API_PREFIX: "/api/v1" }));

import { POST } from "./route";

function loginRequest(body: unknown) {
  return new Request("http://app/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  backendFetchMock.mockReset();
  setTokenMock.mockReset();
});

describe("POST /api/auth/login", () => {
  it("stores the token in a cookie and returns only the user", async () => {
    backendFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "jwt", expires_in: 3600, user: { id: 1, username: "a" } }),
        { status: 200 },
      ),
    );
    const res = await POST(loginRequest({ username: "a", password: "b" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: { id: 1, username: "a" } });
    expect(setTokenMock).toHaveBeenCalledWith("jwt", 3600);
    // The token itself must never be sent to the browser.
    expect(JSON.stringify(body)).not.toContain("jwt");
  });

  it("relays a backend auth failure without setting a cookie", async () => {
    backendFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "帳號或密碼錯誤" }), { status: 401 }),
    );
    const res = await POST(loginRequest({ username: "a", password: "bad" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ detail: "帳號或密碼錯誤" });
    expect(setTokenMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the backend is unreachable", async () => {
    backendFetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST(loginRequest({ username: "a", password: "b" }));
    expect(res.status).toBe(502);
    expect(setTokenMock).not.toHaveBeenCalled();
  });
});
