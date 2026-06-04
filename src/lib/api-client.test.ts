import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, isBackendDown, errorMessage, api, fetcher } from "./api-client";

function jsonResponse(status: number, data: unknown): Response {
  return new Response(data === null ? "" : JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("ApiError", () => {
  it("carries status + detail and a default message", () => {
    const e = new ApiError(404, { detail: "nope" });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ApiError");
    expect(e.status).toBe(404);
    expect(e.detail).toEqual({ detail: "nope" });
    expect(e.message).toBe("Request failed (404)");
  });

  it("accepts a custom message", () => {
    expect(new ApiError(401, null, "unauthorized").message).toBe("unauthorized");
  });
});

describe("isBackendDown", () => {
  it("is true only for 502 / 503 ApiErrors", () => {
    expect(isBackendDown(new ApiError(502, null))).toBe(true);
    expect(isBackendDown(new ApiError(503, null))).toBe(true);
    expect(isBackendDown(new ApiError(500, null))).toBe(false);
    expect(isBackendDown(new ApiError(401, null))).toBe(false);
    expect(isBackendDown(new Error("boom"))).toBe(false);
    expect(isBackendDown("nope")).toBe(false);
  });
});

describe("errorMessage", () => {
  it("returns a plain string detail", () => {
    expect(errorMessage(new ApiError(400, "壞掉了"))).toBe("壞掉了");
  });

  it("joins FastAPI 422 field errors", () => {
    const detail = [{ msg: "field a" }, { msg: "field b" }];
    expect(errorMessage(new ApiError(422, detail))).toBe("field a；field b");
  });

  it("reads a nested { detail } object", () => {
    expect(errorMessage(new ApiError(403, { detail: "禁止" }))).toBe("禁止");
  });

  it("falls back to the ApiError message for opaque detail", () => {
    expect(errorMessage(new ApiError(500, 12345))).toBe("Request failed (500)");
  });

  it("handles plain Errors and unknown values", () => {
    expect(errorMessage(new Error("kaboom"))).toBe("kaboom");
    expect(errorMessage(null)).toBe("發生未預期的錯誤");
    expect(errorMessage(null, "自訂")).toBe("自訂");
  });
});

describe("api client requests", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("GET parses and returns a JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 1, name: "job" }));
    await expect(api.get("/api/jobs/1")).resolves.toEqual({ id: 1, name: "job" });
    expect(fetchMock).toHaveBeenCalledWith("/api/jobs/1", expect.objectContaining({ method: "GET" }));
  });

  it("fetcher delegates to a GET request", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [1, 2, 3]));
    await expect(fetcher("/api/runs")).resolves.toEqual([1, 2, 3]);
  });

  it("POST serialises the body and sets a JSON content-type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { ok: true }));
    await api.post("/api/jobs", { name: "x" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("POST without data sends no body or content-type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(202, {}));
    await api.post("/api/jobs/1/trigger");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty("Content-Type");
  });

  it("returns null for an empty response body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.del("/api/jobs/1")).resolves.toBeNull();
  });

  it("returns raw text when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("plain text", { status: 200 }));
    await expect(api.get("/api/thing")).resolves.toBe("plain text");
  });

  it("throws an ApiError carrying the extracted detail on non-OK", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { detail: "conflict" }));
    await expect(api.post("/api/runs/1/retry")).rejects.toMatchObject({
      status: 409,
      detail: "conflict",
    });
  });
});

describe("api client 401 handling", () => {
  const fetchMock = vi.fn();
  let originalLocation: Location;

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { pathname: "/tasks", search: "?a=1", href: "" },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it("throws ApiError(401) and redirects to /login with a next param", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "unauth" }));
    await expect(api.get("/api/jobs")).rejects.toMatchObject({ status: 401 });
    expect(window.location.href).toBe("/login?next=%2Ftasks%3Fa%3D1");
  });

  it("does not redirect when already on the login page", async () => {
    (window.location as unknown as { pathname: string }).pathname = "/login";
    window.location.href = "";
    fetchMock.mockResolvedValue(jsonResponse(401, null));
    await expect(api.get("/api/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(window.location.href).toBe("");
  });
});
