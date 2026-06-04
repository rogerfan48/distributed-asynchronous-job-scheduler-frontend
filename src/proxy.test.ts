import { describe, it, expect, vi } from "vitest";

// Lightweight NextResponse: capture redirect targets, mark pass-throughs.
vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => ({ kind: "redirect", location: url.toString() }),
    next: () => ({ kind: "next" }),
  },
}));

import { proxy, config } from "./proxy";

/** Build a minimal NextRequest stand-in for the proxy. */
function makeRequest(pathname: string, search = "", hasSession = false) {
  const nextUrl = new URL(`https://app.test${pathname}${search}`);
  return {
    nextUrl: Object.assign(nextUrl, { clone: () => new URL(nextUrl.toString()) }),
    cookies: { has: (name: string) => hasSession && name === "js_session" },
  } as unknown as Parameters<typeof proxy>[0];
}

describe("proxy auth routing", () => {
  it("redirects an anonymous user from a protected route to /login?next=…", () => {
    const res = proxy(makeRequest("/tasks", "?tab=all", false)) as unknown as {
      kind: string;
      location: string;
    };
    expect(res.kind).toBe("redirect");
    expect(res.location).toContain("/login");
    expect(res.location).toContain(`next=${encodeURIComponent("/tasks?tab=all")}`);
  });

  it("redirects anonymous root without a next param", () => {
    const res = proxy(makeRequest("/", "", false)) as unknown as {
      kind: string;
      location: string;
    };
    expect(res.kind).toBe("redirect");
    expect(res.location).toContain("/login");
    expect(res.location).not.toContain("next=");
  });

  it("lets an anonymous user reach public auth pages", () => {
    expect((proxy(makeRequest("/login", "", false)) as unknown as { kind: string }).kind).toBe(
      "next",
    );
    expect((proxy(makeRequest("/register", "", false)) as unknown as { kind: string }).kind).toBe(
      "next",
    );
  });

  it("bounces a logged-in user off the auth pages to the default route", () => {
    const res = proxy(makeRequest("/login", "", true)) as unknown as {
      kind: string;
      location: string;
    };
    expect(res.kind).toBe("redirect");
    expect(res.location).toContain("/tasks");
  });

  it("does NOT bounce a logged-in user off /login when a reason is present", () => {
    // Prevents the /tasks → maintenance → /login → /tasks loop on outages.
    const res = proxy(makeRequest("/login", "?reason=maintenance", true)) as unknown as {
      kind: string;
    };
    expect(res.kind).toBe("next");
  });

  it("lets a logged-in user through to a protected route", () => {
    expect((proxy(makeRequest("/tasks", "", true)) as unknown as { kind: string }).kind).toBe(
      "next",
    );
  });

  it("excludes api, internals and static assets via the matcher", () => {
    const m = config.matcher[0];
    expect(m).toContain("api");
    expect(m).toContain("_next/static");
  });
});
