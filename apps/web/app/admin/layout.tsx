import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  if (!user.is_admin) {
    return (
      <main className="flex-1">
        <SiteHeader />
        <section className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Endast administratörer.
          </h1>
          <p className="mt-3 text-stone-700">
            Du är inloggad som <strong>{user.email}</strong>, men kontot har
            inte administratörsbehörighet.
          </p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="border-b border-stone-200 bg-stone-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3 text-sm">
          <nav className="flex flex-wrap gap-4">
            <Link href="/admin" className="font-medium text-stone-800 hover:text-amber-800">
              Översikt
            </Link>
            <Link href="/admin/news" className="text-stone-700 hover:text-amber-800">
              Nyhetstips
            </Link>
            <Link href="/admin/medlemmar" className="text-stone-700 hover:text-amber-800">
              Medlemsansökningar
            </Link>
          </nav>
          <span className="text-xs text-stone-500">
            Inloggad som <strong className="text-stone-700">{user.email}</strong>
          </span>
        </div>
      </div>
      {children}
      <SiteFooter />
    </main>
  );
}
