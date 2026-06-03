"use client";

import { Fragment, useState } from "react";
import { ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

/**
 * Execution order for a manual trigger: the full upstream chain runs first,
 * the triggered job last. DFS post-order (deps before the job), cycle-safe.
 * Returns [top-most upstream … , current job(last)].
 */
function executionOrder(job: Job, byId: Map<number, Job>): Job[] {
  const order: Job[] = [];
  const done = new Set<number>();
  const stack = new Set<number>();
  function visit(j: Job) {
    if (done.has(j.id) || stack.has(j.id)) return;
    stack.add(j.id);
    for (const id of j.depends_on ?? []) {
      const dep = byId.get(id);
      if (dep) visit(dep);
    }
    stack.delete(j.id);
    done.add(j.id);
    order.push(j);
  }
  visit(job);
  return order;
}

/**
 * Inline "← upstream" tag. Clicking opens a dialog drawing the execution order
 * top-to-bottom: upstream dependencies first, the current job (highlighted) last.
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
  const [open, setOpen] = useState(false);

  const direct = (job.depends_on ?? [])
    .map((id) => byId.get(id))
    .filter((j): j is Job => !!j);
  if (direct.length === 0) return null;

  const order = executionOrder(job, byId);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="檢視相依執行順序"
        className={cn(
          "text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-1 text-xs",
          className,
        )}
      >
        <span className="text-muted-foreground/50 shrink-0">←</span>
        <span className="truncate">{direct.map((j) => j.name).join("、")}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>相依執行順序：{job.name}</DialogTitle>
          </DialogHeader>

          <div className="scrollbar-thin flex max-h-[60vh] flex-col items-center overflow-auto py-1">
            {order.map((node, i) => {
              const isCurrent = node.id === job.id;
              return (
                <Fragment key={node.id}>
                  {i > 0 && <ArrowDown className="text-muted-foreground/50 my-1 size-4 shrink-0" />}
                  <div
                    className={cn(
                      "w-full max-w-xs rounded-md border px-3 py-2 text-center text-sm",
                      isCurrent
                        ? "border-primary/40 bg-primary/10 text-foreground font-semibold"
                        : "bg-card text-muted-foreground",
                    )}
                  >
                    {node.name}
                    {isCurrent && <span className="text-primary ml-2 text-xs">（本任務）</span>}
                  </div>
                </Fragment>
              );
            })}
          </div>

          <p className="text-muted-foreground text-xs">
            由上而下為執行順序：上游任務先執行，全部成功後才執行本任務；任一上游失敗則後續不會執行。
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
