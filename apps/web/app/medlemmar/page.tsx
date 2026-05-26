import { Avatar } from "@/app/components/Avatar";
import { SiteFooter, SiteHeader } from "@/app/components/SiteShell";
import { ApplyForm } from "./ApplyForm";

export const metadata = {
  title: "Medlemmar – Besiktning",
  description:
    "Yrkesgemenskap för besiktningsmän och besiktningskvinnor som vill jobba självständigt. Synlig profil, kollegialt nätverk, manuell granskning.",
};

interface Member {
  slug: string;
  name: string;
  title: string;
  foretag: string;
  region: string[];
  specialitet: string[];
  bio: string;
  contact: {
    epost: string;
    telefon: string;
    webbplatser: { label: string; url: string }[];
  };
}

const MEMBERS: Member[] = [
  {
    slug: "carina-widell-turpini",
    name: "Carina Widell Turpini",
    title: "Byggnadsingenjör SBR · Grundare",
    foretag: "SynaHus i Sverige AB · Besiktningskvinna i Sverige AB",
    region: ["Stockholm", "Gamleby", "Hela Sverige"],
    specialitet: [
      "Överlåtelsebesiktning",
      "Förbesiktning",
      "Entreprenadbesiktning",
      "Värdering",
      "Skyddsrumssakkunnig",
    ],
    bio: "Byggnadsingenjör SBR med Entreprenad- och Överlåtelsebesiktning, certifierad värderingsman och MSB-certifierad skyddsrumssakkunnig. SBR-godkänd besiktningsman sedan 2018. Grundare av plattformen.",
    contact: {
      epost: "carina@synahus.se",
      telefon: "070-441 24 40",
      webbplatser: [
        { label: "synahus.se", url: "https://synahus.se" },
        { label: "besiktningskvinna.se", url: "https://www.besiktningskvinna.se" },
      ],
    },
  },
];

export default function MedlemmarPage() {
  return (
    <main className="flex-1">
      <SiteHeader />
      <Hero />
      <Directory />
      <Benefits />
      <ApplySection />
      <FAQ />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-amber-700">
          Medlemmar
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Sveriges besiktningskvinnor — och de män som står med oss.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          En öppen yrkesgemenskap för besiktningsmän som vill jobba
          självständigt och professionellt. Gratis medlemskap, en synlig
          profil för dina kunder, och ett växande kollegialt nätverk.
        </p>
      </div>
    </section>
  );
}

