import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatDateTime,
  formatRelative,
  formatDuration,
  describeSchedule,
  scheduleKind,
  nextRunAt,
  formatCountdown,
  normalizeTimezone,
} from "./format";

describe("formatDateTime", () => {
  it("renders a valid ISO timestamp with the year", () => {
    const out = formatDateTime("2024-03-15T08:30:00Z");
    expect(out).toContain("2024");
    expect(out).not.toBe("—");
  });

  it("returns the em dash for null / undefined / invalid input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("—");
  });
});

describe("normalizeTimezone", () => {
  it("keeps valid IANA timezone names", () => {
    expect(normalizeTimezone("Asia/Taipei")).toBe("Asia/Taipei");
  });

  it("normalizes whole-hour UTC offsets to IANA Etc/GMT names", () => {
    expect(normalizeTimezone("UTC+8")).toBe("Etc/GMT-8");
    expect(normalizeTimezone("UTC+08:00")).toBe("Etc/GMT-8");
    expect(normalizeTimezone("GMT-5")).toBe("Etc/GMT+5");
  });

  it("falls back to UTC for invalid timezone values", () => {
    expect(normalizeTimezone("not-a-zone")).toBe("UTC");
  });
});

describe("formatRelative", () => {
  const NOW = new Date("2024-01-01T12:00:00Z");
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  it("describes a past time with 前", () => {
    expect(formatRelative("2024-01-01T11:58:00Z")).toContain("前");
  });

  it("describes a future time with 後", () => {
    expect(formatRelative("2024-01-01T14:00:00Z")).toContain("後");
  });

  it("returns the em dash for null / invalid", () => {
    expect(formatRelative(null)).toBe("—");
    expect(formatRelative("nope")).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats seconds-only durations", () => {
    expect(formatDuration("2024-01-01T00:00:00Z", "2024-01-01T00:00:05Z")).toBe("5s");
  });

  it("formats minute + second durations", () => {
    expect(formatDuration("2024-01-01T00:00:00Z", "2024-01-01T00:01:30Z")).toBe("1m 30s");
  });

  it("formats hour + minute durations", () => {
    expect(formatDuration("2024-01-01T00:00:00Z", "2024-01-01T01:01:40Z")).toBe("1h 1m");
  });

  it("uses now when end is missing", () => {
    vi.useFakeTimers({ now: new Date("2024-01-01T00:00:10Z") });
    expect(formatDuration("2024-01-01T00:00:00Z", null)).toBe("10s");
    vi.useRealTimers();
  });

  it("returns the em dash for missing start, invalid, or negative spans", () => {
    expect(formatDuration(null, "2024-01-01T00:00:05Z")).toBe("—");
    expect(formatDuration("bad", "2024-01-01T00:00:05Z")).toBe("—");
    expect(formatDuration("2024-01-01T00:00:10Z", "2024-01-01T00:00:00Z")).toBe("—");
  });
});

describe("describeSchedule", () => {
  it("describes cron", () => {
    expect(describeSchedule({ schedule_type: "cron", schedule_expr: "*/5 * * * *" })).toBe(
      "Cron · */5 * * * *",
    );
  });

  it("describes interval in the largest whole unit", () => {
    expect(describeSchedule({ schedule_type: "interval", schedule_expr: "3600" })).toBe("每 1 小時");
    expect(describeSchedule({ schedule_type: "interval", schedule_expr: "120" })).toBe("每 2 分鐘");
    expect(describeSchedule({ schedule_type: "interval", schedule_expr: "45" })).toBe("每 45 秒");
  });

  it("tolerates a non-numeric interval expression", () => {
    expect(describeSchedule({ schedule_type: "interval", schedule_expr: "abc" })).toBe("每 abc 秒");
  });

  it("describes manual / unknown as 手動", () => {
    expect(describeSchedule({ schedule_type: "manual" })).toBe("手動");
    expect(describeSchedule({ schedule_type: "whatever" })).toBe("手動");
  });
});

describe("scheduleKind", () => {
  it("returns violet metadata for cron", () => {
    const k = scheduleKind({ schedule_type: "cron", schedule_expr: "0 * * * *" });
    expect(k.label).toBe("Cron · 0 * * * *");
    expect(k.bgClass).toContain("violet");
    expect(k.textClass).toContain("violet");
  });

  it("returns cyan metadata for interval", () => {
    const k = scheduleKind({ schedule_type: "interval", schedule_expr: "60" });
    expect(k.label).toBe("每 1 分鐘");
    expect(k.bgClass).toContain("cyan");
  });

  it("returns slate 手動 metadata for manual", () => {
    const k = scheduleKind({ schedule_type: "manual" });
    expect(k.label).toBe("手動");
    expect(k.bgClass).toContain("slate");
  });
});

describe("nextRunAt", () => {
  const NOW = new Date("2024-01-01T00:10:00Z");
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  it("returns null for manual jobs", () => {
    expect(nextRunAt({ schedule_type: "manual" })).toBeNull();
  });

  it("computes a future fire time for a cron job", () => {
    const next = nextRunAt({ schedule_type: "cron", schedule_expr: "* * * * *" });
    expect(next).toBeInstanceOf(Date);
    expect(next!.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("accepts UTC offset aliases such as UTC+8 for cron countdowns", () => {
    const offsetNext = nextRunAt({
      schedule_type: "cron",
      schedule_expr: "0 2 * * *",
      timezone: "UTC+8",
    });
    const taipeiNext = nextRunAt({
      schedule_type: "cron",
      schedule_expr: "0 2 * * *",
      timezone: "Asia/Taipei",
    });
    expect(offsetNext).toBeInstanceOf(Date);
    expect(offsetNext!.toISOString()).toBe(taipeiNext!.toISOString());
  });

  it("extrapolates the next interval tick from the last run", () => {
    const next = nextRunAt(
      { schedule_type: "interval", schedule_expr: "60" },
      "2024-01-01T00:00:00Z",
    );
    expect(next!.toISOString()).toBe("2024-01-01T00:11:00.000Z");
  });

  it("returns null for a non-positive or non-numeric interval", () => {
    expect(nextRunAt({ schedule_type: "interval", schedule_expr: "0" })).toBeNull();
    expect(nextRunAt({ schedule_type: "interval", schedule_expr: "-5" })).toBeNull();
    expect(nextRunAt({ schedule_type: "interval", schedule_expr: "abc" })).toBeNull();
  });

  it("returns null when cron parsing throws", () => {
    expect(nextRunAt({ schedule_type: "cron", schedule_expr: "99 99 99 99 99" })).toBeNull();
  });
});

describe("formatCountdown", () => {
  const NOW = new Date("2024-01-01T00:00:00Z");
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  const future = (ms: number) => new Date(NOW.getTime() + ms);

  it("returns the em dash for null", () => {
    expect(formatCountdown(null)).toBe("—");
  });

  it("returns 即將 for a past / present time", () => {
    expect(formatCountdown(NOW)).toBe("即將");
    expect(formatCountdown(future(-1000))).toBe("即將");
  });

  it("counts down in the largest sensible unit", () => {
    expect(formatCountdown(future(30_000))).toBe("30 秒後");
    expect(formatCountdown(future(5 * 60_000))).toBe("5 分鐘後");
    expect(formatCountdown(future(3 * 3_600_000))).toBe("3 小時後");
    expect(formatCountdown(future(2 * 86_400_000))).toBe("2 天後");
  });
});
