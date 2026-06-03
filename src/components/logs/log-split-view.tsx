"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { LogViewer } from "./log-viewer";
import { StatusBadge } from "@/components/jobs/status-badge";
import { fetcher } from "@/lib/api-client";
import { isActive } from "@/lib/types";
import type { JobRunLog } from "@/lib/types";

export type SplitEntry = {
  id: number;
  title: string;
  subtitle?: string;
  status?: string | null;
};

/**
 * Mode 2 — split view. Left = entry column (jobs or runs); right = log text.
 * Clicking an entry switches the right pane automatically.
 */
export function LogSplitView({
  entries,
  logsPath,
  emptyText = "選擇左側項目以檢視 log",
  className,
}: {
  entries: SplitEntry[];
  logsPath: (id: number) => string;
  emptyText?: string;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(entries[0]?.id ?? null);

  // Keep selection valid as the entry list changes.
  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? entries[0] ?? null,
    [entries, selectedId],
  );

  const key = selected ? `${logsPath(selected.id)}?limit=2000` : null;
  const { data, isLoading } = useSWR<JobRunLog[]>(key, fetcher, {
    refreshInterval: selected && isActive(selected.status) ? 3000 : 0,
  });

  if (entries.length === 0) {
    return (
      <div className={cn("text-muted-foreground grid place-items-center rounded-lg border py-16 text-sm", className)}>
        沒有可檢視的項目
      </div>
    );
  }

  return (
    <div className={cn("grid h-[60vh] grid-cols-1 overflow-hidden rounded-lg border sm:grid-cols-[16rem_1fr]", className)}>
      <div className="scrollbar-thin bg-sidebar/50 max-h-60 overflow-y-auto border-b sm:max-h-none sm:border-r sm:border-b-0">
        <ul className="p-1.5">
          {entries.map((e) => {
            const on = selected?.id === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                    on ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.title}</span>
                    {e.subtitle && (
                      <span className="text-muted-foreground block truncate text-xs">{e.subtitle}</span>
                    )}
                  </span>
                  {e.status !== undefined && <StatusBadge status={e.status} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="min-h-0 p-2">
        {selected ? (
          <LogViewer logs={data ?? []} loading={isLoading} className="border-0" emptyText="此項目尚無 log" />
        ) : (
          <p className="text-muted-foreground grid h-full place-items-center text-sm">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
