import { apiFetch } from "@/lib/session";

import { moderateNews } from "../actions";

interface NewsItem {
  id: string;
  source_type: "rss" | "member" | "podcast";
  source_name: string;
  title: string;
  url: string;
  summary: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  let items: NewsItem[] = [];
  let error: string | null = null;
  try {
    items = await apiFetch<NewsItem[]>("/admin/news/pending");
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Nyhetstips att granska</h1>
      <p className="mt-2 text-stone-600">
        Publicerade tips visas på <code className="text-xs">/nyheter</code>.
        Avvisade försvinner från kön.
      </p>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && items.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-stone-500">
          Inga väntande tips just nu.
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {items.map((it) => (
          <ItemCard key={it.id} item={it} />
        ))}
      </ul>
    </section>
  );
}

function ItemCard({ item }: { item: NewsItem }) {
  const submitted = new Date(item.created_at).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="text-xs text-stone-500">
        Inskickat {submitted}
        {item.submitter_name && (
          <>
            {" · av "}
            <span className="font-medium text-stone-700">{item.submitter_name}</span>
            {item.submitter_email && (
              <>
                {" "}
                &lt;{item.submitter_email}&gt;
              </>
            )}
          </>
        )}
      </div>
      <h2 className="mt-2 text-lg font-medium leading-snug">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-stone-900 hover:text-amber-800"
        >
          {item.title}
        </a>
      </h2>
      {item.summary && (
        <p className="mt-2 text-sm text-stone-700">{item.summary}</p>
      )}
      <p className="mt-2 text-xs text-stone-500">{item.url}</p>
      <div className="mt-4 flex gap-2 border-t border-stone-200 pt-4">
        <form action={moderateNews.bind(null, item.id, "approve")}>
          <button
            type="submit"
            className="rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Publicera
          </button>
        </form>
        <form action={moderateNews.bind(null, item.id, "reject")}>
          <button
            type="submit"
            className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Avvisa
          </button>
        </form>
      </div>
    </li>
  );
}
