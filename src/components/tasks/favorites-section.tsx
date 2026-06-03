"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTag } from "@/components/jobs/category-tag";
import { TaskActions } from "./task-actions";
import { useFavorites } from "@/lib/use-favorites";
import type { Job, JobRun } from "@/lib/types";

export function FavoritesSection({
  jobs,
  latestByJob,
}: {
  jobs: Job[];
  latestByJob: Map<number, JobRun>;
}) {
  const { favorites } = useFavorites();
  const favJobs = jobs.filter((j) => favorites.includes(j.id));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="text-status-queued size-4" />
          常用任務
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favJobs.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            在「所有任務」點任務列的{" "}
            <Star className="text-muted-foreground/70 inline size-3.5 align-text-bottom" />{" "}
            星號即可加入常用
          </p>
        ) : (
          <ul className="divide-border -my-1 divide-y">
            {favJobs.map((job) => (
              <li
                key={job.id}
                className="hover:bg-accent/40 -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
              >
                <Link href={`/tasks/${job.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium hover:underline">{job.name}</span>
                  <CategoryTag category={job.category} />
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                    {job.task_type}
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
