import { AppShell } from "@/components/app/app-shell";
import { serverJson } from "@/lib/backend";
import type { User } from "@/lib/types";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Restore the session server-side. On 401 serverJson redirects to /login.
  const user = await serverJson<User>("/auth/me");

  return <AppShell user={user}>{children}</AppShell>;
}
