"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import type { JobRun } from "@/lib/types";

/** Manually trigger a job. Revalidates jobs/runs SWR caches on success. */
export function TriggerButton({
  jobId,
  jobName,
  size = "sm",
  variant = "outline",
  className,
}: {
  jobId: number;
  jobName?: string;
  size?: "xs" | "sm" | "default";
  variant?: "outline" | "secondary" | "ghost" | "default";
  className?: string;
}) {
  const { mutate } = useSWRConfig();
  const { push } = useConsole();
  const [loading, setLoading] = useState(false);

  async function trigger() {
    setLoading(true);
    try {
      const run = await api.post<JobRun>(`/api/jobs/${jobId}/trigger`);
      push("info", `已觸發任務 #${jobId}${jobName ? `「${jobName}」` : ""} → run #${run.id}`);
      toast.success("已排入佇列");
      void mutate(
        (key) =>
          typeof key === "string" &&
          (key.includes("/api/jobs") || key.includes("/api/runs")),
        undefined,
        { revalidate: true },
      );
    } catch (err) {
      toast.error(errorMessage(err, "觸發失敗"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={() => void trigger()}
      disabled={loading}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Play />}
      執行
    </Button>
  );
}
