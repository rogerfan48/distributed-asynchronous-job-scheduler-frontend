"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ScrollText, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitJobModal } from "@/components/tasks/submit-job-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { FavoriteToggle } from "./favorite-toggle";
import { TriggerButton } from "./trigger-button";
import { RunActions } from "./run-actions";
import { LogViewer } from "@/components/logs/log-viewer";
import { LogModal } from "@/components/logs/log-modal";
import { fetcher } from "@/lib/api-client";
import { describeSchedule, formatDateTime, formatDuration, formatRelative } from "@/lib/format";
import { isActive } from "@/lib/types";
import type { Job, JobRun, JobRunLog } from "@/lib/types";

export function JobDetail({
  job,
  initialLatestRun,
}: {
  job: Job;
  initialLatestRun: JobRun | null;
}) {
  const { data: latestRun = null } = useSWR<JobRun | null>(
    `/api/jobs/${job.id}/latest-run`,
    fetcher,
    { fallbackData: initialLatestRun, refreshInterval: isActive(initialLatestRun?.status) ? 3000 : 0 },
  );
  const active = isActive(latestRun?.status);

  const { data: runs = [] } = useSWR<JobRun[]>(
    `/api/jobs/${job.id}/runs?limit=50`,
    fetcher,
    { refreshInterval: active ? 5000 : 0 },
  );
  const { data: logs = [], isLoading: logsLoading } = useSWR<JobRunLog[]>(
    `/api/jobs/${job.id}/logs?limit=2000`,
    fetcher,
    { refreshInterval: active ? 3000 : 0 },
  );

  // Jobs list (for the edit modal's dependency picker + category suggestions).
  const [editOpen, setEditOpen] = useState(false);
  const { data: allJobs = [] } = useSWR<Job[]>("/api/jobs?limit=500", fetcher);

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" />
        執行面板
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FavoriteToggle jobId={job.id} />
            <h2 className="truncate text-xl font-semibold tracking-tight">{job.name}</h2>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{job.task_type}</span>
            <span>{job.category?.trim() || "未分類"}</span>
            <span>·</span>
            <span>{describeSchedule(job)}</span>
          </div>
          {job.description && <p className="text-muted-foreground mt-2 max-w-2xl text-sm">{job.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {latestRun && <RunActions run={latestRun} />}
          <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil />
            編輯
          </Button>
          <TriggerButton jobId={job.id} jobName={job.name} variant="default" />
        </div>
      </div>

      {/* Latest run summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            最新執行
            <StatusBadge status={latestRun?.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!latestRun ? (
            <p className="text-muted-foreground py-4 text-sm">尚未執行。點右上「執行」手動觸發。</p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Detail label="Run" value={`#${latestRun.id}`} />
              <Detail label="觸發來源" value={latestRun.trigger_type} />
              <Detail label="嘗試" value={`第 ${latestRun.attempt} 次`} />
              <Detail label="Exit code" value={latestRun.exit_code ?? "—"} />
              <Detail label="開始" value={formatDateTime(latestRun.started_at)} />
              <Detail label="結束" value={formatDateTime(latestRun.finished_at)} />
              <Detail label="耗時" value={formatDuration(latestRun.started_at, latestRun.finished_at)} />
              <Detail label="Worker" value={latestRun.worker_id ?? "—"} />
              {latestRun.error && (
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-muted-foreground text-xs">錯誤</dt>
                  <dd className="text-status-failed mt-0.5 font-mono text-xs break-all">{latestRun.error}</dd>
                </div>
              )}
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Inline logs (latest run) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="text-muted-foreground size-4" />
            最新執行 Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[40vh]">
            <LogViewer logs={logs} loading={logsLoading} emptyText="尚未執行，無 log" />
          </div>
        </CardContent>
      </Card>

      {/* Run history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">執行歷史</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">尚無執行紀錄</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>狀態</TableHead>
                  <TableHead>來源</TableHead>
                  <TableHead className="text-center">嘗試</TableHead>
                  <TableHead>建立</TableHead>
                  <TableHead>耗時</TableHead>
                  <TableHead className="text-right">動作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <RunHistoryRow key={run.id} run={run} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SubmitJobModal
        open={editOpen}
        onOpenChange={setEditOpen}
        existingJobs={allJobs.filter((j) => j.id !== job.id)}
        editJob={job}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}

function RunHistoryRow({ run }: { run: JobRun }) {
  const [showLog, setShowLog] = useState(false);
  return (
    <TableRow>
      <TableCell><StatusBadge status={run.status} /></TableCell>
      <TableCell className="text-muted-foreground text-xs">{run.trigger_type}</TableCell>
      <TableCell className="text-center tabular-nums">{run.attempt}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{formatRelative(run.created_at)}</TableCell>
      <TableCell className="tabular-nums text-xs">{formatDuration(run.started_at, run.finished_at)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => setShowLog(true)}>
            <ScrollText />
            Log
          </Button>
          <RunActions run={run} size="xs" />
        </div>
        <LogModal
          open={showLog}
          onOpenChange={setShowLog}
          title={`Run #${run.id}`}
          subtitle={run.status}
          logsPath={`/api/runs/${run.id}/logs`}
          active={isActive(run.status)}
        />
      </TableCell>
    </TableRow>
  );
}
