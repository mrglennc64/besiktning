"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { emptyCase } from "@/lib/case/template";
import type { CaseDoc } from "@/lib/case/types";
import type { CatalogLookup } from "@/lib/case/edits";
import { useCase } from "./useCase";
import { CaseChat } from "./CaseChat";
import { CasePreview } from "./CasePreview";

type Entry = { title: string; body: string };

export function CaseWorkspace() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [initial, setInitial] = useState<CaseDoc | null>(null);
  const [entries, setEntries] = useState<Map<string, Entry>>(new Map());
  const [creating, setCreating] = useState(false);

  // Load the catalog once (titles + bodies for the preview + lookup).
  useEffect(() => {
    void fetch("/api/catalog").then((r) => r.json()).then((rows: { id: string; title: string; body: string }[]) => {
      setEntries(new Map(rows.map((e) => [e.id, { title: e.title, body: e.body }])));
    }).catch(() => {});
  }, []);

  const catalog: CatalogLookup = useMemo(() => ({
    has: (id) => entries.has(id),
    title: (id) => entries.get(id)?.title ?? id,
    search: (q) => {
      const n = q.toLowerCase();
      return [...entries.entries()].filter(([id, e]) => e.title.toLowerCase().includes(n) || id.toLowerCase().includes(n)).slice(0, 8).map(([id, e]) => ({ id, title: e.title }));
    },
  }), [entries]);

  async function createCase() {
    setCreating(true);
    try {
      const p = await api.createProtokoll("overlatelse");
      const doc = emptyCase();
      await api.patchProtokoll(p.id, doc as unknown as Record<string, unknown>);
      setCaseId(p.id); setInitial(doc);
    } finally { setCreating(false); }
  }

  if (!caseId || !initial) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <p className="text-stone-700">Inget ärende öppet.</p>
        <button type="button" onClick={() => void createCase()} disabled={creating} className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40">
          {creating ? "Skapar…" : "Nytt ärende"}
        </button>
      </div>
    );
  }
  return <LoadedWorkspace caseId={caseId} initial={initial} entries={entries} catalog={catalog} />;
}

function LoadedWorkspace({ caseId, initial, entries, catalog }: { caseId: string; initial: CaseDoc; entries: Map<string, Entry>; catalog: CatalogLookup }) {
  const { doc, apply, status } = useCase(caseId, initial, catalog);
  const name = doc.parter_och_uppdrag.fastighet_namn || "Nytt ärende";
  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
        <span className="font-medium">Ärende: {name}</span>
        <span className="text-xs text-stone-400">{status === "saving" ? "Sparar…" : status === "saved" ? "Sparat" : status === "error" ? "Kunde ej spara" : ""}</span>
      </div>
      <div className="grid gap-0 md:grid-cols-[2fr_3fr]">
        <div className="h-[70vh] border-r border-stone-200 p-3"><CaseChat doc={doc} onEdits={apply} /></div>
        <div className="h-[70vh] overflow-y-auto p-4"><CasePreview doc={doc} entries={entries} /></div>
      </div>
    </div>
  );
}
