import { Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  /** Hide the wordmark, show only the mark. */
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { box: "size-7", icon: "size-4", text: "text-sm" },
  md: { box: "size-9", icon: "size-5", text: "text-base" },
  lg: { box: "size-11", icon: "size-6", text: "text-lg" },
} as const;

export function Brand({ className, iconOnly = false, size = "md" }: BrandProps) {
  const s = SIZES[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl text-white shadow-lg shadow-primary/20 ring-1 ring-white/10",
          "bg-gradient-to-br from-primary to-[oklch(0.55_0.2_300)]",
          s.box,
        )}
        aria-hidden
      >
        <Waypoints className={s.icon} strokeWidth={2.25} />
      </div>
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-semibold tracking-tight", s.text)}>
            Job Scheduler
          </span>
        </div>
      )}
    </div>
  );
}
