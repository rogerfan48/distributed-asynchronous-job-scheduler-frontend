import { describe, it, expect } from "vitest";
import {
  isTerminal,
  isActive,
  canRetryRun,
  canCancelRun,
  runPhase,
  jobCategory,
  compareCategories,
  groupJobsByCategory,
  isScheduled,
  latestRunByJob,
  dependentsOf,
  upstreamChain,
  DEFAULT_CATEGORY,
  RUN_STATUSES,
  TERMINAL_STATUSES,
  ACTIVE_STATUSES,
} from "./types";
import { makeJob, makeRun } from "../../vitest/factories";

describe("status predicates", () => {
  it("classifies terminal statuses", () => {
    for (const s of ["succeeded", "failed", "timed_out", "canceled"]) {
      expect(isTerminal(s)).toBe(true);
      expect(isActive(s)).toBe(false);
    }
  });

  it("classifies active statuses", () => {
    for (const s of ["pending", "queued", "running"]) {
      expect(isActive(s)).toBe(true);
      expect(isTerminal(s)).toBe(false);
    }
  });

  it("treats null/undefined/unknown as neither", () => {
    for (const s of [null, undefined, "", "bogus"]) {
      expect(isTerminal(s)).toBe(false);
      expect(isActive(s)).toBe(false);
    }
  });

  it("partitions every known status into exactly one of active/terminal", () => {
    for (const s of RUN_STATUSES) {
      expect(TERMINAL_STATUSES.has(s) ? 1 : 0) //
        .not.toBe(ACTIVE_STATUSES.has(s) ? 1 : 0);
    }
  });
});

describe("canRetryRun / canCancelRun", () => {
  it("allows retry only on terminal runs", () => {
    expect(canRetryRun(makeRun({ status: "failed" }))).toBe(true);
    expect(canRetryRun(makeRun({ status: "running" }))).toBe(false);
    expect(canRetryRun(null)).toBe(false);
    expect(canRetryRun(undefined)).toBe(false);
  });

  it("allows cancel only on active runs", () => {
    expect(canCancelRun(makeRun({ status: "running" }))).toBe(true);
    expect(canCancelRun(makeRun({ status: "succeeded" }))).toBe(false);
    expect(canCancelRun(null)).toBe(false);
  });
});

describe("runPhase", () => {
  it("maps statuses to the four UI phases", () => {
    expect(runPhase("pending")).toBe("pending");
    expect(runPhase("queued")).toBe("pending");
    expect(runPhase("running")).toBe("running");
    expect(runPhase("succeeded")).toBe("completed");
    expect(runPhase("failed")).toBe("error");
    expect(runPhase("timed_out")).toBe("error");
    expect(runPhase("canceled")).toBe("error");
  });

  it("falls back to error for unknown / null", () => {
    expect(runPhase(null)).toBe("error");
    expect(runPhase(undefined)).toBe("error");
    expect(runPhase("weird")).toBe("error");
  });
});

describe("jobCategory", () => {
  it("returns the trimmed category", () => {
    expect(jobCategory({ category: "  data  " })).toBe("data");
  });

  it("falls back to the default for null / empty / whitespace", () => {
    expect(jobCategory({ category: null })).toBe(DEFAULT_CATEGORY);
    expect(jobCategory({ category: "" })).toBe(DEFAULT_CATEGORY);
    expect(jobCategory({ category: "   " })).toBe(DEFAULT_CATEGORY);
  });
});

describe("compareCategories", () => {
  it("keeps the default category first", () => {
    expect(compareCategories(DEFAULT_CATEGORY, "alpha")).toBeLessThan(0);
    expect(compareCategories("alpha", DEFAULT_CATEGORY)).toBeGreaterThan(0);
  });

  it("returns 0 for equal categories", () => {
    expect(compareCategories("a", "a")).toBe(0);
  });

  it("orders the rest dictionary-style and is usable by sort()", () => {
    const sorted = ["zebra", DEFAULT_CATEGORY, "apple", "mango"].sort(compareCategories);
    expect(sorted[0]).toBe(DEFAULT_CATEGORY);
    expect(sorted.slice(1)).toEqual(["apple", "mango", "zebra"]);
  });
});

