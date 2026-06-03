"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { RotateCw, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import { isActive, isTerminal } from "@/lib/types";
import type { JobRun } from "@/lib/types";

const revalidate = (key: unknown) =>
  typeof key === "string" && (key.includes("/api/jobs") || key.includes("/api/runs"));

/** Retry (terminal runs) / Cancel (active runs) for a single run. */
export function RunActions({
  run,
  size = "sm",
}: {
  run: JobRun;
  size?: "xs" | "sm" | "default";
}) {
  const { mutate } = useSWRConfig();
  const { push } = useConsole();
  const [busy, setBusy] = useState(false);

  async function act(kind: "retry" | "cancel") {
    if (kind === "cancel" && !window.confirm("確定要停止這個執行嗎？")) return;
    setBusy(true);
    try {
      const next = await api.post<JobRun>(`/api/runs/${run.id}/${kind}`);
      if (kind === "retry") {
        push("info", `已重跑 run #${run.id} → 新 run #${next.id}`);
        toast.success("已重新排入佇列");
      } else {
        push("info", `已要求取消 run #${run.id}`);
        toast.success("已要求取消");
      }
      void mutate(revalidate, undefined, { revalidate: true });
    } catch (err) {
      toast.error(errorMessage(err, kind === "retry" ? "重跑失敗" : "取消失敗"));
    } finally {
      setBusy(false);
    }
  }

  if (isTerminal(run.status)) {
    return (
      <Button type="button" variant="outline" size={size} onClick={() => void act("retry")} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <RotateCw />}
        重跑
      </Button>
    );
  }
  if (isActive(run.status)) {
    return (
      <Button type="button" variant="destructive" size={size} onClick={() => void act("cancel")} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Square />}
        停止
      </Button>
    );
  }
  return null;
}
