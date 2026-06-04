import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchedulePill } from "./schedule-pill";

describe("SchedulePill", () => {
  it("shows the cron label with enabled state", () => {
    render(<SchedulePill job={{ schedule_type: "cron", schedule_expr: "0 * * * *", enabled: true }} />);
    expect(screen.getByText("Cron · 0 * * * *")).toBeInTheDocument();
    expect(screen.getByText(/啟用/)).toBeInTheDocument();
  });

  it("shows the interval label", () => {
    render(<SchedulePill job={{ schedule_type: "interval", schedule_expr: "120", enabled: true }} />);
    expect(screen.getByText("每 2 分鐘")).toBeInTheDocument();
  });

  it("shows 停用 and greys the text for a disabled scheduled job", () => {
    const { container } = render(
      <SchedulePill job={{ schedule_type: "cron", schedule_expr: "* * * * *", enabled: false }} />,
    );
    expect(screen.getByText(/停用/)).toBeInTheDocument();
    expect(container.firstElementChild!.className).toContain("text-muted-foreground");
  });

  it("renders 手動 without an enabled/disabled suffix for manual jobs", () => {
    render(<SchedulePill job={{ schedule_type: "manual", schedule_expr: null, enabled: true }} />);
    expect(screen.getByText("手動")).toBeInTheDocument();
    expect(screen.queryByText(/啟用|停用/)).not.toBeInTheDocument();
  });
});
