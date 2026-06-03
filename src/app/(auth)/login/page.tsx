import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { MAINTENANCE_MESSAGE } from "@/lib/constants";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const notice = reason === "maintenance" ? MAINTENANCE_MESSAGE : undefined;
  return <AuthForm mode="login" notice={notice} />;
}
