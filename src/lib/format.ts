/** Locale-aware formatting helpers (zh-TW). Safe for both server and client. */
import { Cron } from "croner";

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

type ScheduleKind = {
  label: string;
  /** Fixed colour classes per schedule type (text + tinted bg). */
  className: string;
};

/** Schedule-type pill metadata with fixed colours (manual / cron / interval). */
export function scheduleKind(job: {
  schedule_type: string;
  schedule_expr?: string | null;
}): ScheduleKind {
  switch (job.schedule_type) {
    case "cron":
      return {
        label: `Cron · ${job.schedule_expr ?? "?"}`,
        className: "bg-violet-500/15 text-violet-400",
      };
    case "interval":
      return { label: describeSchedule(job), className: "bg-cyan-500/15 text-cyan-400" };
    default:
      return { label: "手動", className: "bg-slate-500/15 text-slate-400" };
  }
}

/**
 * Next fire time for a scheduled job. cron is exact (croner, honouring the
 * job timezone); interval is APPROXIMATE (backend exposes no tick base — we
 * extrapolate from the last run / creation time). Returns null for manual or
 * when it can't be computed.
 */
export function nextRunAt(
  job: { schedule_type: string; schedule_expr?: string | null; timezone?: string; created_at?: string },
  lastRunAt?: string | null,
): Date | null {
  try {
    if (job.schedule_type === "cron" && job.schedule_expr) {
      const cron = new Cron(job.schedule_expr, { timezone: job.timezone || "UTC" });
      return cron.nextRun();
    }
    if (job.schedule_type === "interval") {
      const sec = Number(job.schedule_expr);
      if (!Number.isFinite(sec) || sec <= 0) return null;
      const baseIso = lastRunAt ?? job.created_at;
      const base = baseIso ? new Date(baseIso).getTime() : Date.now();
      const now = Date.now();
      // Smallest base + k*interval that is strictly in the future.
      const elapsed = Math.max(0, now - base);
      const k = Math.floor(elapsed / (sec * 1000)) + 1;
      return new Date(base + k * sec * 1000);
    }
  } catch {
    return null;
  }
  return null;
}

/** Compact countdown to a future date, e.g. "3 分鐘後" / "2 小時後". Past → "即將". */
export function formatCountdown(date: Date | null): string {
  if (!date) return "—";
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "即將";
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s} 秒後`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} 分鐘後`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小時後`;
  return `${Math.round(h / 24)} 天後`;
}
