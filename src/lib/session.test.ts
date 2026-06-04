import { describe, it, expect, vi, beforeEach } from "vitest";

// Fake cookie store shared with the mocked next/headers module.
const { store } = vi.hoisted(() => ({
  store: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));
vi.mock("next/headers", () => ({ cookies: async () => store }));

import { getToken, setToken, clearToken, SESSION_COOKIE } from "./session";

describe("session", () => {
  beforeEach(() => {
    store.get.mockReset();
    store.set.mockReset();
    store.delete.mockReset();
  });

  it("re-exports the session cookie name", () => {
    expect(SESSION_COOKIE).toBe("js_session");
  });

  describe("getToken", () => {
    it("returns the cookie value when present", async () => {
      store.get.mockReturnValue({ value: "jwt-123" });
      await expect(getToken()).resolves.toBe("jwt-123");
      expect(store.get).toHaveBeenCalledWith(SESSION_COOKIE);
    });

    it("returns null when the cookie is absent", async () => {
      store.get.mockReturnValue(undefined);
      await expect(getToken()).resolves.toBeNull();
    });
  });

  describe("setToken", () => {
    it("writes an httpOnly, lax, root-scoped cookie", async () => {
      await setToken("jwt-xyz", 3600);
      expect(store.set).toHaveBeenCalledWith(
        SESSION_COOKIE,
        "jwt-xyz",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 3600,
        }),
      );
    });

    it("floors and clamps a negative lifetime to zero", async () => {
      await setToken("t", -10);
      expect(store.set.mock.calls[0][2]).toMatchObject({ maxAge: 0 });
      await setToken("t", 90.9);
      expect(store.set.mock.calls[1][2]).toMatchObject({ maxAge: 90 });
    });
  });

  describe("clearToken", () => {
    it("deletes the session cookie", async () => {
      await clearToken();
      expect(store.delete).toHaveBeenCalledWith(SESSION_COOKIE);
    });
  });
});
