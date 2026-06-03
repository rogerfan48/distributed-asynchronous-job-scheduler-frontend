import type { Metadata } from "next";
import { JobsBoard } from "@/components/jobs/jobs-board";
import { serverJson } from "@/lib/backend";
import type { Job, JobRun } from "@/lib/types";

export const metadata: Metadata = { title: "Job 狀態" };

export default async function JobsPage() {
  const [jobs, runs] = await Promise.all([
    serverJson<Job[]>("/jobs?limit=500"),
    serverJson<JobRun[]>("/runs?limit=200"),
  ]);

  return <JobsBoard initialJobs={jobs} initialRuns={runs} />;
}
