import type { ApplyResult, CaseDoc, Edit, Section4 } from "./types";
import { OKULAR_SECTIONS } from "./types";

export interface CatalogLookup {
  has(id: string): boolean;
  title(id: string): string;
  search(query: string): { id: string; title: string }[];
}

const FACT_PREFIXES = ["fastighetsuppgifter.", "parter_och_uppdrag.", "handlingar_och_upplysningar."];

function clone(doc: CaseDoc): CaseDoc {
  return JSON.parse(JSON.stringify(doc)) as CaseDoc;
}

function resolveSection(doc: CaseDoc, section: string): Section4 | null {
  if ((OKULAR_SECTIONS as readonly string[]).includes(section)) {
    // @ts-expect-error indexed by validated key
    return doc.okular_besiktning[section] as Section4;
  }
  if (section.startsWith("invandiga_ytor.")) {
    const room = section.slice("invandiga_ytor.".length);
    if (!room) return null;
    const bucket = doc.okular_besiktning.invandiga_ytor;
    if (!bucket[room]) bucket[room] = { besiktningsmannens_text: "", findings: [], ej_besiktigat: false };
    return bucket[room];
  }
  return null;
}

function setByPath(obj: Record<string, unknown>, path: string, value: string): boolean {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]];
    if (typeof next !== "object" || next === null) return false;
    cur = next as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return true;
}

export function applyEdit(doc: CaseDoc, edit: Edit, catalog: CatalogLookup): ApplyResult {
  const next = clone(doc);
  switch (edit.op) {
    case "set_fact": {
      if (!FACT_PREFIXES.some((p) => edit.path.startsWith(p))) {
        return { ok: false, error: `Path not allowed: ${edit.path}` };
      }
      if (!setByPath(next as unknown as Record<string, unknown>, edit.path, edit.value)) {
        return { ok: false, error: `Could not set ${edit.path}` };
      }
      return { ok: true, doc: next, summary: `Satte ${edit.path} = "${edit.value}"` };
    }
    case "add_finding": {
      if (!catalog.has(edit.notering_id)) {
        return { ok: false, error: `Okänt notering_id: ${edit.notering_id}`, suggestions: catalog.search(edit.notering_id).slice(0, 5) };
      }
      const sec = resolveSection(next, edit.section);
      if (!sec) return { ok: false, error: `Okänd sektion: ${edit.section}` };
      const finding: Record<string, unknown> = { notering_id: edit.notering_id };
      if (edit.qualifier) finding.qualifier = edit.qualifier;
      if (edit.photo_refs?.length) finding.photo_refs = edit.photo_refs;
      if (typeof edit.ai_match_confidence === "number") finding.ai_match_confidence = edit.ai_match_confidence;
      if (edit.validated_by_user) finding.validated_by_user = true;
      sec.findings.push(finding as unknown as Section4["findings"][number]);
      return { ok: true, doc: next, summary: `La till "${catalog.title(edit.notering_id)}" i ${edit.section}` };
    }
    case "add_risk": {
      if (!catalog.has(edit.notering_id)) {
        return { ok: false, error: `Okänt notering_id: ${edit.notering_id}`, suggestions: catalog.search(edit.notering_id).slice(0, 5) };
      }
      const rubrik = edit.rubrik ?? catalog.title(edit.notering_id);
      next.riskanalys.push({ rubrik, findings: [{ notering_id: edit.notering_id }] });
      return { ok: true, doc: next, summary: `La till risk "${rubrik}"` };
    }
    case "remove_item": {
      const sec = resolveSection(next, edit.section);
      if (!sec || edit.index < 0 || edit.index >= sec.findings.length) {
        return { ok: false, error: `Inget att ta bort på ${edit.section}[${edit.index}]` };
      }
      const [removed] = sec.findings.splice(edit.index, 1);
      return { ok: true, doc: next, summary: `Tog bort ${removed.notering_id} från ${edit.section}` };
    }
    case "set_summary": {
      if (typeof edit.text === "string") next.sammanfattning.text = edit.text;
      if (edit.bullets) next.sammanfattning.sarskilt_att_beakta = edit.bullets;
      return { ok: true, doc: next, summary: "Uppdaterade sammanfattningen" };
    }
    case "set_skick": {
      next.sammanfattning.skick_bedomning = edit.value;
      return { ok: true, doc: next, summary: `Satte skickbedömning: ${edit.value}` };
    }
    case "set_ftu": {
      next.fortsatt_teknisk_utredning = { motiverat: edit.motiverat, beskrivning: edit.beskrivning };
      return { ok: true, doc: next, summary: `Satte FTU (motiverat=${edit.motiverat})` };
    }
  }
}

export function applyEdits(doc: CaseDoc, edits: Edit[], catalog: CatalogLookup): { doc: CaseDoc; results: ApplyResult[] } {
  let cur = doc;
  const results: ApplyResult[] = [];
  for (const e of edits) {
    const r = applyEdit(cur, e, catalog);
    results.push(r);
    if (r.ok) cur = r.doc;
  }
  return { doc: cur, results };
}
