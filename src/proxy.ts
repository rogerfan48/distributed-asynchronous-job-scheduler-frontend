import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, PUBLIC_PATHS, DEFAULT_AUTHED_PATH } from "@/lib/constants";

/**
 * Proxy (formerly Middleware in Next < 16): optimistic auth routing only.
 *
 * It does NOT validate the token — it just checks for the session cookie's
 * presence to redirect early. Real authentication is enforced by the backend
 * (the BFF forwards the token and relays 401s). This avoids flashing protected
 * UI to logged-out users and bouncing logged-in users off the auth pages.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", pathname + search);
    }
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except API (handles its own 401), Next internals,
  // and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
