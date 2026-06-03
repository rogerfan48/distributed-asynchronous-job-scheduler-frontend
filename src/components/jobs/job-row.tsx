"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { FavoriteToggle } from "./favorite-toggle";
import { TriggerButton } from "./trigger-button";
import { LogModal } from "@/components/logs/log-modal";
import { describeSchedule, formatRelative } from "@/lib/format";
import { isActive } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

export function JobRow({ job, latestRun }: { job: Job; latestRun?: JobRun }) {
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="hover:bg-accent/30 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors">
      <FavoriteToggle jobId={job.id} />

      <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium hover:underline">{job.name}</span>
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
            {job.task_type}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {describeSchedule(job)}
          {latestRun ? ` · 最近 ${formatRelative(latestRun.created_at)}` : " · 尚未執行"}
        </p>
      </Link>

      <StatusBadge status={latestRun?.status} />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLog(true)}
          disabled={!latestRun}
          title={latestRun ? "檢視 log" : "尚未執行"}
        >
          <ScrollText />
          Log
        </Button>
        <TriggerButton jobId={job.id} jobName={job.name} variant="ghost" />
        <Button render={<Link href={`/jobs/${job.id}`} />} variant="ghost" size="icon-sm" aria-label="詳情">
          <ChevronRight />
        </Button>
      </div>

      <LogModal
        open={showLog}
        onOpenChange={setShowLog}
        title={job.name}
        subtitle="最新執行 log"
        logsPath={`/api/jobs/${job.id}/logs`}
        active={isActive(latestRun?.status)}
      />
    </div>
  );
}
