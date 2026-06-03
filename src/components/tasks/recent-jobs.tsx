import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/jobs/status-badge";
import { formatRelative } from "@/lib/format";
import type { RecentJobItem } from "@/lib/types";

export function RecentJobs({ items }: { items: RecentJobItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="text-muted-foreground size-4" />
          最近提交
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">尚無最近任務</p>
        ) : (
          <ul className="divide-border -my-1 divide-y">
            {items.map(({ job, latest_run }) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="group hover:bg-accent/40 -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{job.name}</span>
                      <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                        {job.task_type}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {latest_run
                        ? `最近執行 ${formatRelative(latest_run.created_at)}`
                        : "尚未執行"}
                    </p>
                  </div>
                  <StatusBadge status={latest_run?.status} />
                  <ArrowUpRight className="text-muted-foreground/40 group-hover:text-foreground size-4 shrink-0 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
