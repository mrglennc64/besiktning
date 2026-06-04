import type { Content, FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { CaseDoc, Edit } from "./types";
import { OKULAR_SECTIONS } from "./types";
import { applyEdit, type CatalogLookup } from "./edits";

export interface ToolChatResult { functionCalls: { name: string; args: Record<string, unknown> }[]; text: string }
export type ToolChatFn = (system: string, contents: Content[], tools: FunctionDeclaration[]) => Promise<ToolChatResult>;

export interface ChatTurn { role: "user" | "model"; text: string }

export interface RunCaseChatArgs {
  doc: CaseDoc;
  message: string;
  history: ChatTurn[];
  catalog: CatalogLookup;
  chat: ToolChatFn;
  /** Catalog grounding lines "id | category | title", injected into the system prompt. */
  grounding?: string;
  maxRounds?: number;
}

export interface RunCaseChatResult { doc: CaseDoc; edits: Edit[]; reply: string }

const SYSTEM = `Du hjälper en svensk besiktningsman att fylla i ett överlåtelsebesiktnings-utlåtande.
Du SKRIVER ALDRIG observationstext eller riskanalystext själv. Du väljer en kanonisk notering via dess notering_id (verktyget add_finding/add_risk) — katalogens text fylls i ordagrant av systemet.
Du FÅR fylla i fakta (byggnadsår m.m.), platsspecifika qualifier-kommentarer, samt sammanfattningen, utifrån användarens egna uppgifter.
Använd search_catalog när du är osäker på rätt notering_id. Anropa verktyg; svara med en kort bekräftelse på svenska när du är klar.`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: "set_fact",
    description: "Sätt ett faktavärde. path börjar med fastighetsuppgifter., parter_och_uppdrag. eller handlingar_och_upplysningar.",
    parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING }, value: { type: Type.STRING } }, required: ["path", "value"] },
  },
  {
    name: "add_finding",
    description: `Lägg en observation under en byggnadsdel. section är en av: ${OKULAR_SECTIONS.join(", ")}, eller "invandiga_ytor.<rum>". notering_id måste finnas i katalogen.`,
    parameters: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, notering_id: { type: Type.STRING }, qualifier: { type: Type.STRING } }, required: ["section", "notering_id"] },
  },
  {
    name: "add_risk",
    description: "Lägg en riskanalyspunkt (sektion 5). notering_id måste finnas i katalogen. rubrik valfri.",
    parameters: { type: Type.OBJECT, properties: { notering_id: { type: Type.STRING }, rubrik: { type: Type.STRING } }, required: ["notering_id"] },
  },
  {
    name: "remove_item",
    description: "Ta bort en observation på index i en sektion.",
    parameters: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, index: { type: Type.NUMBER } }, required: ["section", "index"] },
  },
  {
    name: "set_summary",
    description: "Sätt sammanfattningstext och/eller punkter (särskilt att beakta).",
    parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, bullets: { type: Type.ARRAY, items: { type: Type.STRING } } } },
  },
  {
    name: "set_skick",
    description: "Sätt skickbedömning.",
    parameters: { type: Type.OBJECT, properties: { value: { type: Type.STRING, enum: ["under_normalt", "normalt", "over_normalt"] } }, required: ["value"] },
  },
  {
    name: "set_ftu",
    description: "Sätt Fortsatt teknisk utredning.",
    parameters: { type: Type.OBJECT, properties: { motiverat: { type: Type.BOOLEAN }, beskrivning: { type: Type.STRING } }, required: ["motiverat"] },
  },
  {
    name: "search_catalog",
    description: "Sök efter rätt notering_id. Returnerar id|titel-träffar (ingen brödtext).",
    parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] },
  },
];

function toEdit(name: string, args: Record<string, unknown>): Edit | null {
  switch (name) {
    case "set_fact": return { op: "set_fact", path: String(args.path), value: String(args.value) };
    case "add_finding": return { op: "add_finding", section: String(args.section), notering_id: String(args.notering_id), qualifier: args.qualifier ? String(args.qualifier) : undefined };
    case "add_risk": return { op: "add_risk", notering_id: String(args.notering_id), rubrik: args.rubrik ? String(args.rubrik) : undefined };
    case "remove_item": return { op: "remove_item", section: String(args.section), index: Number(args.index) };
    case "set_summary": return { op: "set_summary", text: args.text != null ? String(args.text) : undefined, bullets: Array.isArray(args.bullets) ? args.bullets.map(String) : undefined };
    case "set_skick": return { op: "set_skick", value: String(args.value) as "under_normalt" | "normalt" | "over_normalt" };
    case "set_ftu": return { op: "set_ftu", motiverat: Boolean(args.motiverat), beskrivning: args.beskrivning ? String(args.beskrivning) : undefined };
    default: return null;
  }
}

export async function runCaseChat(a: RunCaseChatArgs): Promise<RunCaseChatResult> {
  const maxRounds = a.maxRounds ?? 6;
  const system = a.grounding ? `${SYSTEM}\n\nKATALOG (id | kategori | titel):\n${a.grounding}` : SYSTEM;
  const contents: Content[] = [
    ...a.history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: a.message }] },
  ];

  let doc = a.doc;
  const edits: Edit[] = [];
  let reply = "";

  for (let round = 0; round < maxRounds; round++) {
    const res = await a.chat(system, contents, TOOLS);
    if (res.functionCalls.length === 0) { reply = res.text; break; }

    contents.push({ role: "model", parts: res.functionCalls.map((c) => ({ functionCall: { name: c.name, args: c.args } })) });
    const responseParts: Content["parts"] = [];

    for (const call of res.functionCalls) {
      if (call.name === "search_catalog") {
        const hits = a.catalog.search(String(call.args.query ?? ""));
        responseParts.push({ functionResponse: { name: call.name, response: { hits: hits.slice(0, 8) } } });
        continue;
      }
      const edit = toEdit(call.name, call.args);
      if (!edit) { responseParts.push({ functionResponse: { name: call.name, response: { error: "okänt verktyg" } } }); continue; }
      const r = applyEdit(doc, edit, a.catalog);
      if (r.ok) { doc = r.doc; edits.push(edit); responseParts.push({ functionResponse: { name: call.name, response: { ok: true, summary: r.summary } } }); }
      else { responseParts.push({ functionResponse: { name: call.name, response: { ok: false, error: r.error, suggestions: r.suggestions ?? [] } } }); }
    }
    contents.push({ role: "user", parts: responseParts });
    if (round === maxRounds - 1) reply = "Klart.";
  }

  if (!reply) reply = "Klart.";
  return { doc, edits, reply };
}
