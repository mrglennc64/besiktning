import Link from "next/link";

import { Avatar } from "@/app/components/Avatar";
import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";

export const metadata = {
  title: "Besiktning – Förstå besiktningsprocessen",
  description:
    "Oberoende guide för dig som köper eller säljer hus, samt en yrkesgemenskap för besiktningsmän och besiktningskvinnor.",
};

export default function LandingPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <PrivatpersonSection />
      <ProffsSection />
      <WedgeSection />
      <PoddTeaser />
      <FounderCard />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
          För dig som köper eller säljer hus
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Förstå besiktningen innan mäklaren och försäkringsbolaget gör det åt dig.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">
          En oberoende guide skriven av erfarna besiktningsmän och
          besiktningskvinnor — på vanlig svenska, utan jargong.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/guide"
            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
          >
            Läs guiden →
          </Link>
          <Link
            href="/medlemmar"
            className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Hitta en besiktningsman
          </Link>
        </div>
      </div>
    </section>
  );
}

function PrivatpersonSection() {
  const items = [
    {
      title: "Vad är en överlåtelsebesiktning?",
      body:
        "Vad ingår, vad ingår inte, och vilka delar av köpets undersökningsplikt täcker den faktiskt.",
    },
    {
      title: "När i processen ska den göras?",
      body:
        "Innan tillträde, innan bud, eller efter — det spelar större roll än mäklaren ofta säger.",
    },
    {
      title: "Vad kostar det och vem betalar?",
      body:
        "Marknadspriser i ditt område, vem som vanligtvis beställer, och varför säljarens besiktning inte alltid räcker.",
    },
    {
      title: "Riskanalys på vanlig svenska",
      body:
        "Krypgrund, parallelltak, frostskador i skorsten — vad det betyder för dig som köpare och vad du kan be om.",
    },
  ];
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Från guiden — det viktigaste först
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Inga säljbrev, inga uppselljningar. Bara det du behöver veta för att
          fatta ett tryggt beslut.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <article
              key={it.title}
              className="rounded-lg border border-stone-200 bg-white p-5"
            >
              <h3 className="font-medium">{it.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{it.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/guide"
            className="text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            Hela guiden →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProffsSection() {
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-stone-500">
          För dig som är besiktningsman
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          En öppnare bransch — och bättre verktyg.
        </h2>
        <p className="mt-3 max-w-2xl text-stone-700">
          En yrkesgemenskap för besiktningsmän och besiktningskvinnor som vill
          jobba självständigt och professionellt. Vi synliggör de kvinnliga
          undantagen i en mansdominerad bransch, delar erfarenhet, och bygger
          verktyg som gör arbetet snabbare och mer konsekvent.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h3 className="font-medium">Medlemsprofil</h3>
            <p className="mt-2 text-sm text-stone-600">
              Synlig sida med ditt företag, dina specialiteter och kontaktuppgifter. Privatpersoner hittar dig via guiden.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h3 className="font-medium">Q&amp;A och nätverk</h3>
            <p className="mt-2 text-sm text-stone-600">
              Fråga kollegor om svåra fall, dela erfarenheter, och håll dig uppdaterad i ett öppet och kollegialt forum.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h3 className="font-medium">
              Valideringsmotor{" "}
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                250 kr/rapport
              </span>
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Ladda upp foton från besiktningen — AI matchar mot en bibliotek av cirka 300 vedertagna noteringar och riskanalyser. Du validerar, vi skriver utlåtandet. Inga abonnemang, du betalar per genererad rapport.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/medlemmar"
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Bli medlem — gratis
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Prova valideringsmotorn →
          </Link>
        </div>
      </div>
    </section>
  );
}

function WedgeSection() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
          Vår hållning
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Kunskap före titlar.
        </h2>
        <p className="mt-4 text-stone-700">
          Många tror att en överlåtelsebesiktning kräver SBR-medlemskap. Det
          gör den inte. SBR är en branschorganisation som driver bra
          utbildningar — men den är inte en tillsynsmyndighet, och svensk lag
          ställer inget sådant krav. Vad som krävs är yrkeskunskap, gedigen
          ansvarsförsäkring och ett fackmässigt utlåtande.
        </p>
        <p className="mt-4 text-stone-700">
          Vi tror att branschen blir starkare när erfarenhet och hantverk
          värderas lika högt som certifikat — och när fler kvinnliga
          besiktningsmän får utrymme att verka och synas. Det är så vi
          avdramatiserar det hela.
        </p>
        <div className="mt-6">
          <Link
            href="/om"
            className="text-sm font-medium text-amber-800 hover:text-amber-900"
          >
            Läs mer om vår hållning →
          </Link>
        </div>
      </div>
    </section>
  );
}

function PoddTeaser() {
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Nyheter & podden
        </h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Två besiktningskvinnor pratar om verkliga fall, branschnyheter och
          vad SBR egentligen säger — och inte säger.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-stone-500">
              Senaste avsnittet
            </p>
            <h3 className="mt-2 text-lg font-medium">
              Krypgrund — när är risken verkligen risk?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              En djupdykning i den vanligaste riskkonstruktionen i svenska hus,
              och vad som faktiskt är värt att utreda.
            </p>
            <Link
              href="/nyheter"
              className="mt-3 inline-block text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              Lyssna →
            </Link>
          </article>
          <article className="rounded-lg border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-stone-500">
              Från bloggen
            </p>
            <h3 className="mt-2 text-lg font-medium">
              Vad ett våtrumsintyg faktiskt bevisar — och inte
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Avsaknad av våtrumsintyg är inte samma sak som ett dåligt
              våtrum. Här är vad köpare och säljare bör fråga om i stället.
            </p>
            <Link
              href="/nyheter"
              className="mt-3 inline-block text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              Läs →
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}

function FounderCard() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto grid max-w-5xl items-start gap-10 px-6 py-16 md:grid-cols-[auto_1fr]">
        <div className="w-48 md:w-56">
          <Avatar slug="carina-widell-turpini" alt="Carina Widell Turpini" size={320} />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Grundare
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Carina Widell Turpini
          </h2>
          <p className="mt-3 text-stone-700">
            Byggnadsingenjör SBR, Entreprenad- och Överlåtelsebesiktning.
            Certifierad värderingsman och MSB-certifierad skyddsrumssakkunnig.
            SBR-godkänd besiktningsman sedan 2018. Driver SynaHus i Sverige AB
            och Besiktningskvinna i Sverige AB med bas i Stockholm och
            Gamleby.
          </p>
          <p className="mt-3 text-stone-700">
            Carina startade Besiktningskvinna i Sverige AB för att synliggöra
            de kvinnliga undantagen i en extremt mansdominerad bransch — och
            för att avdramatisera besiktningen för köpare och säljare. Den här
            plattformen är nästa steg: en oberoende guide, en yrkesgemenskap,
            och verktyg som hjälper fler att jobba professionellt och
            självständigt.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link
              href="/om"
              className="font-medium text-amber-800 hover:text-amber-900"
            >
              Läs mer om Carina →
            </Link>
            <a
              href="https://www.besiktningskvinna.se"
              target="_blank"
              rel="noreferrer noopener"
              className="text-stone-600 hover:text-stone-900"
            >
              besiktningskvinna.se ↗
            </a>
            <a
              href="https://synahus.se"
              target="_blank"
              rel="noreferrer noopener"
              className="text-stone-600 hover:text-stone-900"
            >
              synahus.se ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

