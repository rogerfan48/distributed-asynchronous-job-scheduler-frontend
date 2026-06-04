import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, statusLabel } from "./status-badge";

describe("statusLabel", () => {
  it("maps known statuses to zh-TW labels", () => {
    expect(statusLabel("running")).toBe("執行中");
    expect(statusLabel("succeeded")).toBe("成功");
    expect(statusLabel("timed_out")).toBe("逾時");
    expect(statusLabel("canceled")).toBe("已取消");
  });

  it("labels a missing status as 尚未執行", () => {
    expect(statusLabel(null)).toBe("尚未執行");
    expect(statusLabel(undefined)).toBe("尚未執行");
  });

  it("echoes an unknown status verbatim", () => {
    expect(statusLabel("mystery")).toBe("mystery");
  });
});

describe("StatusBadge", () => {
  it("renders the label for a known status", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("失敗")).toBeInTheDocument();
  });

  it("renders 尚未執行 for a null status", () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText("尚未執行")).toBeInTheDocument();
  });

  it("renders an unknown status string in the fallback chip", () => {
    render(<StatusBadge status="weird" />);
    expect(screen.getByText("weird")).toBeInTheDocument();
  });
});
