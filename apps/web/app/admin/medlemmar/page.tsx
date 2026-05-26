import { apiFetch } from "@/lib/session";

import { moderateMember } from "../actions";

interface MemberApp {
  id: string;
  name: string;
  email: string;
  foretag: string | null;
  region: string | null;
  specialitet: string | null;
  webbplats: string | null;
  motivering: string | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  let apps: MemberApp[] = [];
  let error: string | null = null;
  try {
    apps = await apiFetch<MemberApp[]>("/admin/members/pending");
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Medlemsansökningar</h1>
      <p className="mt-2 text-stone-600">
        Accepterade ansökningar måste manuellt läggas till i{" "}
        <code className="text-xs">MEMBERS</code>-arrayen i{" "}
        <code className="text-xs">/medlemmar/page.tsx</code> tills vi har en
        riktig medlemstabell.
      </p>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {!error && apps.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-stone-500">
          Inga väntande ansökningar just nu.
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {apps.map((a) => (
          <AppCard key={a.id} app={a} />
        ))}
      </ul>
    </section>
  );
}

function AppCard({ app }: { app: MemberApp }) {
  const submitted = new Date(app.created_at).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{app.name}</h2>
          <p className="text-sm text-stone-600">
            <a
              href={`mailto:${app.email}`}
              className="hover:text-amber-800"
            >
              {app.email}
            </a>
          </p>
        </div>
        <p className="shrink-0 text-xs text-stone-500">{submitted}</p>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {app.foretag && (
          <Detail label="Företag" value={app.foretag} />
        )}
        {app.region && <Detail label="Region" value={app.region} />}
        {app.specialitet && (
          <Detail label="Specialiteter" value={app.specialitet} />
        )}
        {app.webbplats && (
          <Detail
            label="Webbplats"
            value={
              <a
                href={app.webbplats}
                target="_blank"
                rel="noreferrer noopener"
                className="text-amber-800 hover:underline"
              >
                {app.webbplats} ↗
              </a>
            }
          />
        )}
      </dl>
      {app.motivering && (
        <div className="mt-4 rounded-md bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">
          {app.motivering}
        </div>
      )}
      <div className="mt-4 flex gap-2 border-t border-stone-200 pt-4">
        <form action={moderateMember.bind(null, app.id, "accept")}>
          <button
            type="submit"
            className="rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Acceptera
          </button>
        </form>
        <form action={moderateMember.bind(null, app.id, "reject")}>
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-widest text-stone-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-stone-800">{value}</dd>
    </div>
  );
}
