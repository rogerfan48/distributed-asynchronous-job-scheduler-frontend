"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Play, Square, RotateCcw, Loader2, CalendarOff, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-confirm";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import { isActive, isScheduled } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

type Size = "xs" | "sm" | "default";

/**
 * Action cluster for a task. Layout (omits absent parts):
 *   [終止] [重試]  [啟用/停用排程]  [執行]  [刪除]
 * - 終止/重試 appear only while the latest run is active; both confirm first.
 *   重試 = cancel current run then trigger a new one.
 * - 啟用/停用排程 appears for cron/interval jobs.
 */
export function TaskActions({
  job,
  latestRun,
  allJobs,
  showDelete = false,
  size = "sm",
}: {
  job: Job;
  latestRun?: JobRun | null;
  allJobs?: Job[];
  showDelete?: boolean;
  size?: Size;
}) {
  const { mutate } = useSWRConfig();
  const { push } = useConsole();
  const [busy, setBusy] = useState<null | "trigger" | "toggle">(null);
  const [confirm, setConfirm] = useState<null | "cancel" | "retry">(null);

  const active = isActive(latestRun?.status);
  const scheduled = isScheduled(job);

  function revalidate() {
    void mutate(
      (key) =>
        typeof key === "string" && (key.includes("/api/jobs") || key.includes("/api/runs")),
    );
  }

  async function trigger() {
    setBusy("trigger");
    try {
      const run = await api.post<JobRun>(`/api/jobs/${job.id}/trigger`);
      push("info", `已觸發 #${job.id}「${job.name}」→ run #${run.id}`);
      toast.success("已排入佇列");
      revalidate();
    } catch (e) {
      toast.error(errorMessage(e, "觸發失敗"));
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!latestRun) return;
    try {
      await api.post(`/api/runs/${latestRun.id}/cancel`);
      push("info", `已要求終止「${job.name}」run #${latestRun.id}`);
      toast.success("已要求終止");
      revalidate();
    } catch (e) {
      toast.error(errorMessage(e, "終止失敗"));
      throw e;
    }
  }

  async function retry() {
    if (!latestRun) return;
    try {
      // best-effort cancel the in-flight run, then trigger a fresh one
      await api.post(`/api/runs/${latestRun.id}/cancel`).catch(() => {});
      const run = await api.post<JobRun>(`/api/jobs/${job.id}/trigger`);
      push("info", `重試「${job.name}」→ run #${run.id}`);
      toast.success("已重新觸發");
      revalidate();
    } catch (e) {
      toast.error(errorMessage(e, "重試失敗"));
      throw e;
    }
  }

  async function toggleSchedule() {
    setBusy("toggle");
    try {
      await api.put(`/api/jobs/${job.id}`, { enabled: !job.enabled });
      push("info", `${job.enabled ? "已停用" : "已啟用"}排程：「${job.name}」`);
      toast.success(job.enabled ? "已停用排程" : "已啟用排程");
      revalidate();
    } catch (e) {
      toast.error(errorMessage(e, "切換排程失敗"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {active && (
        <>
          <Button
            type="button"
            variant="ghost"
            size={size}
            className="text-status-failed"
            disabled={busy !== null}
            onClick={(e) => {
              e.preventDefault();
              setConfirm("cancel");
            }}
          >
            <Square />
            終止
          </Button>
          <Button
            type="button"
            variant="ghost"
            size={size}
            disabled={busy !== null}
            onClick={(e) => {
              e.preventDefault();
              setConfirm("retry");
            }}
          >
            <RotateCcw />
            重試
          </Button>
        </>
      )}

      {scheduled && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={busy !== null}
          onClick={(e) => {
            e.preventDefault();
            void toggleSchedule();
          }}
        >
          {busy === "toggle" ? (
            <Loader2 className="animate-spin" />
          ) : job.enabled ? (
            <CalendarOff />
          ) : (
            <CalendarCheck />
          )}
          {job.enabled ? "停用排程" : "啟用排程"}
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={busy !== null}
        onClick={(e) => {
          e.preventDefault();
          void trigger();
        }}
      >
        {busy === "trigger" ? <Loader2 className="animate-spin" /> : <Play />}
        執行
      </Button>

      {showDelete && allJobs && (
        <DeleteJobButton job={job} allJobs={allJobs} size={size === "xs" ? "icon-xs" : "icon-sm"} />
      )}

      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        destructive
        title={`終止「${job.name}」目前的執行？`}
        description="會要求 worker 中止這次執行。"
        confirmLabel="終止執行"
        onConfirm={cancel}
      />
      <ConfirmDialog
        open={confirm === "retry"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`重試「${job.name}」？`}
        description="會先取消目前的執行，再重新觸發一個新的執行。"
        confirmLabel="重試"
        onConfirm={retry}
      />
    </div>
  );
}
