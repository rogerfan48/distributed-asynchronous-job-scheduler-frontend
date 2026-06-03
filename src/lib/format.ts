/** Locale-aware formatting helpers (zh-TW). Safe for both server and client. */

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const RELATIVE_STEPS: [limit: number, div: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86400, 3600, "hour"],
  [604800, 86400, "day"],
  [2629800, 604800, "week"],
  [31557600, 2629800, "month"],
  [Infinity, 31557600, "year"],
];

const rtf = new Intl.RelativeTimeFormat("zh-TW", { numeric: "auto" });

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffSec = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diffSec);
  for (const [limit, div, unit] of RELATIVE_STEPS) {
    if (abs < limit) return rtf.format(Math.round(diffSec / div), unit);
  }
  return formatDateTime(iso);
}

/** Duration between two ISO timestamps (or start→now), e.g. "1m 23s". */
export function formatDuration(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return "—";
  const total = Math.round((e - s) / 1000);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const sec = total % 60;
  if (m < 60) return `${m}m ${sec}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Human-readable schedule summary for a job. */
export function describeSchedule(job: {
  schedule_type: string;
  schedule_expr?: string | null;
}): string {
  switch (job.schedule_type) {
    case "cron":
      return `Cron · ${job.schedule_expr ?? "?"}`;
    case "interval": {
      const sec = Number(job.schedule_expr);
      if (!Number.isFinite(sec)) return `每 ${job.schedule_expr ?? "?"} 秒`;
      if (sec % 3600 === 0) return `每 ${sec / 3600} 小時`;
      if (sec % 60 === 0) return `每 ${sec / 60} 分鐘`;
      return `每 ${sec} 秒`;
    }
    default:
      return "手動";
  }
}
