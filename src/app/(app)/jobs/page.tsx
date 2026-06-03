import type { Metadata } from "next";
import { RecordsBoard } from "@/components/records/records-board";
import { serverJson } from "@/lib/backend";
import type { Job, JobRun } from "@/lib/types";

export const metadata: Metadata = { title: "紀錄面板" };

export default async function RecordsPage() {
  const [jobs, runs] = await Promise.all([
    serverJson<Job[]>("/jobs?limit=500"),
    serverJson<JobRun[]>("/runs?limit=200"),
  ]);

  return <RecordsBoard initialJobs={jobs} initialRuns={runs} />;
}
