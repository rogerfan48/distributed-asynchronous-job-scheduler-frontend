import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DependencyHint } from "./dependency-hint";
import { makeJob } from "../../../vitest/factories";

const extract = makeJob({ id: 1, name: "extract" });
const transform = makeJob({ id: 2, name: "transform", depends_on: [1] });
const load = makeJob({ id: 3, name: "load", depends_on: [2] });
const byId = new Map([extract, transform, load].map((j) => [j.id, j]));

describe("DependencyHint", () => {
  it("renders nothing when the job has no resolvable dependencies", () => {
    const { container } = render(<DependencyHint job={extract} byId={byId} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the direct upstream names as a button", () => {
    render(<DependencyHint job={load} byId={byId} />);
    expect(screen.getByRole("button", { name: /transform/ })).toBeInTheDocument();
  });

  it("opens a dialog with the full execution order, marking the current job", async () => {
    render(<DependencyHint job={load} byId={byId} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /transform/ }));

    expect(screen.getByText("相依執行順序：load")).toBeInTheDocument();
    // Upstream chain + the triggered job all appear, with the current one flagged.
    expect(screen.getByText("extract")).toBeInTheDocument();
    expect(screen.getByText("（本任務）")).toBeInTheDocument();
  });
});
