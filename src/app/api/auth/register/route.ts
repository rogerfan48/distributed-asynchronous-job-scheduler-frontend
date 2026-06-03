import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { setToken } from "@/lib/session";
import { API_PREFIX } from "@/lib/env";
import type { TokenResponse } from "@/lib/types";

export async function POST(req: Request) {
  const incoming = await req.json().catch(() => null);
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ detail: "請求格式錯誤" }, { status: 422 });
  }

  // Registration gate: a passcode hard-set in the frontend env (server-only).
  // When configured, the supplied passcode must match; the field is never
  // forwarded to the backend.
  const { passcode, ...rest } = incoming as Record<string, unknown>;
  const required = process.env.REGISTER_PASSCODE?.trim();
  if (required && passcode !== required) {
    return NextResponse.json({ detail: "註冊碼錯誤" }, { status: 403 });
  }

  let res: Response;
  try {
    res = await backendFetch(`${API_PREFIX}/auth/register`, {
      method: "POST",
      token: null,
      body: JSON.stringify(rest),
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
    return NextResponse.json(data ?? { detail: "註冊失敗" }, { status: res.status });
  }

  const token = data as TokenResponse;
  await setToken(token.access_token, token.expires_in);
  return NextResponse.json({ user: token.user }, { status: 201 });
}
