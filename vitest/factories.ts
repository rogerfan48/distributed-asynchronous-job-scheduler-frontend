import type { Job, JobRun } from "@/lib/types";

/** Build a Job with sensible defaults; override any field per test. */
export function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    owner_user_id: 1,
    name: "build-site",
    description: null,
    category: null,
    task_type: "shell",
    task_spec: { command: "echo", args: ["hi"] },
    schedule_type: "manual",
    schedule_expr: null,
    timezone: "UTC",
    enabled: true,
    max_retries: 0,
    retry_backoff_sec: 0,
    timeout_sec: 60,
    depends_on: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as Job;
}

/** Build a JobRun with sensible defaults; override any field per test. */
export function makeRun(overrides: Partial<JobRun> = {}): JobRun {
  return {
    id: 1,
    job_id: 1,
    trigger_type: "manual",
    status: "succeeded",
    attempt: 1,
    scheduled_for: null,
    started_at: "2024-01-01T00:00:00Z",
    finished_at: "2024-01-01T00:00:05Z",
    exit_code: 0,
    result: null,
    error: null,
    worker_id: "w1",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as JobRun;
}
