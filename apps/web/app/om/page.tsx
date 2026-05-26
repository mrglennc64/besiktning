import Link from "next/link";

import { Avatar } from "@/app/components/Avatar";
import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";

export const metadata = {
  title: "Om Carina och plattformen – Besiktning",
  description:
    "Om Carina Widell Turpini, byggnadsingenjör SBR och grundare av SynaHus i Sverige AB och Besiktningskvinna i Sverige AB — och om varför den här plattformen finns.",
};

export default function OmPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <Bio />
      <Companies />
      <Mission />
      <Stance />
      <Contact />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
          Om oss
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Hej, jag är Carina.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Byggnadsingenjör SBR, besiktningsman sedan 2018, och en av få
          besiktningskvinnor i Sverige. Den här plattformen är något jag har
          velat bygga länge — låt mig berätta varför.
        </p>
      </div>
    </section>
  );
}

function Bio() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto grid max-w-5xl items-start gap-10 px-6 py-16 md:grid-cols-[auto_1fr]">
        <div className="w-48 md:w-56">
          <Avatar slug="carina-widell-turpini" alt="Carina Widell Turpini" size={320} />
          <dl className="mt-6 space-y-3 text-sm text-stone-700">
            <div>
              <dt className="text-xs uppercase tracking-widest text-stone-500">
                Titel
              </dt>
              <dd>Byggnadsingenjör SBR</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-stone-500">
                Certifieringar
              </dt>
              <dd>
                Entreprenad- och Överlåtelsebesiktning · Certifierad
                värderingsman · MSB-certifierad skyddsrumssakkunnig
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-stone-500">
                SBR-godkänd sedan
              </dt>
              <dd>2018</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-stone-500">
                Bas
              </dt>
              <dd>Stockholm &amp; Gamleby</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4 text-stone-700">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            Min väg in i branschen
          </h2>
          <p>
            Jag är byggnadsingenjör i grunden och har arbetat med besiktningar
            sedan 2018. På den tiden — och fortfarande idag — var det
            ovanligt att höra om kvinnor som drev egna besiktningsfirmor. Jag
            blev en av få. Det är ingen slogan, det är statistik.
          </p>
          <p>
            Vid sidan av överlåtelsebesiktningar arbetar jag som certifierad
            värderingsman och MSB-certifierad skyddsrumssakkunnig. Det är ett
            yrkesliv som rör sig mellan privata hem, byggprojekt och offentlig
            infrastruktur — och som har gett mig en bred bild av vad svenska
            byggnader faktiskt mår.
          </p>
          <p>
            Det jag tar med mig in i varje besiktning är samma sak: en
            okulär noggrannhet, en rak ton i utlåtandet, och en lika tydlig
            beskrivning av vad som <em>inte</em> har kunnat besiktigas som av
            det som har det.
          </p>
        </div>
      </div>
    </section>
  );
}

