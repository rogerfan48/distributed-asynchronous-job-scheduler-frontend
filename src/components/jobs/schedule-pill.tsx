import { cn } from "@/lib/utils";
import { scheduleKind } from "@/lib/format";
import type { Job } from "@/lib/types";

/** Schedule-type pill with fixed colours; shows enabled/disabled for schedules. */
export function SchedulePill({
  job,
  className,
}: {
  job: Pick<Job, "schedule_type" | "schedule_expr" | "enabled">;
  className?: string;
}) {
  const k = scheduleKind(job);
  const scheduled = job.schedule_type === "cron" || job.schedule_type === "interval";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
        k.className,
        className,
      )}
    >
      {k.label}
      {scheduled && (
        <span className={cn(!job.enabled && "opacity-70")}>
          · {job.enabled ? "啟用" : "停用"}
        </span>
      )}
    </span>
  );
}
