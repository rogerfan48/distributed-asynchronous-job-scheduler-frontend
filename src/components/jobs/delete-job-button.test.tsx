import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api-client", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-client")>();
  return { ...actual, api: { ...actual.api, del: vi.fn() } };
});

import { DeleteJobButton } from "./delete-job-button";
import { api } from "@/lib/api-client";
import { renderWithProviders } from "../../../vitest/render-app";
import { makeJob } from "../../../vitest/factories";

const del = vi.mocked(api.del);

beforeEach(() => del.mockReset());

describe("DeleteJobButton", () => {
  it("confirms then deletes the job", async () => {
    del.mockResolvedValue(null);
    const job = makeJob({ id: 4, name: "cleanup" });
    const user = userEvent.setup();
    renderWithProviders(<DeleteJobButton job={job} allJobs={[job]} />);

    await user.click(screen.getByRole("button", { name: "刪除任務" }));
    expect(screen.getByText("刪除任務「cleanup」？")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "刪除" }));

    await waitFor(() => expect(del).toHaveBeenCalledWith("/api/jobs/4"));
  });

  it("warns about downstream dependents in the confirmation", async () => {
    const job = makeJob({ id: 1, name: "extract" });
    const downstream = makeJob({ id: 2, name: "transform", depends_on: [1] });
    const user = userEvent.setup();
    renderWithProviders(<DeleteJobButton job={job} allJobs={[job, downstream]} />);

    await user.click(screen.getByRole("button", { name: "刪除任務" }));
    expect(screen.getByText(/有 1 個任務相依於它/)).toBeInTheDocument();
    expect(screen.getByText("transform")).toBeInTheDocument();
  });
});
