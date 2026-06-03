import type { Metadata } from "next";
import { TasksDashboard } from "@/components/tasks/tasks-dashboard";
import { serverJson } from "@/lib/backend";
import type { Job, RecentJobItem } from "@/lib/types";

export const metadata: Metadata = { title: "任務執行" };

export default async function TasksPage() {
  // Follows the documented API contract (API.md §4.2).
  const [jobs, recent] = await Promise.all([
    serverJson<Job[]>("/jobs?limit=200"),
    serverJson<RecentJobItem[]>("/jobs/recent?limit=8"),
  ]);

  return <TasksDashboard initialJobs={jobs} initialRecent={recent} />;
}
