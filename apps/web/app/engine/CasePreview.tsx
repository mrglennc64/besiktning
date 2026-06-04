"use client";

import type { CaseDoc, Finding, Section4 } from "@/lib/case/types";

type Entry = { title: string; body: string };

export function CasePreview({ doc, entries }: { doc: CaseDoc; entries: Map<string, Entry> }) {
  return (
    <div className="space-y-6 text-sm text-stone-800">
      <Block n="1" title="Parter och uppdrag">
        <Facts obj={doc.parter_och_uppdrag} />
      </Block>
      <Block n="3" title="Fastighetsuppgifter">
        <Facts obj={doc.fastighetsuppgifter} />
      </Block>
      <Block n="4" title="Okulär besiktning">
        {okularEntries(doc).map(([key, sec]) => (
          <SectionView key={key} label={label(key)} sec={sec} entries={entries} />
        ))}
      </Block>
      <Block n="5" title="Riskanalys">
        {doc.riskanalys.length === 0 && <Empty />}
        {doc.riskanalys.map((r, i) => (
          <div key={i} className="mt-2">
            <p className="font-semibold">{r.rubrik}</p>
            {r.findings.map((f, j) => <FindingView key={j} f={f} entries={entries} />)}
          </div>
        ))}
      </Block>
      <Block n="6" title="Fortsatt teknisk utredning">
        <p>{doc.fortsatt_teknisk_utredning.motiverat ? (doc.fortsatt_teknisk_utredning.beskrivning || "Motiverat.") : "Inga förhållanden motiverar FTU."}</p>
      </Block>
      <Block n="7" title="Sammanfattning">
        <p className="whitespace-pre-wrap">{doc.sammanfattning.text || <Empty />}</p>
        {doc.sammanfattning.sarskilt_att_beakta.length > 0 && (
          <ul className="ml-5 list-disc">{doc.sammanfattning.sarskilt_att_beakta.map((b, i) => <li key={i}>{b}</li>)}</ul>
        )}
      </Block>
    </div>
  );
}

function okularEntries(doc: CaseDoc): [string, Section4][] {
  const o = doc.okular_besiktning;
  const fixed: [string, Section4][] = [
    ["mark_och_dranering", o.mark_och_dranering], ["grundlaggning", o.grundlaggning],
    ["stomme", o.stomme], ["fasad_fonster_dorrar", o.fasad_fonster_dorrar],
    ["yttertak", o.yttertak], ["vind", o.vind], ["installationer", o.installationer], ["vatrum", o.vatrum],
  ];
  const rooms: [string, Section4][] = Object.entries(o.invandiga_ytor).map(([k, v]) => [`invandiga_ytor.${k}`, v]);
  return [...fixed, ...rooms];
}

function label(key: string): string {
  const map: Record<string, string> = {
    mark_och_dranering: "Mark och dränering", grundlaggning: "Grundläggning", stomme: "Stomme",
    fasad_fonster_dorrar: "Fasad, fönster, dörrar", yttertak: "Yttertak", vind: "Vind",
    installationer: "Installationer", vatrum: "Våtrum",
  };
  if (key.startsWith("invandiga_ytor.")) return key.slice("invandiga_ytor.".length);
  return map[key] ?? key;
}

function SectionView({ label, sec, entries }: { label: string; sec: Section4; entries: Map<string, Entry> }) {
  if (sec.findings.length === 0 && !sec.ej_besiktigat) return null;
  return (
    <div className="mt-2">
      <p className="font-medium">{label}{sec.ej_besiktigat ? " (ej besiktigat)" : ""}</p>
      {sec.findings.map((f, i) => <FindingView key={i} f={f} entries={entries} />)}
    </div>
  );
}

function FindingView({ f, entries }: { f: Finding; entries: Map<string, Entry> }) {
  const e = entries.get(f.notering_id);
  return (
    <p className="ml-3 mt-1">
      {e?.body ?? <span className="italic text-red-700">[okänt id: {f.notering_id}]</span>}
      {f.qualifier ? ` — ${f.qualifier}` : ""}
    </p>
  );
}

function Facts({ obj }: { obj: Record<string, unknown> }) {
  const rows = Object.entries(obj).filter(([, v]) => typeof v === "string" && v);
  if (rows.length === 0) return <Empty />;
  return <dl className="grid grid-cols-[160px_1fr] gap-x-3">{rows.map(([k, v]) => (<div key={k} className="contents"><dt className="text-stone-500">{k}</dt><dd>{String(v)}</dd></div>))}</dl>;
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <section><h3 className="border-b border-stone-200 pb-1 font-semibold">{n}. {title}</h3><div className="mt-2">{children}</div></section>;
}

function Empty() { return <span className="italic text-stone-400">—</span>; }
