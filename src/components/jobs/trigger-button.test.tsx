import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/api-client", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api-client")>();
  return { ...actual, api: { ...actual.api, post: vi.fn() } };
});

import { TriggerButton } from "./trigger-button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { renderWithProviders } from "../../../vitest/render-app";

const post = vi.mocked(api.post);

beforeEach(() => post.mockReset());

describe("TriggerButton", () => {
  it("posts to the job trigger endpoint and toasts on success", async () => {
    post.mockResolvedValue({ id: 55 });
    renderWithProviders(<TriggerButton jobId={3} jobName="nightly" />);

    await userEvent.setup().click(screen.getByRole("button", { name: /執行/ }));

    expect(post).toHaveBeenCalledWith("/api/jobs/3/trigger");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已排入佇列"));
  });

  it("disables the button while the trigger is in flight", async () => {
    let resolve: (v: unknown) => void = () => {};
    post.mockReturnValue(new Promise((r) => (resolve = r)));
    renderWithProviders(<TriggerButton jobId={3} />);
    const btn = screen.getByRole("button", { name: /執行/ });

    await userEvent.setup().click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    resolve({ id: 1 });
    await waitFor(() => expect(btn).toBeEnabled());
  });
});
