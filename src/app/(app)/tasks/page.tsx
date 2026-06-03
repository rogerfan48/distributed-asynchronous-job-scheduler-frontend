import type { Metadata } from "next";
import { TasksDashboard } from "@/components/tasks/tasks-dashboard";
import { serverJson } from "@/lib/backend";
import type { Job, JobRun } from "@/lib/types";

export const metadata: Metadata = { title: "執行面板" };

export default async function TasksPage() {
  const [jobs, runs] = await Promise.all([
    serverJson<Job[]>("/jobs?limit=500"),
    serverJson<JobRun[]>("/runs?limit=200"),
  ]);

  return <TasksDashboard initialJobs={jobs} initialRuns={runs} />;
}
