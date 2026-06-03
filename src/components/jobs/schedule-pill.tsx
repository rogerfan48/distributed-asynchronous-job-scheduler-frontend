import { cn } from "@/lib/utils";
import { scheduleKind } from "@/lib/format";
import type { Job } from "@/lib/types";

/**
 * Schedule-type pill. Enabled → whole pill in the type colour (violet/cyan/slate).
 * Disabled → text all grey (incl. the "每…秒" label) but the tinted background stays.
 */
export function SchedulePill({
  job,
  className,
}: {
  job: Pick<Job, "schedule_type" | "schedule_expr" | "enabled">;
  className?: string;
}) {
  const k = scheduleKind(job);
  const scheduled = job.schedule_type === "cron" || job.schedule_type === "interval";
  const greyed = scheduled && !job.enabled;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        k.bgClass,
        greyed ? "text-muted-foreground" : k.textClass,
        className,
      )}
    >
      {k.label}
      {scheduled && <span>· {job.enabled ? "啟用" : "停用"}</span>}
    </span>
  );
}
