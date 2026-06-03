"use client";

import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogViewer } from "./log-viewer";
import { fetcher } from "@/lib/api-client";
import type { JobRunLog } from "@/lib/types";

/**
 * Mode 1 — pop-out log viewer. Closes on backdrop click or the top-right X
 * (both built into DialogContent). Polls while `active`.
 */
export function LogModal({
  open,
  onOpenChange,
  title,
  subtitle,
  logsPath,
  active = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  logsPath: string | null;
  active?: boolean;
}) {
  const key = open && logsPath ? `${logsPath}?limit=2000` : null;
  const { data, isLoading } = useSWR<JobRunLog[]>(key, fetcher, {
    refreshInterval: active ? 3000 : 0,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle className="truncate pr-8">{title}</DialogTitle>
          {subtitle && (
            <DialogDescription className="truncate">{subtitle}</DialogDescription>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 p-3">
          <LogViewer logs={data ?? []} loading={isLoading} className="border-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
