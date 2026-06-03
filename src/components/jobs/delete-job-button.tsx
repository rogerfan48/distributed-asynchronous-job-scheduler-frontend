"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-confirm";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import { dependentsOf } from "@/lib/types";
import type { Job } from "@/lib/types";

/** Delete a job with a confirmation that warns about downstream dependents. */
export function DeleteJobButton({
  job,
  allJobs,
  size = "icon-sm",
}: {
  job: Job;
  allJobs: Job[];
  size?: "icon-xs" | "icon-sm" | "icon";
}) {
  const { mutate } = useSWRConfig();
  const { push } = useConsole();
  const [open, setOpen] = useState(false);
  const dependents = dependentsOf(job.id, allJobs);

  async function del() {
    try {
      await api.del(`/api/jobs/${job.id}`);
      push("info", `已刪除任務 #${job.id}「${job.name}」`);
      toast.success(`已刪除「${job.name}」`);
      void mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/api/jobs") || key.includes("/api/runs")),
      );
    } catch (err) {
      toast.error(errorMessage(err, "刪除失敗"));
      throw err;
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        aria-label="刪除任務"
        title="刪除任務"
        className="text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        title={`刪除任務「${job.name}」？`}
        confirmLabel="刪除"
        onConfirm={del}
        description={
          <>
            此動作會一併刪除該任務的所有執行紀錄與 log，且無法復原。
            {dependents.length > 0 && (
              <div className="border-status-failed/30 bg-status-failed/10 mt-3 rounded-md border p-2">
                <p className="text-status-failed font-medium">
                  ⚠ 有 {dependents.length} 個任務相依於它，刪除後可能無法觸發：
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {dependents.map((d) => (
                    <li key={d.id}>{d.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        }
      />
    </>
  );
}
