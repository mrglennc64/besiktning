"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave hook.
 *
 * Returns a `save(patch)` you call on every form change, plus a `status`
 * string suitable for displaying "Sparar…", "Sparat", or an error.
 *
 * Multiple rapid calls within `debounceMs` collapse into one PATCH that
 * merges all the patches together (so we don't drop any field changes).
 */
export function useAutosave<TPatch extends Record<string, unknown>>(
  saveFn: (patch: TPatch) => Promise<unknown>,
  debounceMs: number = 500,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<TPatch | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const patch = pendingRef.current;
    pendingRef.current = null;
    if (!patch) return;
    setStatus("saving");
    try {
      await saveFn(patch);
      setStatus("saved");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [saveFn]);

  const save = useCallback(
    (patch: TPatch) => {
      pendingRef.current = mergeDeep(pendingRef.current ?? ({} as TPatch), patch);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, debounceMs);
    },
    [debounceMs, flush],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, status, error, flush };
}

function mergeDeep<T extends Record<string, unknown>>(base: T, patch: T): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === "object" &&
      !Array.isArray(out[k])
    ) {
      out[k] = mergeDeep(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
