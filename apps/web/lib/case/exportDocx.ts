// Builds a Word (.docx) utlåtande from a case document.
//
// Match-never-write holds here too: finding bodies are resolved verbatim from
// the catalog entries map by notering_id — this module never authors or
// shortens the canonical Swedish text. Only the besiktningsman's own free-text
// (facts, qualifiers, summary) is rendered as-is.

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { CaseDoc, Finding, Section4 } from "./types";

export interface CatalogEntryText {
  title: string;
  body: string;
}
export type EntryMap = Map<string, CatalogEntryText>;

const FACT_LABELS_1: Record<string, string> = {
  fastighet_namn: "Fastighet",
  adress: "Adress",
  uppdragsgivare: "Uppdragsgivare",
  distribution: "Distribution",
  narvarande: "Närvarande",
  besiktningsforetag: "Besiktningsföretag",
  besiktningsman: "Besiktningsman",
  besiktningsdag: "Besiktningsdag",
  vaderlek: "Väderlek",
  uppdrag_beskrivning: "Uppdrag",
  forutsattningar: "Förutsättningar",
};

const FACT_LABELS_3: Record<string, string> = {
  byggnadsar: "Byggnadsår",
  vaningar: "Våningar",
  stomme: "Stomme",
  bjalklag: "Bjälklag",
  grund: "Grund",
  fasad: "Fasad",
  yttertak: "Yttertak",
  varme: "Värme",
  ventilation: "Ventilation",
  va: "VA",
};

const SECTION_4_LABELS: Record<string, string> = {
  mark_och_dranering: "Mark och dränering",
  grundlaggning: "Grundläggning",
  stomme: "Stomme",
  fasad_fonster_dorrar: "Fasad, fönster och dörrar",
  yttertak: "Yttertak",
  vind: "Vind",
  installationer: "Installationer",
  vatrum: "Våtrum",
};

const SKICK_LABELS: Record<string, string> = {
  under_normalt: "Under normalt skick för ålder och konstruktion",
  normalt: "Normalt skick med hänsyn till ålder och konstruktion",
  over_normalt: "Över normalt skick",
};

function heading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 80 } });
}

function subheading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 120, after: 40 } });
}

function kv(label: string, value: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)] });
}

function body(text: string): Paragraph {
  return new Paragraph({ text, spacing: { after: 80 } });
}

function findingParagraphs(findings: Finding[], entries: EntryMap): Paragraph[] {
  const out: Paragraph[] = [];
  for (const f of findings) {
    const entry = entries.get(f.notering_id);
    const text = entry?.body ?? `[okänt notering_id: ${f.notering_id}]`;
    const withQualifier = f.qualifier ? `${text} — ${f.qualifier}` : text;
    out.push(new Paragraph({ text: withQualifier, bullet: { level: 0 } }));
  }
  return out;
}

function factBlock(obj: Record<string, unknown>, labels: Record<string, string>): Paragraph[] {
  const out: Paragraph[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) out.push(kv(label, v));
  }
  return out;
}

