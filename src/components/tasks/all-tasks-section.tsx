"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryTag } from "@/components/jobs/category-tag";
import { SchedulePill } from "@/components/jobs/schedule-pill";
import { StatusBadge } from "@/components/jobs/status-badge";
import { FavoriteToggle } from "@/components/jobs/favorite-toggle";
import { DependencyHint } from "@/components/jobs/dependency-hint";
import { TaskActions } from "./task-actions";
import { formatRelative } from "@/lib/format";
import { groupJobsByCategory, compareCategories } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

export function AllTasksSection({
  jobs,
  latestByJob,
  byId,
}: {
  jobs: Job[];
  latestByJob: Map<number, JobRun>;
  byId: Map<number, Job>;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const lastTime = (j: Job) => {
    const r = latestByJob.get(j.id);
    return r ? new Date(r.created_at).getTime() : 0;
  };

  // Group by category; within a group sort by most-recent run; order groups the same.
  const groups = useMemo(() => {
    const map = groupJobsByCategory(jobs);
    const entries = Array.from(map.entries()).map(([cat, list]) => ({
      cat,
      // tasks within a category sort by most-recent run
      list: [...list].sort((a, b) => lastTime(b) - lastTime(a)),
    }));
    // category order is fixed: 未分類 first, then dictionary order
    entries.sort((a, b) => compareCategories(a.cat, b.cat));
    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, latestByJob]);

  function toggle(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <section className="space-y-5">
      <h3 className="text-sm font-semibold tracking-tight">所有任務</h3>

      {jobs.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border py-16 text-center text-sm">
          尚無任務，點右上「新任務」建立。
        </div>
      ) : (
        groups.map(({ cat, list }) => {
          const isCollapsed = collapsed.has(cat);
          return (
            <div key={cat}>
              <button
                type="button"
                onClick={() => toggle(cat)}
                className="text-muted-foreground mb-1 flex w-full items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
              >
                <ChevronDown className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                {cat}
                <span className="text-muted-foreground/50">{list.length}</span>
              </button>
              {!isCollapsed && (
                <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-xl border">
                  {list.map((job) => {
                    const latest = latestByJob.get(job.id);
                    return (
                      <div
                        key={job.id}
                        className="hover:bg-accent/30 flex items-center gap-3 px-3 py-2.5 transition-colors"
                      >
                        <FavoriteToggle jobId={job.id} />

                        <div className="min-w-0 flex-1">
                          {/* DependencyHint is OUTSIDE the link so its dialog doesn't navigate the row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/tasks/${job.id}`} className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-medium hover:underline">{job.name}</span>
                              <CategoryTag category={job.category} />
                              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                                {job.task_type}
                              </span>
                            </Link>
                            <DependencyHint job={job} byId={byId} />
                          </div>
                          <Link href={`/tasks/${job.id}`} className="mt-1 flex items-center gap-2">
                            <SchedulePill job={job} />
                            <span className="text-muted-foreground text-xs">
                              {latest ? `最近 ${formatRelative(latest.created_at)}` : "尚未執行"}
                            </span>
                          </Link>
                        </div>

                        <StatusBadge status={latest?.status} />
                        <TaskActions
                          job={job}
                          latestRun={latest}
                          allJobs={jobs}
                          showDelete
                          size="xs"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