function Directory() {
  return (
    <section className="border-b border-stone-200">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Katalogen</h2>
          <p className="text-sm text-stone-500">
            {MEMBERS.length} {MEMBERS.length === 1 ? "medlem" : "medlemmar"}
          </p>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {MEMBERS.map((m) => (
            <MemberCard key={m.slug} member={m} />
          ))}
          <PlaceholderCard />
        </ul>
      </div>
    </section>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <li className="flex flex-col rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden">
          <Avatar slug={member.slug} alt={member.name} size={160} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{member.name}</h3>
          <p className="mt-0.5 text-sm text-stone-600">{member.title}</p>
          <p className="mt-1 text-xs text-stone-500">{member.foretag}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone-700">{member.bio}</p>
      <dl className="mt-4 space-y-2 text-xs">
        <div>
          <dt className="font-medium uppercase tracking-widest text-stone-500">
            Region
          </dt>
          <dd className="mt-1 text-stone-700">{member.region.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-widest text-stone-500">
            Specialiteter
          </dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {member.specialitet.map((s) => (
              <span
                key={s}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700"
              >
                {s}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-200 pt-4 text-sm">
        <a
          href={`mailto:${member.contact.epost}`}
          className="font-medium text-stone-900 hover:text-amber-800"
        >
          {member.contact.epost}
        </a>
        <a
          href={`tel:${member.contact.telefon.replace(/\s/g, "")}`}
          className="text-stone-700 hover:text-amber-800"
        >
          {member.contact.telefon}
        </a>
        {member.contact.webbplatser.map((w) => (
          <a
            key={w.url}
            href={w.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-stone-600 hover:text-amber-800"
          >
            {w.label} ↗
          </a>
        ))}
      </div>
    </li>
  );
}

function PlaceholderCard() {
  return (
    <li className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <p className="text-base font-medium text-stone-700">
        Här kunde din profil stå.
      </p>
      <p className="mt-2 max-w-xs text-sm text-stone-500">
        Vi växer en kollega i taget. Gratis medlemskap, manuell granskning av
        varje ansökan.
      </p>
      <a
        href="#ansok"
        className="mt-5 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
      >
        Ansök om medlemskap →
      </a>
    </li>
  );
}

function Benefits() {
  const items = [
    {
      title: "Synlig profil",
      body:
        "En sida i katalogen ovan med ditt företag, dina specialiteter och kontaktuppgifter. Privatpersoner som läser guiden hittar dig härifrån.",
    },
    {
      title: "Kollegialt nätverk",
      body:
        "Diskutera svåra fall med andra besiktningsmän. Q&A-forum kommer i nästa version — börjar i mindre skala när vi blir några stycken.",
    },
    {
      title: "Valideringsmotorn",
      body:
        "250 kr per genererad rapport — inga abonnemang. AI matchar dina besiktningsfoton mot en katalog av cirka 300 vedertagna noteringar; du validerar och rapporten levereras. Frivilligt — inte ett krav för medlemskap.",
    },
    {
      title: "Inflytande på plattformen",
      body:
        "Medlemmar är med och formar vilka funktioner som byggs härnäst. Inga fastlåsta abonnemang, ingen branschpolitisk styrning.",
    },
  ];
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Vad ingår i medlemskapet
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            <article
              key={it.title}
              className="rounded-lg border border-stone-200 bg-white p-5"
            >
              <h3 className="font-medium">{it.title}</h3>
              <p className="mt-2 text-sm text-stone-700">{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplySection() {
  return (
    <section id="ansok" className="scroll-mt-24 border-b border-stone-200">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700">
          Ansök om medlemskap
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Bli medlem — gratis.
        </h2>
        <p className="mt-3 text-stone-700">
          Vi granskar varje ansökan manuellt så att katalogen håller hög
          kvalitet. Svar inom en vecka.
        </p>
        <ApplyForm />
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Vad kostar medlemskapet?",
      a: "Ingenting. Profilen i katalogen och tillgång till gemenskapen är gratis. Valideringsmotorn är en separat tjänst som debiteras per genererad rapport (250 kr/st) — du betalar bara när du faktiskt använder den. Ett Pro-medlemskap för kollegor som genererar många rapporter kommer längre fram.",
    },
    {
      q: "Måste jag vara SBR-godkänd?",
      a: "Nej. Vi värderar erfarenhet och hantverk lika högt som certifikat. Du behöver ha relevant yrkeskunskap och en ansvarsförsäkring — det räcker.",
    },
    {
      q: "Måste jag vara kvinna för att bli medlem?",
      a: "Nej. Plattformen är öppen för alla seriösa besiktningsmän. Vi prioriterar däremot synlighet för kvinnliga kollegor eftersom branschen är extremt mansdominerad och vi vill avdramatisera den.",
    },
    {
      q: "Kan privatpersoner bli medlemmar?",
      a: "Inte i den här katalogen — den är för yrkesverksamma. Som privatperson hittar du allt du behöver i guiden, och du kan boka köpargenomgång hos en av medlemmarna.",
    },
    {
      q: "Vad händer med min ansökan?",
      a: "Carina läser varje ansökan personligen, kollar att uppgifterna stämmer och återkommer per e-post inom en vecka. Vid godkännande får du en länk för att fylla i din profil.",
    },
  ];
  return (
    <section className="border-b border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Vanliga frågor</h2>
        <dl className="mt-8 space-y-6">
          {items.map((it) => (
            <div key={it.q} className="rounded-lg border border-stone-200 bg-white p-5">
              <dt className="font-medium text-stone-900">{it.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-stone-700">{it.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
