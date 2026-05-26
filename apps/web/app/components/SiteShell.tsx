import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          besiktning<span className="text-amber-700">.</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-stone-600 md:flex">
          <Link href="/guide" className="hover:text-stone-900">Guide</Link>
          <Link href="/medlemmar" className="hover:text-stone-900">Medlemmar</Link>
          <Link href="/nyheter" className="hover:text-stone-900">Nyheter &amp; podd</Link>
          <Link href="/om" className="hover:text-stone-900">Om oss</Link>
        </nav>
        <Link
          href="/login"
          className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
        >
          Logga in
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-base font-semibold text-white">
            besiktning<span className="text-amber-400">.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-stone-400">
            En oberoende plattform för dig som köper eller säljer hus, och för
            yrkesverksamma besiktningsmän som vill jobba professionellt och
            självständigt.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">För privatpersoner</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/guide" className="hover:text-white">Guide</Link></li>
            <li><Link href="/medlemmar" className="hover:text-white">Hitta besiktningsman</Link></li>
            <li><Link href="/nyheter" className="hover:text-white">Nyheter &amp; podd</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">För proffs</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/medlemmar" className="hover:text-white">Bli medlem</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Valideringsmotor</Link></li>
            <li><Link href="/om" className="hover:text-white">Om oss</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <p className="mx-auto max-w-5xl px-6 py-4 text-xs text-stone-500">
          © {new Date().getFullYear()} besiktning. Drivs av SynaHus i Sverige AB.
        </p>
      </div>
    </footer>
  );
}