/** Build the in-memory Word document for a case. */
export function buildUtlatande(doc: CaseDoc, entries: EntryMap): Document {
  const c: Paragraph[] = [];

  // Title
  const title = doc.parter_och_uppdrag.fastighet_namn || "Överlåtelsebesiktning";
  c.push(new Paragraph({ text: "Överlåtelsebesiktning – utlåtande", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
  c.push(new Paragraph({ text: title, alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
  if (doc.parter_och_uppdrag.besiktningsdag) {
    c.push(new Paragraph({ text: `Besiktningsdag: ${doc.parter_och_uppdrag.besiktningsdag}`, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  }

  // 1. Parter och uppdrag
  c.push(heading("1. Parter och uppdrag"));
  c.push(...factBlock(doc.parter_och_uppdrag as Record<string, unknown>, FACT_LABELS_1));

  // 2. Handlingar och upplysningar
  const h = doc.handlingar_och_upplysningar;
  if (h.tillhandahallna_handlingar.length || h.muntliga_uppgifter.allmant.length) {
    c.push(heading("2. Handlingar och upplysningar"));
    if (h.tillhandahallna_handlingar.length) {
      c.push(subheading("2.1 Tillhandahållna handlingar"));
      for (const item of h.tillhandahallna_handlingar) c.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
    const m = h.muntliga_uppgifter;
    const muntliga = [...m.allmant, ...m.vatten_och_avlopp, ...m.el_och_installationer];
    if (muntliga.length) {
      c.push(subheading("2.2 Muntliga uppgifter"));
      for (const item of muntliga) c.push(new Paragraph({ text: item, bullet: { level: 0 } }));
    }
  }

  // 3. Fastighetsuppgifter
  c.push(heading("3. Fastighetsuppgifter"));
  const facts3 = factBlock(doc.fastighetsuppgifter as Record<string, unknown>, FACT_LABELS_3);
  c.push(...(facts3.length ? facts3 : [body("—")]));

  // 4. Okulär besiktning
  c.push(heading("4. Okulär besiktning"));
  const o = doc.okular_besiktning;
  const fixed: [string, Section4][] = [
    ["mark_och_dranering", o.mark_och_dranering], ["grundlaggning", o.grundlaggning],
    ["stomme", o.stomme], ["fasad_fonster_dorrar", o.fasad_fonster_dorrar],
    ["yttertak", o.yttertak], ["vind", o.vind], ["installationer", o.installationer], ["vatrum", o.vatrum],
  ];
  const rooms: [string, Section4][] = Object.entries(o.invandiga_ytor);
  for (const [key, sec] of [...fixed, ...rooms]) {
    if (sec.findings.length === 0 && !sec.besiktningsmannens_text && !sec.ej_besiktigat) continue;
    const label = SECTION_4_LABELS[key] ?? key.replace(/_/g, " ");
    c.push(subheading(label + (sec.ej_besiktigat ? " (ej besiktigat)" : "")));
    if (sec.besiktningsmannens_text) c.push(body(sec.besiktningsmannens_text));
    c.push(...findingParagraphs(sec.findings, entries));
  }

  // 5. Riskanalys
  c.push(heading("5. Riskanalys"));
  if (doc.riskanalys.length === 0) c.push(body("—"));
  for (const r of doc.riskanalys) {
    c.push(subheading(r.rubrik));
    c.push(...findingParagraphs(r.findings, entries));
  }

  // 6. Fortsatt teknisk utredning
  c.push(heading("6. Fortsatt teknisk utredning (FTU)"));
  c.push(body(doc.fortsatt_teknisk_utredning.motiverat
    ? (doc.fortsatt_teknisk_utredning.beskrivning || "FTU rekommenderas.")
    : "Inga förhållanden motiverar fortsatt teknisk utredning."));

  // 7. Sammanfattning
  c.push(heading("7. Sammanfattning"));
  if (doc.sammanfattning.text) c.push(body(doc.sammanfattning.text));
  if (doc.sammanfattning.sarskilt_att_beakta.length) {
    c.push(subheading("Särskilt bör beaktas"));
    for (const b of doc.sammanfattning.sarskilt_att_beakta) c.push(new Paragraph({ text: b, bullet: { level: 0 } }));
  }
  if (doc.sammanfattning.skick_bedomning) {
    c.push(kv("Skickbedömning", SKICK_LABELS[doc.sammanfattning.skick_bedomning] ?? doc.sammanfattning.skick_bedomning));
  }

  // 8. Bilagor
  c.push(heading("8. Bilagor"));
  for (const b of doc.bilagor) c.push(new Paragraph({ text: b, bullet: { level: 0 } }));

  // Ansvar / signatur
  c.push(heading("Ansvar och ansvarstid"));
  c.push(body(`Ansvarstiden för detta utlåtande är ${doc.ansvar.ansvarstid_ar} år från den dag utlåtandet överlämnades till uppdragsgivaren.`));
  if (doc.ansvar.signatur_ort || doc.ansvar.signatur_datum) {
    c.push(body(`${doc.ansvar.signatur_ort ?? ""} ${doc.ansvar.signatur_datum ?? ""}`.trim()));
  }
  c.push(body(doc.parter_och_uppdrag.besiktningsman ?? ""));

  return new Document({ sections: [{ children: c }] });
}

/** Render the case to a .docx byte buffer. */
export async function renderUtlatandeDocx(doc: CaseDoc, entries: EntryMap): Promise<Buffer> {
  return Packer.toBuffer(buildUtlatande(doc, entries));
}
