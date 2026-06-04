import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// useFavorites is backed by module-level state; isolate it per test.
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe("FavoriteToggle", () => {
  it("starts unpressed with a 'set favorite' label", async () => {
    const { FavoriteToggle } = await import("./favorite-toggle");
    render(<FavoriteToggle jobId={1} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveAccessibleName("設為常用");
  });

  it("toggles pinned state and label on click", async () => {
    const { FavoriteToggle } = await import("./favorite-toggle");
    render(<FavoriteToggle jobId={1} />);
    const btn = screen.getByRole("button");

    await userEvent.setup().click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveAccessibleName("取消常用");
  });

  it("reflects a pre-existing favorite from storage", async () => {
    localStorage.setItem("js:favorites", JSON.stringify([5]));
    const { FavoriteToggle } = await import("./favorite-toggle");
    render(<FavoriteToggle jobId={5} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});
