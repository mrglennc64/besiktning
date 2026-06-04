import { redirect } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { getSession } from "@/lib/session";

import { CaseWorkspace } from "./CaseWorkspace";

export const metadata = {
  title: "Valideringsmotor – Besiktning",
};

export const dynamic = "force-dynamic";

export default async function EnginePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero email={user.email} />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <CaseWorkspace />
      </section>
      <SiteFooter />
    </main>
  );
}

function Hero({ email }: { email: string }) {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
              Valideringsmotor
            </p>
            <h1 className="mt-1 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Ladda upp foton. Validera AI:ns förslag. Få ett utkast till utlåtande.
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            Inloggad som <span className="font-medium text-stone-700">{email}</span>
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-stone-600">
          AI matchar varje foto mot katalogen av cirka 300 kanoniska
          noteringar. Du bestämmer vilka förslag som ska in i utlåtandet.
          Texten är alltid från katalogen — aldrig AI-genererad svenska.
        </p>
      </div>
    </section>
  );
}
