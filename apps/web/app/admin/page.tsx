import Link from "next/link";

import { apiFetch } from "@/lib/session";

interface NewsItem {
  id: string;
  title: string;
  created_at: string;
}

interface MemberApp {
  id: string;
  name: string;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  let pendingNews: NewsItem[] = [];
  let pendingApps: MemberApp[] = [];
  let error: string | null = null;

  try {
    [pendingNews, pendingApps] = await Promise.all([
      apiFetch<NewsItem[]>("/admin/news/pending"),
      apiFetch<MemberApp[]>("/admin/members/pending"),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
      <p className="mt-2 text-stone-600">
        Moderera nyhetstips och medlemsansökningar.
      </p>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Kunde inte hämta data: {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card
          href="/admin/news"
          title="Nyhetstips att granska"
          count={pendingNews.length}
          countLabel={pendingNews.length === 1 ? "tips" : "tips"}
          recent={pendingNews.slice(0, 3).map((n) => n.title)}
        />
        <Card
          href="/admin/medlemmar"
          title="Medlemsansökningar"
          count={pendingApps.length}
          countLabel={pendingApps.length === 1 ? "ansökan" : "ansökningar"}
          recent={pendingApps.slice(0, 3).map((a) => a.name)}
        />
      </div>
    </section>
  );
}

function Card({
  href,
  title,
  count,
  countLabel,
  recent,
}: {
  href: string;
  title: string;
  count: number;
  countLabel: string;
  recent: string[];
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-stone-200 bg-white p-6 transition hover:border-amber-400"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-3xl font-semibold text-amber-700">{count}</span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-widest text-stone-500">
        väntande {countLabel}
      </p>
      {recent.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-stone-600">
          {recent.map((r, i) => (
            <li key={i} className="truncate">
              · {r}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm font-medium text-amber-800">Öppna →</p>
    </Link>
  );
}
