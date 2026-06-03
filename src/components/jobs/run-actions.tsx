"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { RotateCw, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-confirm";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import { isActive, isTerminal } from "@/lib/types";
import type { JobRun } from "@/lib/types";

const revalidate = (key: unknown) =>
  typeof key === "string" && (key.includes("/api/jobs") || key.includes("/api/runs"));

/**
 * Retry (terminal runs) / 終止 (active runs) for a single historical run.
 * Uses the same styled ConfirmDialog + wording as the execution panel.
 */
export function RunActions({
  run,
  size = "sm",
}: {
  run: JobRun;
  size?: "xs" | "sm" | "default";
}) {
  const { mutate } = useSWRConfig();
  const { push } = useConsole();
  const [confirm, setConfirm] = useState<null | "retry" | "cancel">(null);

  async function act(kind: "retry" | "cancel") {
    try {
      const next = await api.post<JobRun>(`/api/runs/${run.id}/${kind}`);
      if (kind === "retry") {
        push("info", `已重跑 run #${run.id} → 新 run #${next.id}`);
        toast.success("已重新排入佇列");
      } else {
        push("info", `已要求終止 run #${run.id}`);
        toast.success("已要求終止");
      }
      void mutate(revalidate, undefined, { revalidate: true });
    } catch (err) {
      toast.error(errorMessage(err, kind === "retry" ? "重跑失敗" : "終止失敗"));
      throw err;
    }
  }

  if (isTerminal(run.status)) {
    return (
      <>
        <Button type="button" variant="outline" size={size} onClick={() => setConfirm("retry")}>
          <RotateCw />
          重跑
        </Button>
        <ConfirmDialog
          open={confirm === "retry"}
          onOpenChange={(o) => !o && setConfirm(null)}
          title={`重跑 run #${run.id}？`}
          description="會以相同設定建立一個新的執行。"
          confirmLabel="重跑"
          onConfirm={() => act("retry")}
        />
      </>
    );
  }

  if (isActive(run.status)) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size={size}
          className="text-status-failed"
          onClick={() => setConfirm("cancel")}
        >
          <Square />
          終止
        </Button>
        <ConfirmDialog
          open={confirm === "cancel"}
          onOpenChange={(o) => !o && setConfirm(null)}
          destructive
          title={`終止 run #${run.id}？`}
          description="會要求 worker 中止這次執行。"
          confirmLabel="終止執行"
          onConfirm={() => act("cancel")}
        />
      </>
    );
  }

  return null;
}
