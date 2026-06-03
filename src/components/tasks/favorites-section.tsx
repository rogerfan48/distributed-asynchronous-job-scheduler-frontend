"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteToggle } from "@/components/jobs/favorite-toggle";
import { TriggerButton } from "@/components/jobs/trigger-button";
import { useFavorites } from "@/lib/use-favorites";
import { describeSchedule } from "@/lib/format";
import type { Job } from "@/lib/types";

export function FavoritesSection({ jobs }: { jobs: Job[] }) {
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
            點任務列上的{" "}
            <Star className="text-muted-foreground/70 inline size-3.5 align-text-bottom" />{" "}
            星號即可加入常用
          </p>
        ) : (
          <ul className="divide-border -my-1 divide-y">
            {favJobs.map((job) => (
              <li key={job.id} className="flex items-center gap-2 py-2">
                <FavoriteToggle jobId={job.id} />
                <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium hover:underline">
                    {job.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
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
