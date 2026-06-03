import { cn } from "@/lib/utils";

// Deterministic colour per category — derived purely on the frontend (a stable
// hash of the category name → a fixed palette). No backend support needed.
const PALETTE = [
  "bg-sky-500/15 text-sky-400",
  "bg-violet-500/15 text-violet-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-amber-500/15 text-amber-400",
  "bg-rose-500/15 text-rose-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-fuchsia-500/15 text-fuchsia-400",
  "bg-lime-500/15 text-lime-400",
];

function colorFor(category: string): string {
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Small coloured chip for a job's category. Renders nothing when uncategorised. */
export function CategoryTag({
  category,
  className,
}: {
  category?: string | null;
  className?: string;
}) {
  const c = category?.trim();
  if (!c) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
        colorFor(c),
        className,
      )}
    >
      {c}
    </span>
  );
}
