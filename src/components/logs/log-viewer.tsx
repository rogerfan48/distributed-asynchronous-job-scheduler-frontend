"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobRunLog, LogStream } from "@/lib/types";

const STREAM_CLASS: Record<LogStream, string> = {
  stdout: "text-foreground",
  stderr: "text-status-failed",
  system: "text-muted-foreground",
};

function timeOf(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("zh-TW", { hour12: false });
}

/**
 * Renders run logs with per-stream colouring and auto-follow: it sticks to the
 * bottom as new lines arrive, but pauses following once the user scrolls up.
 */
export function LogViewer({
  logs,
  loading = false,
  emptyText = "尚無 log",
  className,
}: {
  logs: JobRunLog[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, follow]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setFollow(nearBottom);
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={cn(
        "scrollbar-thin bg-background/60 h-full overflow-y-auto rounded-md border p-3 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      {loading && logs.length === 0 ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-10">
          <Loader2 className="size-4 animate-spin" />
          載入中…
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground/60 py-10 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-0.5">
          {logs.map((log) => (
            <li key={log.id} className="flex gap-2.5">
              <span className="text-muted-foreground/40 tabular-nums shrink-0 select-none">
                {timeOf(log.ts)}
              </span>
              <span
                className={cn(
                  "shrink-0 select-none uppercase opacity-70",
                  STREAM_CLASS[log.stream as LogStream] ?? "text-muted-foreground",
                )}
              >
                {log.stream === "stderr" ? "ERR" : log.stream === "system" ? "SYS" : "OUT"}
              </span>
              <span
                className={cn(
                  "break-all whitespace-pre-wrap",
                  STREAM_CLASS[log.stream as LogStream] ?? "text-foreground",
                )}
              >
                {log.line}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
