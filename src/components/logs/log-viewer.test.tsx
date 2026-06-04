import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogViewer } from "./log-viewer";
import type { JobRunLog } from "@/lib/types";

const log = (over: Partial<JobRunLog>): JobRunLog =>
  ({ id: 1, run_id: 1, ts: "2024-01-01T00:00:00Z", stream: "stdout", line: "hello", ...over }) as JobRunLog;

describe("LogViewer", () => {
  it("shows a loading state while fetching with no logs yet", () => {
    render(<LogViewer logs={[]} loading />);
    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  it("shows the default empty text when there are no logs", () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText("尚無 log")).toBeInTheDocument();
  });

  it("shows a custom empty text", () => {
    render(<LogViewer logs={[]} emptyText="這個 run 還沒輸出" />);
    expect(screen.getByText("這個 run 還沒輸出")).toBeInTheDocument();
  });

  it("renders log lines with per-stream labels", () => {
    render(
      <LogViewer
        logs={[
          log({ id: 1, stream: "stdout", line: "building" }),
          log({ id: 2, stream: "stderr", line: "warning!" }),
          log({ id: 3, stream: "system", line: "worker started" }),
        ]}
      />,
    );
    expect(screen.getByText("building")).toBeInTheDocument();
    expect(screen.getByText("warning!")).toBeInTheDocument();
    expect(screen.getByText("worker started")).toBeInTheDocument();
    expect(screen.getByText("OUT")).toBeInTheDocument();
    expect(screen.getByText("ERR")).toBeInTheDocument();
    expect(screen.getByText("SYS")).toBeInTheDocument();
  });
});
