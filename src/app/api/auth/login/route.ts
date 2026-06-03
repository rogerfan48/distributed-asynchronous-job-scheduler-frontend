import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { setToken } from "@/lib/session";
import { API_PREFIX } from "@/lib/env";
import type { TokenResponse } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.text();
  let res: Response;
  try {
    res = await backendFetch(`${API_PREFIX}/auth/login`, {
      method: "POST",
      token: null,
      body,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { detail: "無法連線到後端排程服務，請稍後再試。" },
      { status: 502 },
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json(data ?? { detail: "登入失敗" }, { status: res.status });
  }

  const token = data as TokenResponse;
  await setToken(token.access_token, token.expires_in);
  // Token stays in the httpOnly cookie; only the user profile is returned.
  return NextResponse.json({ user: token.user }, { status: 200 });
}
