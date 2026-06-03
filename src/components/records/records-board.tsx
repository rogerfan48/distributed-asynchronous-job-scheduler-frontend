"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search, List, Columns2, ChevronDown, ScrollText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/api-client";
import { StatusBadge } from "@/components/jobs/status-badge";
import { LogModal } from "@/components/logs/log-modal";
import { LogSplitView, type SplitEntry } from "@/components/logs/log-split-view";
import { formatRelative, formatDateTime } from "@/lib/format";
import { jobCategory, runPhase, isActive, compareCategories, type RunPhase } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

const PHASES: { key: RunPhase | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "等待中" },
  { key: "running", label: "執行中" },
  { key: "completed", label: "成功" },
  { key: "error", label: "失敗" },
];

const TRIGGER_LABEL: Record<string, string> = {
  manual: "手動",
  scheduled: "排程",
  dependency: "依賴",
  retry: "重試",
};

// Fixed, distinct colours so 手動 vs 排程 are easy to tell apart.
const TRIGGER_COLOR: Record<string, string> = {
  manual: "text-slate-400",
  scheduled: "text-sky-400",
  dependency: "text-amber-400",
  retry: "text-fuchsia-400",
};

export function RecordsBoard({
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

  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j] as const)), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      const job = byId.get(r.job_id);
      if (phase !== "all" && runPhase(r.status) !== phase) return false;
      if (q) {
        const name = job?.name?.toLowerCase() ?? "";
        const cat = (job?.category ?? "").toLowerCase();
        if (!name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [runs, byId, phase, query]);

  // Group runs by their job's category (runs are newest-first → group order = recency).
  const groups = useMemo(() => {
    const map = new Map<string, JobRun[]>();
    for (const r of filtered) {
      const cat = jobCategory(byId.get(r.job_id) ?? { category: null });
      const bucket = map.get(cat);
      if (bucket) bucket.push(r);
      else map.set(cat, [r]);
    }
    // category order fixed (未分類 first, then dict); runs within stay newest-first
    return Array.from(map.entries()).sort((a, b) => compareCategories(a[0], b[0]));
  }, [filtered, byId]);

  const splitEntries: SplitEntry[] = useMemo(
    () =>
      filtered.map((r) => {
        const job = byId.get(r.job_id);
        return {
          id: r.id,
          title: job?.name ?? `Job #${r.job_id}`,
          subtitle: `#Run ${r.id} · ${TRIGGER_LABEL[r.trigger_type] ?? r.trigger_type}`,
          category: jobCategory(job ?? { category: null }),
          status: r.status,
        };
      }),
    [filtered, byId],
  );

  function toggle(cat: string) {
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
            placeholder="搜尋任務名稱或分類…"
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
            title="快速閱覽模式（左 Run / 右 log）"
          >
            <Columns2 className="size-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border py-16 text-center text-sm">
          {runs.length === 0 ? "尚無執行紀錄。" : "沒有符合條件的紀錄"}
        </div>
      ) : view === "split" ? (
        <LogSplitView entries={splitEntries} logsPath={(id) => `/api/runs/${id}/logs`} />
      ) : (
        <div className="space-y-5">
          {groups.map(([category, groupRuns]) => {
            const isCollapsed = collapsed.has(category);
            return (
              <section key={category}>
                <button
                  type="button"
                  onClick={() => toggle(category)}
                  className="text-muted-foreground mb-1 flex w-full items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                >
                  <ChevronDown className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                  {category}
                  <span className="text-muted-foreground/50">{groupRuns.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="bg-card divide-border/60 divide-y rounded-xl border px-1.5">
                    {groupRuns.map((run) => (
                      <RunRow key={run.id} run={run} job={byId.get(run.job_id)} />
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

function RunRow({ run, job }: { run: JobRun; job?: Job }) {
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="hover:bg-accent/30 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{job?.name ?? `Job #${run.job_id}`}</span>
          <span className="text-muted-foreground/60 font-mono text-[11px]">#Run {run.id}</span>
          {job && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
              {job.task_type}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs">
          <span className={cn("font-medium", TRIGGER_COLOR[run.trigger_type] ?? "text-muted-foreground")}>
            {TRIGGER_LABEL[run.trigger_type] ?? run.trigger_type}
          </span>
          <span className="text-muted-foreground">
            {" · "}
            {formatRelative(run.started_at ?? run.created_at)}
            {" · "}
            {formatDateTime(run.started_at ?? run.created_at)}
          </span>
        </p>
      </div>

      <StatusBadge status={run.status} />

      <Button type="button" variant="ghost" size="sm" onClick={() => setShowLog(true)}>
        <ScrollText />
        Log
      </Button>
      {job && (
        <Button render={<Link href={`/tasks/${job.id}`} />} variant="ghost" size="icon-sm" aria-label="前往任務">
          <ChevronRight />
        </Button>
      )}

      <LogModal
        open={showLog}
        onOpenChange={setShowLog}
        title={job?.name ?? `Job #${run.job_id}`}
        subtitle={`Run #${run.id} · ${run.status}`}
        logsPath={`/api/runs/${run.id}/logs`}
        active={isActive(run.status)}
      />
    </div>
  );
}
