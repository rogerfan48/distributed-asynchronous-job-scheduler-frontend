"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "js:favorites";

/**
 * Pinned ("常用") job ids. The backend has no favorites field, so this is a
 * per-browser convenience. Backed by a module-level store + useSyncExternalStore
 * so every component (favorites list, star toggles…) stays in sync.
 */
let favorites: number[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT: number[] = [];

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      favorites = parsed.filter((x): x is number => typeof x === "number");
    }
  } catch {
    // ignore corrupt / disabled storage
  }
}

function emit() {
  for (const l of listeners) l();
}

function persist(next: number[]) {
  favorites = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / disabled storage
  }
  emit();
}

function subscribe(cb: () => void) {
  // Defer load to after hydration to keep first client render === server ([]).
  load();
  if (favorites.length) cb();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function toggleFavorite(id: number) {
  persist(favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]);
}

export function useFavorites() {
  const ids = useSyncExternalStore(
    subscribe,
    () => favorites,
    () => SERVER_SNAPSHOT,
  );
  const toggle = useCallback((id: number) => toggleFavorite(id), []);
  const isFavorite = useCallback((id: number) => ids.includes(id), [ids]);
  return { favorites: ids, toggle, isFavorite };
}
