"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteToggle } from "@/components/jobs/favorite-toggle";
import { TriggerButton } from "@/components/jobs/trigger-button";
import { describeSchedule } from "@/lib/format";
import { isScheduled } from "@/lib/types";
import type { Job } from "@/lib/types";

export function ScheduledSection({ jobs }: { jobs: Job[] }) {
  const scheduled = jobs.filter(isScheduled);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="text-muted-foreground size-4" />
          排程任務
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduled.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">尚無排程任務</p>
        ) : (
          <ul className="divide-border -my-1 divide-y">
            {scheduled.map((job) => (
              <li key={job.id} className="flex items-center gap-2 py-2">
                <FavoriteToggle jobId={job.id} />
                <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium hover:underline">
                      {job.name}
                    </span>
                    {!job.enabled && (
                      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
                        已停用
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {describeSchedule(job)}
                  </span>
                </Link>
                <TriggerButton jobId={job.id} jobName={job.name} variant="ghost" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
