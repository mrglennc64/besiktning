import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";

export const metadata = {
  title: "Guide för köpare och säljare – Besiktning",
  description:
    "En oberoende guide till överlåtelsebesiktning enligt SBR-modellen. Vad ingår, vad ingår inte, när du ska beställa, vad det kostar, och hur du läser riskanalysen.",
};

const TOC = [
  { id: "vad-ar", label: "Vad är en överlåtelsebesiktning?" },
  { id: "vad-ingar", label: "Vad ingår — och vad ingår inte?" },
  { id: "nar", label: "När i processen ska den göras?" },
  { id: "kostnad", label: "Vad kostar det och vem betalar?" },
  { id: "riskanalys", label: "Förstå riskanalysen" },
  { id: "kopare", label: "För dig som är köpare" },
  { id: "saljare", label: "För dig som är säljare" },
  { id: "sbr", label: "SBR — vad det är och inte är" },
  { id: "hitta", label: "Hitta en besiktningsman" },
];

export default function GuidePage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <article className="mx-auto max-w-3xl px-6 py-12">
        <TableOfContents />
        <Section id="vad-ar" title="Vad är en överlåtelsebesiktning?">
          <p>
            En överlåtelsebesiktning är en byggnadsteknisk undersökning av en
            fastighet i samband med försäljning eller köp. Syftet är att ge
            parterna ett underlag att fatta beslut på — och att uppfylla delar
            av köparens lagstadgade undersökningsplikt enligt jordabalken.
          </p>
          <p>
            Den vanligaste varianten utförs enligt <strong>SBR-modellen</strong>,
            som består av fyra steg: genomgång av handlingar och upplysningar,
            en okulär undersökning på plats, en riskanalys där så är motiverat,
            och en rekommendation om fortsatt teknisk utredning vid behov.
          </p>
          <Callout>
            Besiktningen är ett <em>beslutsunderlag</em>, inte en garanti.
            Den gäller byggnadens skick på besiktningsdagen.
          </Callout>
        </Section>

        <Section id="vad-ingar" title="Vad ingår — och vad ingår inte?">
          <p>
            En överlåtelsebesiktning enligt SBR-modellen är en{" "}
            <strong>okulär undersökning</strong> av synliga ytor i tillgängliga
            utrymmen. Besiktningsmannen gör inga ingrepp i konstruktionen och
            demonterar inget material.
          </p>
          <h3>Vad som vanligtvis ingår</h3>
          <ul>
            <li>Visuell kontroll av mark, dränering, grund och sockel</li>
            <li>
              Stomme, fasad, fönster och dörrar — i den utsträckning de är
              åtkomliga
            </li>
            <li>Yttertak (oftast från marknivå) och vind där sådan finns</li>
            <li>Invändiga ytor rum för rum</li>
            <li>Våtrum — okulär kontroll och bedömning av utförande</li>
            <li>Installationer noteras okulärt</li>
          </ul>
          <h3>Vad som inte ingår (om inget annat avtalats)</h3>
          <ul>
            <li>
              Ingen fuktmätning, radonmätning eller annan instrumentell mätning
            </li>
            <li>
              Ingen kontroll av el, VVS, värmesystem, ventilation eller
              maskinell utrustning
            </li>
            <li>
              Inga funktionsprov av tätskikt, golvbrunnar eller avloppssystem
            </li>
            <li>Inga ingrepp i konstruktionen eller demontering av material</li>
          </ul>
          <p>
            Det här är viktigt: ett &quot;rent&quot; utlåtande betyder inte att huset
            är felfritt. Det betyder att besiktningsmannen inte hittade några
            anmärkningar inom det som ingår i uppdraget.
          </p>
        </Section>

        <Section id="nar" title="När i processen ska den göras?">
          <p>
            Det finns två vanliga lägen:
          </p>
          <h3>Säljarens förbesiktning (rekommenderas)</h3>
          <p>
            Säljaren beställer besiktningen innan huset läggs ut till
            försäljning. Utlåtandet visas för spekulanter — och en seriös
            köpare kan beställa en{" "}
            <strong>köpargenomgång</strong> där besiktningsmannen går igenom
            rapporten med köparen, så att nyttjanderätten överförs och köparen
            kan åberopa utlåtandet.
          </p>
          <h3>Köparens egen besiktning</h3>
          <p>
            Köparen beställer en egen besiktning efter visning men före
            kontraktsskrivande, ofta som villkor i köpekontraktet. Detta
            säkerställer att köparen har en oberoende part som arbetar för
            <em> deras</em> intresse.
          </p>
          <Callout>
            Tips: även om säljaren har beställt en förbesiktning är det
            klokt för dig som köpare att göra en köpargenomgång — utan den har
            du ingen rätt att åberopa utlåtandet gentemot besiktningsmannen.
          </Callout>
        </Section>

        <Section id="kostnad" title="Vad kostar det och vem betalar?">
          <p>
            Priserna varierar med fastighetens storlek, ålder, geografiskt
            läge och vilken besiktningstyp som beställs. Som riktvärde för en
            överlåtelsebesiktning på ett vanligt enfamiljshus:
          </p>
          <ul>
            <li>Mindre småhus / lägenhet: cirka 4&nbsp;000–7&nbsp;000 kr</li>
            <li>Medelstort hus: cirka 7&nbsp;000–12&nbsp;000 kr</li>
            <li>Större eller komplexa fastigheter: 12&nbsp;000 kr och uppåt</li>
            <li>
              Köpargenomgång (när säljaren redan har en besiktning): cirka
              2&nbsp;000–4&nbsp;000 kr
            </li>
          </ul>
          <p>
            I de allra flesta affärer betalar den som beställer — säljaren för
            förbesiktningen, köparen för sin egen besiktning eller
            köpargenomgång.
          </p>
        </Section>

        <Section id="riskanalys" title="Förstå riskanalysen — på vanlig svenska">
          <p>
            Riskanalysen är ofta den del av utlåtandet köpare oroar sig för.
            Här är några av de vanligaste begreppen, översatta från
            besiktningsspråk till vad de faktiskt betyder.
          </p>
          <RiskItem
            term="Krypgrund"
            meaning="Ett kryputrymme mellan marken och bjälklaget. Vanlig i hus från ungefär 1950–1980. Räknas som en riskkonstruktion eftersom fukt från marken kan ge mögel och röta i bjälklaget om utrymmet inte ventileras väl och saknar plastfolie."
            so_what="Vanligast åtgärd: regelbunden inspektion, eventuellt avfuktare eller övergång till varmgrund. Inte automatiskt en deal-breaker."
          />
          <RiskItem
            term="Parallelltak / ryggåstak"
            meaning="Tak där innertaket följer yttertaket — utan vindsutrymme. Vanligt i tillbyggnader och sjöstugor. Inte besiktningsbart utan ingrepp."
            so_what="Risk för dold kondensbildning om luftspalten inte fungerar. Vid renovering bör konstruktionen öppnas och kontrolleras."
          />
          <RiskItem
            term="Våtrum utan kvalitetsdokument"
            meaning="Badrummet är byggt utan formellt våtrumsintyg från BKR, GVK eller Säker Vatten. Det betyder inte att det är dåligt — bara att det inte går att verifiera mot branschens regler."
            so_what="Be om foton från byggtiden och kvitton på arbete. Försäkringsbolaget kan kräva intyg vid skada."
          />
          <RiskItem
            term="Frostskador i skorsten"
            meaning="Skorstenens murverk har spruckit eller flagnat av frost. Förekommer ofta i äldre skorstenar som inte sotats och torkat ordentligt."
            so_what="Bör åtgärdas — annars kan vatten leta sig in och förvärra skadan. Räkna med någon eller några tiotusentals kronor för en lagning."
          />
          <RiskItem
            term="Dränering äldre än 20 år"
            meaning="Den genomsnittliga tekniska livslängden för dränering är 20–30 år. Är den äldre kan funktionen vara nedsatt."
            so_what="Inget akut, men ta höjd för det i renoveringsplanen. Tecken på problem: fuktfläckar på källarväggens insida, kvarstående vatten kring grunden."
          />
          <RiskItem
            term="Platta på mark från 70-talet utan underliggande isolering"
            meaning="En vanlig konstruktion i hus byggda cirka 1970. Riskkonstruktion eftersom betongplattan saknar tillräcklig värmegradient och kan stå i jämvikt med markens fukt."
            so_what="Var observant på organiskt material i kontakt med plattan — syllar, träreglar, byggrester. Vid renovering: överväg fuktsäkra konstruktioner."
          />
          <Callout>
            En notering i riskanalysen är inte ett konstaterat fel. Det är en
            bedömning av risker som <em>kan</em> finnas — och som du bör väga
            in i ditt köpbeslut och dina förhandlingar.
          </Callout>
        </Section>

        <Section id="kopare" title="För dig som är köpare">
          <p>
            Din viktigaste uppgift är din <strong>undersökningsplikt</strong>{" "}
            enligt jordabalken. Besiktningen är ett verktyg som hjälper dig
            med den — men ersätter den inte.
          </p>
          <h3>Att fråga om vid visning eller efter besiktningen</h3>
          <ul>
            <li>
              När renoverades våtrummet senast, och finns kvalitetsdokument?
            </li>
            <li>
              Vilket år gjordes taket om, dräneringen, värmesystemet, elen?
            </li>
            <li>
              Finns det huspärm, byggritningar, energideklaration, sotarintyg?
            </li>
            <li>Har det förekommit fukt- eller vattenskador som ersatts?</li>
            <li>
              Vilka delar av huset kunde besiktningsmannen <em>inte</em>{" "}
              komma åt, och vad innebär det?
            </li>
          </ul>
          <Callout>
            Be alltid om en köpargenomgång om säljaren har en förbesiktning.
            Annars saknar du juridisk rätt att åberopa rapporten.
          </Callout>
        </Section>

        <Section id="saljare" title="För dig som är säljare">
          <p>
            En förbesiktning ger dig kontroll: du upptäcker eventuella brister
            innan en köpare gör det, och du visar att du är öppen och
            informerad. Det minskar förhandlingsutrymmet kring &quot;dolda fel&quot;
            och ger trygghet för båda parter.
          </p>
          <h3>Förbered det här innan besiktningsdagen</h3>
          <ul>
            <li>Samla huspärm, kvitton på utfört arbete, byggritningar</li>
            <li>
              Våtrumsintyg, sotarintyg, energideklaration, radonprotokoll om
              det finns
            </li>
            <li>
              Lista över när olika delar bytts eller renoverats — tak, fönster,
              värme, el, dränering
            </li>
            <li>
              Säkerställ åtkomst till krypgrund, vind, källare, pannrum, alla
              utrymmen som ska kunna besiktigas
            </li>
            <li>Sopa undan saker som blockerar väggar och inspektionsluckor</li>
          </ul>
        </Section>

        <Section id="sbr" title="SBR — vad det är och inte är">
          <p>
            SBR (Svenska Byggingenjörers Riksförbund) är en branschorganisation
            som driver utbildningar och certifieringar för byggingenjörer och
            besiktningsmän. Många duktiga besiktningsmän är SBR-godkända — det
            är ett legitimt och hederligt certifikat.
          </p>
          <p>
            Men <strong>SBR-medlemskap är inte ett lagkrav</strong>. Svensk lag
            kräver inte SBR för att utföra en överlåtelsebesiktning, och
            försäkringsbolagen kräver det inte heller. Vad som krävs är
            yrkeskunskap, gedigen ansvarsförsäkring och ett fackmässigt
            utlåtande.
          </p>
          <p>
            Vi tror att branschen blir starkare när erfarenhet och hantverk
            värderas lika högt som titlar — och när fler kvinnliga
            besiktningsmän får utrymme att verka och synas.
          </p>
        </Section>

        <Section id="hitta" title="Hitta en besiktningsman">
          <p>
            Leta efter någon som är oberoende — alltså inte anställd hos
            mäklaren, försäkringsbolaget eller säljaren — och som har en
            tydlig ansvarsförsäkring. Be om referenser, läs ett tidigare
            utlåtande, och fråga vilka delar av just ditt hus som kommer
            kunna besiktigas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/medlemmar"
              className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
            >
              Bläddra bland besiktningsmän →
            </Link>
            <a
              href="https://synahus.se"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Boka via SynaHus ↗
            </a>
          </div>
        </Section>

        <NextStepCard />
      </article>
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
          Guide för köpare och säljare
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Allt du behöver veta om överlåtelsebesiktning — utan branschjargong.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Skriven av erfarna besiktningsmän och besiktningskvinnor. Inga
          säljbrev, inga uppselljningar — bara det du behöver för att fatta
          ett tryggt beslut.
        </p>
      </div>
    </section>
  );
}

