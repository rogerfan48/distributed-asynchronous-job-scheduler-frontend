"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { upstreamChain } from "@/lib/types";
import type { Job } from "@/lib/types";

/**
 * Shows a job's direct upstream dependencies inline ("← A, B"). When there are
 * deeper levels, clicking expands the full (cycle-safe) chain.
 */
export function DependencyHint({
  job,
  byId,
  className,
}: {
  job: Job;
  byId: Map<number, Job>;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const direct = (job.depends_on ?? [])
    .map((id) => byId.get(id))
    .filter((j): j is Job => !!j);
  if (direct.length === 0) return null;

  const chain = upstreamChain(job, byId);
  const hasMore = chain.length > direct.length;
  const shown = expanded ? chain : direct;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasMore) setExpanded((v) => !v);
      }}
      title="上游相依任務"
      className={cn(
        "text-muted-foreground inline-flex max-w-full items-center gap-1 text-xs",
        hasMore && "hover:text-foreground cursor-pointer",
        className,
      )}
    >
      <span className="text-muted-foreground/50 shrink-0">←</span>
      <span className="truncate">{shown.map((j) => j.name).join(" ← ")}</span>
      {hasMore && !expanded && <span className="text-muted-foreground/50 shrink-0">…</span>}
    </button>
  );
}
