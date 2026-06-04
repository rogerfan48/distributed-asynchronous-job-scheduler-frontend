import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { backendFetchMock, setTokenMock } = vi.hoisted(() => ({
  backendFetchMock: vi.fn(),
  setTokenMock: vi.fn(async () => {}),
}));
vi.mock("@/lib/backend", () => ({ backendFetch: backendFetchMock }));
vi.mock("@/lib/session", () => ({ setToken: setTokenMock }));
vi.mock("@/lib/env", () => ({ API_PREFIX: "/api/v1" }));

import { POST } from "./route";

function registerRequest(body: unknown) {
  return new Request("http://app/api/auth/register", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const successResponse = () =>
  new Response(
    JSON.stringify({ access_token: "jwt", expires_in: 3600, user: { id: 5 } }),
    { status: 201 },
  );

let savedPasscode: string | undefined;
beforeEach(() => {
  backendFetchMock.mockReset();
  setTokenMock.mockReset();
  savedPasscode = process.env.REGISTER_PASSCODE;
  delete process.env.REGISTER_PASSCODE;
});
afterEach(() => {
  if (savedPasscode === undefined) delete process.env.REGISTER_PASSCODE;
  else process.env.REGISTER_PASSCODE = savedPasscode;
});

describe("POST /api/auth/register", () => {
  it("rejects a malformed body with 422", async () => {
    backendFetchMock.mockResolvedValue(successResponse());
    const res = await POST(registerRequest("not json"));
    expect(res.status).toBe(422);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("registers and stores the token when no passcode is required", async () => {
    backendFetchMock.mockResolvedValue(successResponse());
    const res = await POST(registerRequest({ username: "u", password: "password1" }));
    expect(res.status).toBe(201);
    expect(setTokenMock).toHaveBeenCalledWith("jwt", 3600);
  });

  it("rejects a wrong passcode with 403 before calling the backend", async () => {
    process.env.REGISTER_PASSCODE = "secret";
    const res = await POST(
      registerRequest({ username: "u", password: "password1", passcode: "wrong" }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ detail: "註冊碼錯誤" });
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("accepts the correct passcode and strips it before forwarding", async () => {
    process.env.REGISTER_PASSCODE = "secret";
    backendFetchMock.mockResolvedValue(successResponse());
    const res = await POST(
      registerRequest({
        username: "u",
        password: "password1",
        email: "u@e.com",
        passcode: "secret",
      }),
    );
    expect(res.status).toBe(201);
    const forwarded = JSON.parse(backendFetchMock.mock.calls[0][1].body);
    expect(forwarded).toEqual({ username: "u", password: "password1", email: "u@e.com" });
    expect(forwarded).not.toHaveProperty("passcode");
  });

  it("relays a backend validation error", async () => {
    backendFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "username taken" }), { status: 409 }),
    );
    const res = await POST(registerRequest({ username: "dupe", password: "password1" }));
    expect(res.status).toBe(409);
    expect(setTokenMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the backend is unreachable", async () => {
    backendFetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST(registerRequest({ username: "u", password: "password1" }));
    expect(res.status).toBe(502);
  });
});
