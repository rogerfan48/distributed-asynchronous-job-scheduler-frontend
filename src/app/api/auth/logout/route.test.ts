import { describe, it, expect, vi, beforeEach } from "vitest";

const { clearTokenMock } = vi.hoisted(() => ({ clearTokenMock: vi.fn(async () => {}) }));
vi.mock("@/lib/session", () => ({ clearToken: clearTokenMock }));

import { POST } from "./route";

beforeEach(() => clearTokenMock.mockReset());

describe("POST /api/auth/logout", () => {
  it("clears the session cookie and returns 204", async () => {
    const res = await POST();
    expect(res.status).toBe(204);
    expect(clearTokenMock).toHaveBeenCalledOnce();
  });
});
