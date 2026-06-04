import { describe, it, expect, vi, beforeEach } from "vitest";

// Every `/api/*` handler is a thin delegation to proxyApi(req, backendPath).
// This suite locks in the path mapping (and `await params` for dynamic routes)
// for the whole BFF surface — proxyApi's behaviour itself is tested in bff.test.
const { proxyApiMock } = vi.hoisted(() => ({
  proxyApiMock: vi.fn(async () => new Response(null, { status: 200 })),
}));
vi.mock("@/lib/bff", () => ({ proxyApi: proxyApiMock }));

import { GET as authMe } from "./auth/me/route";
import { GET as listJobs, POST as createJob } from "./jobs/route";
import { GET as getJob, PUT as updateJob, DELETE as deleteJob } from "./jobs/[id]/route";
import { GET as jobsRecent } from "./jobs/recent/route";
import { POST as draftFromFile } from "./jobs/drafts/from-file/route";
import { GET as jobRuns } from "./jobs/[id]/runs/route";
import { GET as jobLogs } from "./jobs/[id]/logs/route";
import { GET as jobLatestRun } from "./jobs/[id]/latest-run/route";
import { POST as jobTrigger } from "./jobs/[id]/trigger/route";
import { GET as listRuns } from "./runs/route";
import { GET as getRun } from "./runs/[id]/route";
import { GET as runLogs } from "./runs/[id]/logs/route";
import { POST as runRetry } from "./runs/[id]/retry/route";
import { POST as runCancel } from "./runs/[id]/cancel/route";

const req = (url = "http://app/api/x", init?: RequestInit) => new Request(url, init);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => proxyApiMock.mockClear());

describe("static BFF routes", () => {
  it.each([
    ["GET /auth/me", () => authMe(req()), "/auth/me"],
    ["GET /jobs", () => listJobs(req()), "/jobs"],
    ["POST /jobs", () => createJob(req("http://app/api/x", { method: "POST" })), "/jobs"],
    ["GET /jobs/recent", () => jobsRecent(req()), "/jobs/recent"],
    ["POST /jobs/drafts/from-file", () => draftFromFile(req("http://app/api/x", { method: "POST" })), "/jobs/drafts/from-file"],
    ["GET /runs", () => listRuns(req()), "/runs"],
  ])("%s proxies to the backend path", async (_label, call, expected) => {
    await call();
    expect(proxyApiMock).toHaveBeenCalledWith(expect.any(Request), expected);
  });
});

describe("dynamic BFF routes await params and interpolate the id", () => {
  it.each([
    ["GET /jobs/{id}", (r: Request) => getJob(r, ctx("12")), "/jobs/12"],
    ["PUT /jobs/{id}", (r: Request) => updateJob(r, ctx("12")), "/jobs/12"],
    ["DELETE /jobs/{id}", (r: Request) => deleteJob(r, ctx("12")), "/jobs/12"],
    ["GET /jobs/{id}/runs", (r: Request) => jobRuns(r, ctx("12")), "/jobs/12/runs"],
    ["GET /jobs/{id}/logs", (r: Request) => jobLogs(r, ctx("12")), "/jobs/12/logs"],
    ["GET /jobs/{id}/latest-run", (r: Request) => jobLatestRun(r, ctx("12")), "/jobs/12/latest-run"],
    ["POST /jobs/{id}/trigger", (r: Request) => jobTrigger(r, ctx("12")), "/jobs/12/trigger"],
    ["GET /runs/{id}", (r: Request) => getRun(r, ctx("99")), "/runs/99"],
    ["GET /runs/{id}/logs", (r: Request) => runLogs(r, ctx("99")), "/runs/99/logs"],
    ["POST /runs/{id}/retry", (r: Request) => runRetry(r, ctx("99")), "/runs/99/retry"],
    ["POST /runs/{id}/cancel", (r: Request) => runCancel(r, ctx("99")), "/runs/99/cancel"],
  ])("%s", async (_label, call, expected) => {
    const r = req();
    await call(r);
    expect(proxyApiMock).toHaveBeenCalledWith(r, expected);
  });
});
