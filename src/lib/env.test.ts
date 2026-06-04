import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { API_PREFIX, backendOrigin } from "./env";

describe("env", () => {
  const KEY = "BACKEND_ORIGIN";
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env[KEY];
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  it("exposes the backend API prefix", () => {
    expect(API_PREFIX).toBe("/api/v1");
  });

  it("returns the configured origin", () => {
    process.env[KEY] = "http://10.0.0.1:8000";
    expect(backendOrigin()).toBe("http://10.0.0.1:8000");
  });

  it("strips trailing slashes", () => {
    process.env[KEY] = "http://backend//";
    expect(backendOrigin()).toBe("http://backend");
  });

  it("trims surrounding whitespace", () => {
    process.env[KEY] = "  http://backend  ";
    expect(backendOrigin()).toBe("http://backend");
  });

  it("throws a helpful error when unset", () => {
    delete process.env[KEY];
    expect(() => backendOrigin()).toThrow(/BACKEND_ORIGIN is not configured/);
  });

  it("throws when set to only whitespace", () => {
    process.env[KEY] = "   ";
    expect(() => backendOrigin()).toThrow();
  });
});
