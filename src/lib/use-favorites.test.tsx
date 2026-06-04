import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const STORAGE_KEY = "js:favorites";

// The store keeps module-level state, so reset modules + storage each test.
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

async function load() {
  return import("./use-favorites");
}

describe("useFavorites", () => {
  it("starts empty when nothing is stored", async () => {
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite(1)).toBe(false);
  });

  it("toggles ids on and off and reports membership", async () => {
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggle(42));
    expect(result.current.favorites).toContain(42);
    expect(result.current.isFavorite(42)).toBe(true);

    act(() => result.current.toggle(42));
    expect(result.current.favorites).not.toContain(42);
    expect(result.current.isFavorite(42)).toBe(false);
  });

  it("persists favorites to localStorage", async () => {
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(7));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([7]);
  });

  it("hydrates from pre-existing localStorage on mount", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]));
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([1, 2, 3]);
  });

  it("ignores corrupt stored data", async () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it("filters out non-numeric stored values", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, "two", 3, null]));
    const { useFavorites } = await load();
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([1, 3]);
  });

  it("keeps multiple subscribers in sync", async () => {
    const { useFavorites, toggleFavorite } = await load();
    const a = renderHook(() => useFavorites());
    const b = renderHook(() => useFavorites());
    act(() => toggleFavorite(99));
    expect(a.result.current.favorites).toContain(99);
    expect(b.result.current.favorites).toContain(99);
  });
});
