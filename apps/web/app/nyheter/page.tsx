import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { api, type NewsItem } from "@/lib/api";

export const metadata = {
  title: "Nyheter & podd – Besiktning",
  description:
    "Veckans nyheter om besiktning, fastighet och bostadsköp — automatiskt insamlat från Sveriges trade- och myndighetspublikationer, plus tips från våra medlemmar.",
};

export const dynamic = "force-dynamic";

export default async function NyheterPage() {
  let items: NewsItem[] = [];
  let error: string | null = null;
  try {
    items = await api.listNews(50);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <section className="mx-auto max-w-3xl px-6 py-12">
        {error && (
          <div className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Kunde inte hämta nyheter just nu: {error}
          </div>
        )}
        {!error && items.length === 0 && <EmptyState />}
        {!error && items.length > 0 && <NewsList items={items} />}
      </section>
      <SubmitTeaser />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
          Nyheter &amp; podd
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Veckans urval — om besiktning, fastighet och bostadsköp.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Automatiskt insamlat varje söndag från Sveriges trade- och
          myndighetspublikationer, plus tips som våra medlemmar skickar in.
          Inga betalda placeringar.
        </p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <p className="text-base font-medium text-stone-700">
        Inga publicerade nyheter än.
      </p>
      <p className="mt-2 text-sm text-stone-500">
        Veckans skörd publiceras varje söndag kväll. Har du tips? Skicka in
        det — vi går igenom alla bidrag manuellt.
      </p>
      <Link
        href="/nyheter/skicka-in"
        className="mt-5 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
      >
        Skicka in ett tips →
      </Link>
    </div>
  );
}

function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="space-y-6">
      {items.map((it) => (
        <li key={it.id} className="rounded-lg border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <SourceBadge type={it.source_type} />
            <span>·</span>
            <span>{it.source_name}</span>
            {it.published_at && (
              <>
                <span>·</span>
                <time dateTime={it.published_at}>
                  {new Date(it.published_at).toLocaleDateString("sv-SE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
          <h3 className="mt-2 text-lg font-medium leading-snug">
            <a
              href={it.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-stone-900 hover:text-amber-800"
            >
              {it.title}
            </a>
          </h3>
          {it.summary && (
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              {it.summary}
            </p>
          )}
          <a
            href={it.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-xs font-medium text-amber-800 hover:text-amber-900"
          >
            Läs på {hostnameOf(it.url)} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

function SourceBadge({ type }: { type: NewsItem["source_type"] }) {
  const labels: Record<NewsItem["source_type"], { label: string; cls: string }> = {
    rss: { label: "Nyhet", cls: "bg-stone-100 text-stone-700" },
    member: { label: "Medlemstips", cls: "bg-amber-100 text-amber-800" },
    podcast: { label: "Podd", cls: "bg-emerald-100 text-emerald-800" },
  };
  const { label, cls } = labels[type];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SubmitTeaser() {
  return (
    <section className="border-t border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Sett något vi borde plocka upp?
        </h2>
        <p className="mt-2 text-stone-600">
          Branschnyheter, intressanta fall, podcasts, blogginlägg — skicka in.
          Vi går igenom varje bidrag manuellt innan det publiceras.
        </p>
        <Link
          href="/nyheter/skicka-in"
          className="mt-5 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Skicka in tips →
        </Link>
      </div>
    </section>
  );
}
