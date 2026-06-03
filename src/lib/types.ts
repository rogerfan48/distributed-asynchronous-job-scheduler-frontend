import type { components } from "@/types/api";

/** Domain types derived from the generated OpenAPI schema. */
export type Job = components["schemas"]["JobOut"];
export type JobCreate = components["schemas"]["JobCreate"];
export type JobUpdate = components["schemas"]["JobUpdate"];
export type JobRun = components["schemas"]["JobRunOut"];
export type JobRunLog = components["schemas"]["JobRunLogOut"];
export type User = components["schemas"]["UserOut"];
export type TokenResponse = components["schemas"]["TokenOut"];

/**
 * Editable Job draft returned by `POST /jobs/drafts/from-file`. It is JobCreate
 * plus the source file metadata; the backend does NOT persist a job from this —
 * the user reviews/edits it, then submits via `POST /jobs`.
 * (Defined by hand: the backend's openapi.json export currently lags API.md.)
 */
export type JobDraft = JobCreate & {
  source_filename: string | null;
  file_content: string;
};

/** Item from `GET /jobs/recent` — a job paired with its latest run (or null). */
export type RecentJobItem = {
  job: Job;
  latest_run: JobRun | null;
};

/**
 * The backend models these as plain strings in its OpenAPI doc, so we narrow
 * them here for exhaustive handling in the UI.
 */
export type RunStatus =
  | "pending"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "canceled";

export type TaskType = "http" | "shell" | "http_async";
export type ScheduleType = "cron" | "interval" | "manual";
export type TriggerType = "scheduled" | "manual" | "dependency" | "retry";
export type LogStream = "stdout" | "stderr" | "system";

export const RUN_STATUSES: readonly RunStatus[] = [
  "pending",
  "queued",
  "running",
  "succeeded",
  "failed",
  "timed_out",
  "canceled",
];

export const TERMINAL_STATUSES: ReadonlySet<RunStatus> = new Set([
  "succeeded",
  "failed",
  "timed_out",
  "canceled",
]);

export const ACTIVE_STATUSES: ReadonlySet<RunStatus> = new Set([
  "pending",
  "queued",
  "running",
]);

export function isTerminal(status?: string | null): boolean {
  return !!status && TERMINAL_STATUSES.has(status as RunStatus);
}

export function isActive(status?: string | null): boolean {
  return !!status && ACTIVE_STATUSES.has(status as RunStatus);
}

/** Whether a run can be retried / canceled, mirroring backend semantics. */
export function canRetryRun(run?: Pick<JobRun, "status"> | null): boolean {
  return !!run && isTerminal(run.status);
}
export function canCancelRun(run?: Pick<JobRun, "status"> | null): boolean {
  return !!run && isActive(run.status);
}

/** Four high-level phases used for grouping / filtering in the UI. */
export type RunPhase = "pending" | "running" | "completed" | "error";

export function runPhase(status: string | null | undefined): RunPhase {
  switch (status) {
    case "pending":
    case "queued":
      return "pending";
    case "running":
      return "running";
    case "succeeded":
      return "completed";
    default:
      // failed / timed_out / canceled / unknown
      return "error";
  }
}

/** Category grouping (backend has a native `category` field; null → uncategorized). */
export const DEFAULT_CATEGORY = "未分類";

export function jobCategory(job: Pick<Job, "category">): string {
  return job.category?.trim() || DEFAULT_CATEGORY;
}

export function groupJobsByCategory(jobs: Job[]): Map<string, Job[]> {
  const groups = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = jobCategory(job);
    const bucket = groups.get(key);
    if (bucket) bucket.push(job);
    else groups.set(key, [job]);
  }
  return groups;
}

/** A scheduled job runs automatically (cron / interval), vs manual trigger. */
export function isScheduled(job: Pick<Job, "schedule_type">): boolean {
  return job.schedule_type === "cron" || job.schedule_type === "interval";
}

/** Latest run per job id. Assumes `runs` is newest-first (as the API returns). */
export function latestRunByJob(runs: JobRun[]): Map<number, JobRun> {
  const map = new Map<number, JobRun>();
  for (const r of runs) if (!map.has(r.job_id)) map.set(r.job_id, r);
  return map;
}

/** Jobs that declare `jobId` as an upstream dependency (i.e. its downstream). */
export function dependentsOf(jobId: number, jobs: Job[]): Job[] {
  return jobs.filter((j) => (j.depends_on ?? []).includes(jobId));
}

/**
 * Full upstream chain of a job (direct deps first, then theirs…), de-duplicated
 * and cycle-safe. Returns the upstream Jobs in breadth-first order.
 */
export function upstreamChain(job: Job, byId: Map<number, Job>): Job[] {
  const out: Job[] = [];
  const seen = new Set<number>([job.id]);
  let frontier = job.depends_on ?? [];
  while (frontier.length) {
    const next: number[] = [];
    for (const id of frontier) {
      if (seen.has(id)) continue;
      seen.add(id);
      const up = byId.get(id);
      if (up) {
        out.push(up);
        next.push(...(up.depends_on ?? []));
      }
    }
    frontier = next;
  }
  return out;
}
