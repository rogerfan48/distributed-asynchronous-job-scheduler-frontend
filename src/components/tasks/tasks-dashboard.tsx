"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api-client";
import { FavoritesSection } from "./favorites-section";
import { ScheduledSection } from "./scheduled-section";
import { AllTasksSection } from "./all-tasks-section";
import { SubmitJobModal } from "./submit-job-modal";
import { latestRunByJob } from "@/lib/types";
import type { Job, JobRun } from "@/lib/types";

export function TasksDashboard({
  initialJobs,
  initialRuns,
}: {
  initialJobs: Job[];
  initialRuns: JobRun[];
}) {
  const [open, setOpen] = useState(false);

  const { data: jobs = [], mutate: mutateJobs } = useSWR<Job[]>(
    "/api/jobs?limit=500",
    fetcher,
    { fallbackData: initialJobs, refreshInterval: 10000 },
  );
  const { data: runs = [], mutate: mutateRuns } = useSWR<JobRun[]>(
    "/api/runs?limit=200",
    fetcher,
    { fallbackData: initialRuns, refreshInterval: 5000 },
  );

  const latestByJob = useMemo(() => latestRunByJob(runs), [runs]);
  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j] as const)), [jobs]);

  function refresh() {
    void mutateJobs();
    void mutateRuns();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">執行面板</h2>
          <p className="text-muted-foreground text-sm">建立、收藏與執行任務</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          新任務
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FavoritesSection jobs={jobs} latestByJob={latestByJob} />
        <ScheduledSection jobs={jobs} latestByJob={latestByJob} />
      </div>

      <AllTasksSection jobs={jobs} latestByJob={latestByJob} byId={byId} />

      <SubmitJobModal
        open={open}
        onOpenChange={setOpen}
        existingJobs={jobs}
        onCreated={refresh}
      />
    </div>
  );
}
