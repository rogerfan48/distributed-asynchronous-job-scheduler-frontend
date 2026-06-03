"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Search, List, Columns2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/api-client";
import { JobRow } from "./job-row";
import { LogSplitView, type SplitEntry } from "@/components/logs/log-split-view";
import { groupJobsByCategory, runPhase, type RunPhase } from "@/lib/types";
import { describeSchedule } from "@/lib/format";
import type { Job, JobRun } from "@/lib/types";

const PHASES: { key: RunPhase | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "等待" },
  { key: "running", label: "執行中" },
  { key: "completed", label: "完成" },
  { key: "error", label: "錯誤" },
];

export function JobsBoard({
  initialJobs,
  initialRuns,
}: {
  initialJobs: Job[];
  initialRuns: JobRun[];
}) {
  const { data: jobs = [] } = useSWR<Job[]>("/api/jobs?limit=500", fetcher, {
    fallbackData: initialJobs,
  });
  const { data: runs = [] } = useSWR<JobRun[]>("/api/runs?limit=200", fetcher, {
    fallbackData: initialRuns,
    refreshInterval: 5000,
  });

  const [phase, setPhase] = useState<RunPhase | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "split">("list");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Latest run per job (runs come newest-first from the API).
  const latestByJob = useMemo(() => {
    const map = new Map<number, JobRun>();
    for (const r of runs) if (!map.has(r.job_id)) map.set(r.job_id, r);
    return map;
  }, [runs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (q && !j.name.toLowerCase().includes(q) && !(j.category ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (phase !== "all") {
        const run = latestByJob.get(j.id);
        if (!run || runPhase(run.status) !== phase) return false;
      }
      return true;
    });
  }, [jobs, query, phase, latestByJob]);

  const groups = useMemo(() => groupJobsByCategory(filtered), [filtered]);

  const splitEntries: SplitEntry[] = useMemo(
    () =>
      filtered.map((j) => ({
        id: j.id,
        title: j.name,
        subtitle: j.category?.trim() || describeSchedule(j),
        status: latestByJob.get(j.id)?.status ?? null,
      })),
    [filtered, latestByJob],
  );

  function toggleCollapse(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋名稱或分類…"
            className="pl-9"
          />
        </div>

        <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
          {PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPhase(p.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                phase === p.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn("grid size-7 place-items-center rounded-md", view === "list" ? "bg-background shadow-sm" : "text-muted-foreground")}
            aria-label="清單模式"
            title="清單模式"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("split")}
            className={cn("grid size-7 place-items-center rounded-md", view === "split" ? "bg-background shadow-sm" : "text-muted-foreground")}
            aria-label="快速閱覽模式"
            title="快速閱覽模式（左 job / 右 log）"
          >
            <Columns2 className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border py-16 text-center text-sm">
          {jobs.length === 0 ? "尚無任務，請至「任務執行」建立。" : "沒有符合條件的任務"}
        </div>
      ) : view === "split" ? (
        <LogSplitView entries={splitEntries} logsPath={(id) => `/api/jobs/${id}/logs`} />
      ) : (
        <div className="space-y-5">
          {Array.from(groups.entries()).map(([category, groupJobs]) => {
            const isCollapsed = collapsed.has(category);
            return (
              <section key={category}>
                <button
                  type="button"
                  onClick={() => toggleCollapse(category)}
                  className="text-muted-foreground mb-1 flex w-full items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                  {category}
                  <span className="text-muted-foreground/50">{groupJobs.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="bg-card divide-border/60 divide-y rounded-xl border px-1.5">
                    {groupJobs.map((job) => (
                      <JobRow key={job.id} job={job} latestRun={latestByJob.get(job.id)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
