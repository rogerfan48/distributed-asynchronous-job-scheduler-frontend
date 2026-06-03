import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JobDetail } from "@/components/jobs/job-detail";
import { backendFetch, serverJsonOrNull } from "@/lib/backend";
import { API_PREFIX } from "@/lib/env";
import type { Job, JobRun } from "@/lib/types";

export const metadata: Metadata = { title: "任務詳情" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  // Fetch the job directly so we can 404 cleanly on missing/foreign ids.
  const res = await backendFetch(`${API_PREFIX}/jobs/${jobId}`);
  if (res.status === 401) redirect("/login");
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load job ${jobId} (${res.status})`);
  const job = (await res.json()) as Job;

  const latestRun = await serverJsonOrNull<JobRun>(`/jobs/${jobId}/latest-run`);

  return <JobDetail job={job} initialLatestRun={latestRun} />;
}