function TableOfContents() {
  return (
    <nav
      aria-label="Innehåll"
      className="mb-12 rounded-lg border border-stone-200 bg-white p-5"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-500">
        Innehåll
      </p>
      <ol className="space-y-1.5 text-sm">
        {TOC.map((it, i) => (
          <li key={it.id} className="flex gap-3">
            <span className="w-5 shrink-0 text-stone-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link
              href={`#${it.id}`}
              className="text-stone-800 hover:text-amber-800"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-stone-200 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="prose-besiktning mt-4 space-y-4 text-stone-700">
        {children}
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-5 rounded-lg border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm text-stone-800">
      {children}
    </aside>
  );
}

function RiskItem({
  term,
  meaning,
  so_what,
}: {
  term: string;
  meaning: string;
  so_what: string;
}) {
  return (
    <div className="my-5 rounded-lg border border-stone-200 bg-white p-4">
      <p className="font-semibold text-stone-900">{term}</p>
      <p className="mt-2 text-sm text-stone-700">{meaning}</p>
      <p className="mt-2 text-sm text-stone-600">
        <span className="font-medium text-amber-800">Vad det betyder för dig: </span>
        {so_what}
      </p>
    </div>
  );
}

function NextStepCard() {
  return (
    <section className="mt-12 rounded-xl bg-stone-900 px-6 py-8 text-stone-100">
      <h2 className="text-xl font-semibold text-white">Behöver du hjälp att tolka ett utlåtande?</h2>
      <p className="mt-2 max-w-xl text-sm text-stone-300">
        Ladda upp ditt utlåtande så går vi igenom det med dig — punkt för
        punkt, och översätter eventuella riskanalyser till vad de faktiskt
        innebär för dig.
      </p>
      <div className="mt-5">
        <Link
          href="/medlemmar"
          className="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-stone-200"
        >
          Boka en köpargenomgång →
        </Link>
      </div>
    </section>
  );
}
