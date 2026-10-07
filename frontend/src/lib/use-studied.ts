"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "climber:studied";
const storageKey = (routeId: number) => `climber:studied:${routeId}`;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

/** Per-route set of hold ids the climber has marked as studied, kept in localStorage. */
export function useStudied(routeId: number) {
  const key = storageKey(routeId);
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => "[]",
  );

  const studied = useMemo(() => {
    try {
      return new Set<number>(JSON.parse(raw));
    } catch {
      return new Set<number>();
    }
  }, [raw]);

  const write = useCallback(
    (next: Set<number>) => {
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        // Storage can be unavailable (private mode); progress just won't persist.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  const toggle = useCallback(
    (holdId: number, value?: boolean) => {
      const next = new Set(studied);
      if (value ?? !next.has(holdId)) next.add(holdId);
      else next.delete(holdId);
      write(next);
    },
    [studied, write],
  );

  const reset = useCallback(() => write(new Set()), [write]);

  return { studied, toggle, reset };
}
