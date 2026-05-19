"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api, Template } from "@/lib/api";

const TEMPLATES: { value: Template; label: string; desc: string; disabled?: boolean }[] = [
  {
    value: "apartment",
    label: "Lägenhet",
    desc: "Styrelseguidens checklista för bostadsrätt — in- och avflyttning.",
  },
  {
    value: "smahus",
    label: "Småhus",
    desc: "Mellanstort husprotokoll. (Schema kommer i M7.)",
    disabled: true,
  },
  {
    value: "house",
    label: "Hus",
    desc: "Anticimex-stil fullständigt husprotokoll. (Schema kommer i M7.)",
    disabled: true,
  },
];

export default function NewProtokollPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(template: Template) {
    setCreating(template);
    setError(null);
    try {
      const p = await api.createProtokoll(template);
      router.push(`/protokoll/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreating(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold">Nytt protokoll</h1>
        <p className="text-sm text-gray-500">Välj mall för besiktningen.</p>
      </header>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            disabled={t.disabled || creating !== null}
            onClick={() => create(t.value)}
            className="flex flex-col items-start gap-2 rounded border border-gray-200 p-4 text-left hover:border-blue-500 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium">{t.label}</span>
            <span className="text-xs text-gray-500">{t.desc}</span>
            {creating === t.value && (
              <span className="text-xs text-blue-600">Skapar…</span>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}
