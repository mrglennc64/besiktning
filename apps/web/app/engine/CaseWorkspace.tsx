"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { emptyCase } from "@/lib/case/template";
import { sectionForCategory } from "@/lib/case/sectionForCategory";
import type { CaseDoc } from "@/lib/case/types";
import type { CatalogLookup } from "@/lib/case/edits";
import type { ProtokollSummary } from "@/lib/api";
import { useCase } from "./useCase";
import { CaseChat } from "./CaseChat";
import { CasePreview } from "./CasePreview";
import { PhotoLoop } from "./PhotoLoop";

type Entry = { title: string; body: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge `patch` onto `base`: nested objects merge recursively, arrays and
 * scalars from `patch` replace the corresponding value in `base`. */
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : (patch as T));
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = deepMerge((base as Record<string, unknown>)[key], value);
  }
  return out as T;
}

/** Overlay stored protokoll data onto a complete empty case so missing/partial
 * sections never break the preview. */
function hydrate(data: Record<string, unknown>): CaseDoc {
  return deepMerge(emptyCase(), data);
}

export function CaseWorkspace() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [initial, setInitial] = useState<CaseDoc | null>(null);
  const [entries, setEntries] = useState<Map<string, Entry>>(new Map());
  const [creating, setCreating] = useState(false);
  const [cases, setCases] = useState<ProtokollSummary[]>([]);

  // Load existing överlåtelse cases for the picker. Errors → empty list.
  useEffect(() => {
    void api
      .listProtokoll()
      .then((rows) => setCases(rows.filter((p) => p.template === "overlatelse")))
      .catch(() => {});
  }, []);

  async function openCase(id: string) {
    const p = await api.getProtokoll(id);
    setInitial(hydrate(p.data));
    setCaseId(id);
  }

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
      <div className="rounded-xl border border-stone-200 bg-white p-8">
        <div className="text-center">
          <p className="text-stone-700">Inget ärende öppet.</p>
          <button type="button" onClick={() => void createCase()} disabled={creating} className="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40">
            {creating ? "Skapar…" : "Nytt ärende"}
          </button>
        </div>
        {cases.length > 0 && (
          <div className="mx-auto mt-8 max-w-md text-left">
            <h2 className="text-sm font-medium text-stone-700">Mina ärenden</h2>
            <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
              {cases.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void openCase(c.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-stone-50"
                  >
                    <span className="font-medium text-stone-800">{c.number}</span>
                    <span className="text-xs text-stone-400">{c.updated_at.slice(0, 10)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return <LoadedWorkspace caseId={caseId} initial={initial} entries={entries} catalog={catalog} />;
}

function LoadedWorkspace({ caseId, initial, entries, catalog }: { caseId: string; initial: CaseDoc; entries: Map<string, Entry>; catalog: CatalogLookup }) {
  const { doc, apply, status } = useCase(caseId, initial, catalog);
  const [exporting, setExporting] = useState(false);
  const name = doc.parter_och_uppdrag.fastighet_namn || "Nytt ärende";

  async function exportWord() {
    setExporting(true);
    try {
      const res = await fetch("/api/case-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case: doc, filename: `utlatande-${name}` }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `utlatande-${name.replace(/[^a-z0-9_-]/gi, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Export misslyckades: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
        <span className="font-medium">Ärende: {name}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{status === "saving" ? "Sparar…" : status === "saved" ? "Sparat" : status === "error" ? "Kunde ej spara" : ""}</span>
          <button
            type="button"
            onClick={() => void exportWord()}
            disabled={exporting}
            className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-40"
          >
            {exporting ? "Exporterar…" : "Exportera (Word)"}
          </button>
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[2fr_3fr]">
        <div className="h-[70vh] border-r border-stone-200 p-3"><CaseChat doc={doc} onEdits={apply} /></div>
        <div className="h-[70vh] overflow-y-auto p-4"><CasePreview doc={doc} entries={entries} /></div>
      </div>
      <div className="border-t border-stone-200 p-3">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-stone-700">Foton</summary>
          <div className="mt-3">
            <PhotoLoop onAddFinding={(id, photoName, category) => apply([{ op: "add_finding", section: sectionForCategory(category), notering_id: id, photo_refs: [photoName] }])} />
          </div>
        </details>
      </div>
    </div>
  );
}
