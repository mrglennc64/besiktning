import Link from "next/link";

import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let rows: Awaited<ReturnType<typeof api.listProtokoll>> = [];
  let health: { status: string; storage: string } | null = null;
  let error: string | null = null;

  try {
    [rows, health] = await Promise.all([api.listProtokoll(), api.healthz()]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Besiktning</h1>
        <Link
          href="/protokoll/new"
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nytt protokoll
        </Link>
      </header>

      {health && (
        <p className="text-xs text-gray-500">
          API ok · storage: <code>{health.storage}</code>
        </p>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          Kunde inte nå API: {error}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
          Mina protokoll
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Inga protokoll än.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded border border-gray-200">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-3">
                <Link
                  href={`/protokoll/${r.id}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {r.number}
                </Link>
                <span className="text-xs text-gray-500">
                  {r.template} · {r.status} ·{" "}
                  {new Date(r.updated_at).toLocaleString("sv-SE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