describe("groupJobsByCategory", () => {
  it("buckets jobs by resolved category, preserving order", () => {
    const jobs = [
      makeJob({ id: 1, category: "data" }),
      makeJob({ id: 2, category: null }),
      makeJob({ id: 3, category: "data" }),
      makeJob({ id: 4, category: "  " }),
    ];
    const groups = groupJobsByCategory(jobs);
    expect([...groups.keys()]).toEqual(["data", DEFAULT_CATEGORY]);
    expect(groups.get("data")!.map((j) => j.id)).toEqual([1, 3]);
    expect(groups.get(DEFAULT_CATEGORY)!.map((j) => j.id)).toEqual([2, 4]);
  });

  it("returns an empty map for no jobs", () => {
    expect(groupJobsByCategory([]).size).toBe(0);
  });
});

describe("isScheduled", () => {
  it("is true for cron and interval, false for manual", () => {
    expect(isScheduled({ schedule_type: "cron" })).toBe(true);
    expect(isScheduled({ schedule_type: "interval" })).toBe(true);
    expect(isScheduled({ schedule_type: "manual" })).toBe(false);
  });
});

describe("latestRunByJob", () => {
  it("keeps the first (newest) run per job id", () => {
    const runs = [
      makeRun({ id: 30, job_id: 2 }),
      makeRun({ id: 29, job_id: 1 }),
      makeRun({ id: 28, job_id: 2 }), // older for job 2, ignored
      makeRun({ id: 27, job_id: 1 }),
    ];
    const map = latestRunByJob(runs);
    expect(map.get(1)!.id).toBe(29);
    expect(map.get(2)!.id).toBe(30);
    expect(map.size).toBe(2);
  });

  it("returns an empty map for no runs", () => {
    expect(latestRunByJob([]).size).toBe(0);
  });
});

describe("dependentsOf", () => {
  it("finds jobs that depend on the given id", () => {
    const jobs = [
      makeJob({ id: 1 }),
      makeJob({ id: 2, depends_on: [1] }),
      makeJob({ id: 3, depends_on: [1, 2] }),
      makeJob({ id: 4, depends_on: [] }),
    ];
    expect(dependentsOf(1, jobs).map((j) => j.id)).toEqual([2, 3]);
    expect(dependentsOf(2, jobs).map((j) => j.id)).toEqual([3]);
    expect(dependentsOf(4, jobs)).toEqual([]);
  });

  it("tolerates a missing depends_on field", () => {
    const jobs = [makeJob({ id: 9, depends_on: undefined as unknown as number[] })];
    expect(dependentsOf(1, jobs)).toEqual([]);
  });
});

describe("upstreamChain", () => {
  const byId = (jobs: ReturnType<typeof makeJob>[]) =>
    new Map(jobs.map((j) => [j.id, j]));

  it("returns the breadth-first, de-duplicated upstream chain", () => {
    // 3 → 2 → 1, and 3 → 1 directly (diamond-ish); 1 should appear once.
    const j1 = makeJob({ id: 1 });
    const j2 = makeJob({ id: 2, depends_on: [1] });
    const j3 = makeJob({ id: 3, depends_on: [2, 1] });
    const chain = upstreamChain(j3, byId([j1, j2, j3]));
    expect(chain.map((j) => j.id)).toEqual([2, 1]);
  });

  it("is cycle-safe (does not loop on a → b → a)", () => {
    const a = makeJob({ id: 1, depends_on: [2] });
    const b = makeJob({ id: 2, depends_on: [1] });
    const chain = upstreamChain(a, byId([a, b]));
    expect(chain.map((j) => j.id)).toEqual([2]);
  });

  it("ignores dependency ids missing from the map", () => {
    const j = makeJob({ id: 1, depends_on: [999] });
    expect(upstreamChain(j, byId([j]))).toEqual([]);
  });

  it("returns empty for a job with no dependencies", () => {
    const j = makeJob({ id: 1, depends_on: [] });
    expect(upstreamChain(j, byId([j]))).toEqual([]);
  });
});
