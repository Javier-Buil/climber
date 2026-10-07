"use client";

import { useCallback, useEffect, useState } from "react";

interface Result<T> {
  key: string | null;
  data?: T;
  error?: Error;
}

/**
 * Minimal data hook: runs `load` whenever `key` changes. A `null` key skips
 * loading. `load` must only depend on values that are encoded in `key`.
 */
export function useApi<T>(key: string | null, load: () => Promise<T>) {
  const [result, setResult] = useState<Result<T>>({ key: null });

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    load().then(
      (data) => !cancelled && setResult({ key, data }),
      (error: Error) => !cancelled && setResult({ key, error }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const mutate = useCallback(
    (update: (prev: T) => T) =>
      setResult((r) => (r.key === key && r.data !== undefined ? { ...r, data: update(r.data) } : r)),
    [key],
  );

  // Ignore results that belong to a previous key.
  const current = result.key === key ? result : { key };
  return {
    data: current.data,
    error: current.error,
    loading: key !== null && current.data === undefined && current.error === undefined,
    mutate,
  };
}
