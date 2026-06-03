"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import { DEFAULT_AUTHED_PATH } from "@/lib/constants";

type Mode = "login" | "register";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string; endpoint: string }> = {
  login: {
    title: "登入",
    subtitle: "輸入帳號密碼以存取任務排程控制台",
    cta: "登入",
    endpoint: "/api/auth/login",
  },
  register: {
    title: "建立帳號",
    subtitle: "註冊一個新的排程器帳號",
    cta: "註冊",
    endpoint: "/api/auth/register",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextTarget(): string {
    if (typeof window === "undefined") return DEFAULT_AUTHED_PATH;
    const next = new URLSearchParams(window.location.search).get("next");
    // Only allow internal paths (avoid open-redirect).
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return DEFAULT_AUTHED_PATH;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload =
        mode === "register"
          ? { username, password, email: email.trim() || undefined }
          : { username, password };
      await api.post(copy.endpoint, payload);
      // Success → navigate away; inline state, no toast needed on the public page.
      router.replace(nextTarget());
      router.refresh();
    } catch (err) {
      // Failures surface via the inline error box below the form.
      setError(errorMessage(err, mode === "login" ? "登入失敗" : "註冊失敗"));
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">{copy.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="username">
            帳號 {mode === "login" && <span className="text-muted-foreground font-normal">（或 Email）</span>}
          </Label>
          <div className="relative">
            <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              className="pl-9"
              disabled={submitting}
            />
          </div>
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-muted-foreground font-normal">（選填）</span>
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
                disabled={submitting}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">密碼</Label>
          <div className="relative">
            <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "至少 8 個字元" : "••••••••"}
              className="px-9"
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md transition-colors"
              aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          {copy.cta}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {mode === "login" ? (
          <>
            還沒有帳號？{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              註冊
            </Link>
          </>
        ) : (
          <>
            已經有帳號？{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              登入
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
