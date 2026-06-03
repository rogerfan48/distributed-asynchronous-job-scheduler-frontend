import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/types";

// Static class strings (Tailwind cannot see dynamically-built class names).
const META: Record<
  RunStatus,
  { label: string; text: string; bg: string; dot: string; pulse?: boolean }
> = {
  pending: { label: "等待中", text: "text-status-pending", bg: "bg-status-pending/12", dot: "bg-status-pending" },
  queued: { label: "佇列中", text: "text-status-queued", bg: "bg-status-queued/12", dot: "bg-status-queued" },
  running: { label: "執行中", text: "text-status-running", bg: "bg-status-running/12", dot: "bg-status-running", pulse: true },
  succeeded: { label: "成功", text: "text-status-succeeded", bg: "bg-status-succeeded/12", dot: "bg-status-succeeded" },
  failed: { label: "失敗", text: "text-status-failed", bg: "bg-status-failed/12", dot: "bg-status-failed" },
  timed_out: { label: "逾時", text: "text-status-timed-out", bg: "bg-status-timed-out/12", dot: "bg-status-timed-out" },
  canceled: { label: "已取消", text: "text-status-canceled", bg: "bg-status-canceled/12", dot: "bg-status-canceled" },
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "尚未執行";
  return META[status as RunStatus]?.label ?? status;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status || !(status in META)) {
    return (
      <span
        className={cn(
          "text-muted-foreground bg-muted inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
          className,
        )}
      >
        <span className="bg-muted-foreground/50 size-1.5 rounded-full" aria-hidden />
        {status ? status : "尚未執行"}
      </span>
    );
  }
  const m = META[status as RunStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        m.bg,
        m.text,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", m.dot, m.pulse && "animate-status-pulse")}
        aria-hidden
      />
      {m.label}
    </span>
  );
}
