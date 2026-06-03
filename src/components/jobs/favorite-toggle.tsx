"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/use-favorites";

/** Star toggle to pin/unpin a job as a "常用任務". Synced across the app. */
export function FavoriteToggle({ jobId, className }: { jobId: number; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(jobId);
  return (
    <button
      type="button"
      onClick={() => toggle(jobId)}
      aria-pressed={on}
      aria-label={on ? "取消常用" : "設為常用"}
      title={on ? "取消常用" : "設為常用"}
      className={cn(
        "grid size-7 place-items-center rounded-md transition-colors",
        on ? "text-status-queued" : "text-muted-foreground/50 hover:text-foreground",
        className,
      )}
    >
      <Star className={cn("size-4", on && "fill-current")} />
    </button>
  );
}
