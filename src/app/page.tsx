import { redirect } from "next/navigation";
import { DEFAULT_AUTHED_PATH } from "@/lib/constants";

export default function RootPage() {
  // proxy.ts bounces unauthenticated users to /login before this runs.
  redirect(DEFAULT_AUTHED_PATH);
}
