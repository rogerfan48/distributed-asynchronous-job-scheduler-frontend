"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/api-client";
import { RecentJobs } from "./recent-jobs";
import { FavoritesSection } from "./favorites-section";
import { ScheduledSection } from "./scheduled-section";
import { SubmitJobModal } from "./submit-job-modal";
import type { Job, RecentJobItem } from "@/lib/types";

const JOBS_KEY = "/api/jobs?limit=200";
const RECENT_KEY = "/api/jobs/recent?limit=8";

export function TasksDashboard({
  initialJobs,
  initialRecent,
}: {
  initialJobs: Job[];
  initialRecent: RecentJobItem[];
}) {
  const [open, setOpen] = useState(false);

  const { data: jobs = [], mutate: mutateJobs } = useSWR<Job[]>(JOBS_KEY, fetcher, {
    fallbackData: initialJobs,
  });
  const { data: recent = [], mutate: mutateRecent } = useSWR<RecentJobItem[]>(
    RECENT_KEY,
    fetcher,
    { fallbackData: initialRecent, refreshInterval: 10000 },
  );

  function refresh() {
    void mutateJobs();
    void mutateRecent();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">任務控制台</h2>
          <p className="text-muted-foreground text-sm">建立、收藏與快速執行任務</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          新任務
        </Button>
      </div>

      <RecentJobs items={recent} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FavoritesSection jobs={jobs} />
        <ScheduledSection jobs={jobs} />
      </div>

      <SubmitJobModal
        open={open}
        onOpenChange={setOpen}
        existingJobs={jobs}
        onCreated={refresh}
      />
    </div>
  );
}
