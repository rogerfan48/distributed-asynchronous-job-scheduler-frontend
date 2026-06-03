"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTag } from "@/components/jobs/category-tag";
import { TaskActions } from "./task-actions";
import { nextRunAt, formatCountdown, formatDateTime } from "@/lib/format";
import { isScheduled } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

export function ScheduledSection({
  jobs,
  latestByJob,
}: {
  jobs: Job[];
  latestByJob: Map<number, JobRun>;
}) {
  // Only enabled cron/interval jobs; sorted by soonest next run.
  const rows = useMemo(() => {
    return jobs
      .filter((j) => isScheduled(j) && j.enabled)
      .map((job) => {
        const lr = latestByJob.get(job.id);
        const next = nextRunAt(job, lr?.started_at ?? lr?.created_at ?? job.created_at);
        return { job, next };
      })
      .sort((a, b) => {
        const ta = a.next?.getTime() ?? Infinity;
        const tb = b.next?.getTime() ?? Infinity;
        return ta - tb;
      });
  }, [jobs, latestByJob]);

  const approxNote = (job: Job) => (job.schedule_type === "interval" ? "約 " : "");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="text-muted-foreground size-4" />
          排程任務
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">尚無啟用中的排程任務</p>
        ) : (
          <ul className="divide-border -my-1 divide-y">
            {rows.map(({ job, next }) => (
              <li
                key={job.id}
                className="hover:bg-accent/40 -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
              >
                <Link href={`/tasks/${job.id}`} className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium hover:underline">{job.name}</span>
                    <CategoryTag category={job.category} />
                    <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {job.task_type}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {approxNote(job)}
                    {formatCountdown(next)}
                    {next && <span className="text-muted-foreground/60"> · {formatDateTime(next.toISOString())}</span>}
                  </span>
                </Link>
                <TaskActions job={job} latestRun={latestByJob.get(job.id)} size="xs" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
