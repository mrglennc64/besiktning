"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";
import { applyEdits, type CatalogLookup } from "@/lib/case/edits";
import type { CaseDoc, Edit } from "@/lib/case/types";

/**
 * Holds the working case document. `applyEdits` produces a new doc and
 * autosaves the whole doc as the PATCH payload (the backend _deep_merge
 * replaces arrays, so findings/riskanalys update correctly).
 */
export function useCase(caseId: string, initial: CaseDoc, catalog: CatalogLookup) {
  const [doc, setDoc] = useState<CaseDoc>(initial);
  const saveFn = useCallback(
    (patch: Record<string, unknown>) => api.patchProtokoll(caseId, patch),
    [caseId],
  );
  const { save, status, error } = useAutosave<Record<string, unknown>>(saveFn, 400);

  const apply = useCallback(
    (edits: Edit[]) => {
      setDoc((prev) => {
        const { doc: next } = applyEdits(prev, edits, catalog);
        save(next as unknown as Record<string, unknown>);
        return next;
      });
    },
    [catalog, save],
  );

  const replace = useCallback(
    (next: CaseDoc) => { setDoc(next); save(next as unknown as Record<string, unknown>); },
    [save],
  );

  return useMemo(() => ({ doc, apply, replace, status, error }), [doc, apply, replace, status, error]);
}