function Companies() {
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Mina företag</h2>
        <p className="mt-3 max-w-2xl text-stone-700">
          Jag driver två företag som kompletterar varandra. Det ena är den
          tekniska verksamheten, det andra är rörelsen.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-stone-200 bg-white p-6">
            <h3 className="text-lg font-semibold">SynaHus i Sverige AB</h3>
            <p className="mt-3 text-sm text-stone-700">
              Konsultverksamheten — överlåtelsebesiktningar, förbesiktningar,
              entreprenadbesiktningar, garantibesiktningar, statusbesiktningar,
              våtrums- och fasadbesiktningar samt underhållsplaner.
            </p>
            <p className="mt-3 text-xs text-stone-500">
              Org.nr 559113-1403 · Finnboda Kajväg 15, 131 72 Nacka
            </p>
            <a
              href="https://synahus.se"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-block text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              synahus.se ↗
            </a>
          </article>
          <article className="rounded-lg border border-stone-200 bg-white p-6">
            <h3 className="text-lg font-semibold">
              Besiktningskvinna i Sverige AB
            </h3>
            <p className="mt-3 text-sm text-stone-700">
              Det jag startade för att synliggöra de kvinnliga undantagen i en
              extremt mansdominerad bransch — och för att avdramatisera
              besiktningsprocessen för köpare och säljare som möter den för
              första gången.
            </p>
            <p className="mt-3 text-sm italic text-stone-600">
              &ldquo;Det finns kvinnliga undantag. De finns över hela landet, och
              de är duktiga. Vi behöver bara bli synliga för varandra och för
              våra kunder.&rdquo;
            </p>
            <a
              href="https://www.besiktningskvinna.se"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-block text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              besiktningskvinna.se ↗
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
          Varför den här plattformen finns
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Två saker som har frustrerat mig länge — och som plattformen vill
          rätta till.
        </h2>
        <div className="mt-8 space-y-6 text-stone-700">
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              1. Privatpersoner får inte ärlig information.
            </h3>
            <p className="mt-2">
              Förstagångsköpare möter ett system där mäklaren, försäkringsbolaget
              och säljaren alla har egna agendor. Besiktningsmannen kan vara
              den enda oberoende parten i hela affären — men bara om köparen
              vet vad besiktningen faktiskt täcker, hur man läser ett utlåtande,
              och vilka frågor man bör ställa. Den kunskapen finns inte
              samlad på ett enda lättillgängligt ställe. Inte hittills.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              2. Kvinnliga besiktningsmän jobbar i isolering.
            </h3>
            <p className="mt-2">
              Vi finns. Vi är duktiga. Men vi är få, och vi möts sällan. Vi
              saknar ett gemensamt rum för att diskutera svåra fall, dela
              erfarenhet och stötta nya kollegor in i yrket. Det här ska bli
              det rummet — först bara en katalog och ett enkelt forum, sedan
              vad gemenskapen själv vill att det ska bli.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">
              Plus en tredje sak: verktygen.
            </h3>
            <p className="mt-2">
              När jag skriver ett utlåtande på 13 sidor använder jag samma
              vedertagna noteringar och riskanalyser om och om igen. Det
              borde inte kräva manuellt arbete varje gång. Därför bygger vi
              en valideringsmotor som matchar foton från besiktningen mot en
              katalog av cirka 300 kanoniska noteringar — så att jag och
              andra kan skriva snabbare och mer konsekvent, utan att tappa
              kontrollen över texten.
            </p>
            <p className="mt-3 text-sm text-stone-600">
              Prismodell: 250 kr per genererad rapport. Inga abonnemang —
              du betalar när du faktiskt använder tjänsten. Ett Pro-medlemskap
              med extra funktioner (prioriterad bearbetning, rapporthistorik,
              mallar) kommer längre fram.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stance() {
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Vår hållning
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Kunskap före titlar.
        </h2>
        <div className="mt-6 space-y-4 text-stone-700">
          <p>
            Jag är själv SBR-godkänd och tycker att SBR driver bra
            utbildningar. Det här är inte ett anti-SBR-projekt. Men det är
            viktigt att veta vad SBR <em>är</em> och vad det <em>inte</em>{" "}
            är: en branschorganisation som certifierar enligt sin egen
            kursplan — inte en tillsynsmyndighet och inget lagkrav.
          </p>
          <p>
            Svensk lag kräver inte SBR-medlemskap för att utföra en
            överlåtelsebesiktning. Försäkringsbolagen gör det inte heller.
            Vad som krävs är yrkeskunskap, en gedigen ansvarsförsäkring och
            ett fackmässigt utlåtande. Den distinktionen är viktig — särskilt
            för kvinnor och praktiker som möter onödiga hinder i de
            akademiska behörighetsvägarna och som ändå har den hantverkliga
            kompetensen som krävs.
          </p>
          <p>
            Vi tror att branschen blir starkare när erfarenhet och hantverk
            värderas lika högt som certifikat. När fler kvinnliga
            besiktningsmän får utrymme att verka och synas. Och när
            privatpersoner får oberoende information som inte är formulerad
            av någon som har en agenda i affären.
          </p>
          <p className="text-base font-medium text-stone-900">
            Det är så vi avdramatiserar det hela.
          </p>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Kontakta oss</h2>
        <p className="mt-3 text-stone-700">
          Frågor om plattformen, samarbeten, mediekontakt — eller boka en
          besiktning direkt.
        </p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-stone-500">
              E-post
            </dt>
            <dd className="mt-1 text-base">
              <a
                href="mailto:carina@synahus.se"
                className="font-medium text-stone-900 hover:text-amber-800"
              >
                carina@synahus.se
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-stone-500">
              Telefon
            </dt>
            <dd className="mt-1 text-base">
              <a
                href="tel:+46704412440"
                className="font-medium text-stone-900 hover:text-amber-800"
              >
                070-441 24 40
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-stone-500">
              SynaHus i Sverige AB
            </dt>
            <dd className="mt-1 text-sm text-stone-700">
              Finnboda Kajväg 15<br />
              131 72 Nacka<br />
              Org.nr 559113-1403<br />
              Bg: 5207-3814
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-stone-500">
              Webbplatser
            </dt>
            <dd className="mt-1 space-y-1 text-sm">
              <a
                href="https://synahus.se"
                target="_blank"
                rel="noreferrer noopener"
                className="block text-stone-700 hover:text-amber-800"
              >
                synahus.se ↗
              </a>
              <a
                href="https://www.besiktningskvinna.se"
                target="_blank"
                rel="noreferrer noopener"
                className="block text-stone-700 hover:text-amber-800"
              >
                besiktningskvinna.se ↗
              </a>
            </dd>
          </div>
        </dl>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/guide"
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Läs guiden →
          </Link>
          <Link
            href="/medlemmar"
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Bli medlem →
          </Link>
        </div>
      </div>
    </section>
  );
}
