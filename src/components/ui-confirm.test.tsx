import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ui-confirm";

function setup(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onOpenChange = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="刪除任務"
      description="此動作無法復原"
      confirmLabel="刪除"
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onConfirm, onOpenChange, user: userEvent.setup() };
}

describe("ConfirmDialog", () => {
  it("renders the title, description and action labels when open", () => {
    setup();
    expect(screen.getByText("刪除任務")).toBeInTheDocument();
    expect(screen.getByText("此動作無法復原")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刪除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("runs onConfirm then closes on confirm", async () => {
    const { onConfirm, onOpenChange, user } = setup();
    await user.click(screen.getByRole("button", { name: "刪除" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes without confirming on cancel", async () => {
    const { onConfirm, onOpenChange, user } = setup();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open when onConfirm rejects", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="t"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "確認" }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
