import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api-client", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-client")>();
  return { ...actual, api: { ...actual.api, post: vi.fn() } };
});

import { RunActions } from "./run-actions";
import { api } from "@/lib/api-client";
import { renderWithProviders } from "../../../vitest/render-app";
import { makeRun } from "../../../vitest/factories";

const post = vi.mocked(api.post);

beforeEach(() => post.mockReset());

describe("RunActions", () => {
  it("offers 重跑 for a terminal run and posts retry after confirming", async () => {
    post.mockResolvedValue(makeRun({ id: 2 }));
    const user = userEvent.setup();
    renderWithProviders(<RunActions run={makeRun({ id: 1, status: "failed" })} />);

    await user.click(screen.getByRole("button", { name: /重跑/ }));
    expect(screen.getByText("重跑 run #1？")).toBeInTheDocument();
    // The dialog's confirm button shares the label; click the one inside the dialog.
    await user.click(screen.getByRole("button", { name: "重跑" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/runs/1/retry"));
  });

  it("offers 終止 for an active run and posts cancel after confirming", async () => {
    post.mockResolvedValue(makeRun({ id: 1, status: "canceled" }));
    const user = userEvent.setup();
    renderWithProviders(<RunActions run={makeRun({ id: 1, status: "running" })} />);

    await user.click(screen.getByRole("button", { name: /終止/ }));
    expect(screen.getByText("終止 run #1？")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "終止執行" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/api/runs/1/cancel"));
  });

  it("renders nothing for a run that is neither active nor terminal", () => {
    const { container } = renderWithProviders(
      <RunActions run={makeRun({ status: "bogus" as unknown as "running" })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
