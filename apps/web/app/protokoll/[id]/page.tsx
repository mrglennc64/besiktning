"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SchemaForm } from "@/components/SchemaForm";
import { api, Protokoll } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";

type Schema = {
  title?: string;
  properties?: Record<string, { title?: string }>;
  $defs?: Record<string, unknown>;
};

export default function ProtokollPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [protokoll, setProtokoll] = useState<Protokoll | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { save, status, error: saveError } = useAutosave<Record<string, unknown>>(
    async (patch) => {
      const p = await api.patchProtokoll(id, patch);
      setProtokoll(p);
      return p;
    },
    400,
  );

  // initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.getProtokoll(id);
        if (cancelled) return;
        setProtokoll(p);
        const s = (await api.getSchema(p.template)) as Schema;
        if (cancelled) return;
        setSchema(s);
        const firstSection = Object.keys(s.properties ?? {})[0] ?? "";
        setActiveSection(firstSection);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sections = useMemo(() => {
    if (!schema?.properties) return [];
    return Object.entries(schema.properties).map(([key, def]) => ({
      key,
      title: def.title ?? key,
    }));
  }, [schema]);

  if (loadError) {
    return (
      <main className="p-8">
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          ← Tillbaka
        </Link>
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </p>
      </main>
    );
  }

  if (!protokoll || !schema) {
    return <main className="p-8 text-sm text-gray-500">Laddar…</main>;
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-blue-700 hover:underline">
            ← Mina protokoll
          </Link>
          <h1 className="mt-1 text-xl font-semibold">
            {protokoll.number}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({protokoll.template})
            </span>
          </h1>
        </div>
        <SaveIndicator status={status} error={saveError} />
      </header>

      <div className="grid grid-cols-12 gap-6">
        <nav className="col-span-3 space-y-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                activeSection === s.key
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <section className="col-span-9 rounded border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {sections.find((s) => s.key === activeSection)?.title ?? activeSection}
          </h2>
          {activeSection && (
            <SchemaForm
              schema={schema as never}
              path={activeSection}
              value={protokoll.data}
              onPatch={(patch) => save(patch)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function SaveIndicator({
  status,
  error,
}: {
  status: "idle" | "saving" | "saved" | "error";
  error: string | null;
}) {
  if (status === "saving") return <span className="text-xs text-gray-500">Sparar…</span>;
  if (status === "saved") return <span className="text-xs text-green-600">Sparat</span>;
  if (status === "error")
    return <span className="text-xs text-red-600">Fel: {error}</span>;
  return <span className="text-xs text-gray-400">—</span>;
}
