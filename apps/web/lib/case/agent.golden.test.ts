import { describe, it, expect } from "vitest";
import catalog from "../noteringar.catalog.json";
import { emptyCase } from "./template";
import { runCaseChat, type ToolChatFn } from "./agent";
import type { CatalogLookup } from "./edits";

const entries = (catalog as { entries: { id: string; title: string; body: string }[] }).entries;
const byId = new Map(entries.map((e) => [e.id, e]));

// Replace these with real ids printed in Step 1:
const RID_FRITIDSHUS = "bildbank__for_fritidshus_galler_inte_samma_byggnor__018";
const RID_PLINT = "grundlaggning__plintgrund__031";

const lookup: CatalogLookup = {
  has: (id) => byId.has(id),
  title: (id) => byId.get(id)?.title ?? id,
  search: (q) => entries.filter((e) => (e.title ?? "").toLowerCase().includes(q.toLowerCase())).slice(0, 8).map((e) => ({ id: e.id, title: e.title })),
};

// Scripted model: one tool call per user message, then a closing text.
function scripted(calls: { name: string; args: Record<string, unknown> }[]): ToolChatFn {
  let i = 0;
  return async (_s, contents) => {
    const hasResponse = JSON.stringify(contents).at(-1) !== undefined && JSON.stringify(contents).includes("functionResponse");
    if (hasResponse || i >= calls.length) return { functionCalls: [], text: "Klart." };
    return { functionCalls: [calls[i++]], text: "" };
  };
}

describe("Ornö 1100 golden path", () => {
  it("places verbatim catalog ids and sets facts", async () => {
    let doc = emptyCase();

    const r1 = await runCaseChat({ doc, message: "byggår 1971", history: [], catalog: lookup, chat: scripted([{ name: "set_fact", args: { path: "fastighetsuppgifter.byggnadsar", value: "1971" } }]) });
    doc = r1.doc;
    const r2 = await runCaseChat({ doc, message: "tillbyggt 2013", history: [], catalog: lookup, chat: scripted([{ name: "set_fact", args: { path: "fastighetsuppgifter.vaningar", value: "1, tillbyggt 2013" } }]) });
    doc = r2.doc;
    const r3 = await runCaseChat({ doc, message: "lägg till fritidshus-risken", history: [], catalog: lookup, chat: scripted([{ name: "add_risk", args: { notering_id: RID_FRITIDSHUS } }]) });
    doc = r3.doc;
    const r4 = await runCaseChat({ doc, message: "plintgrund ej åtkomlig", history: [], catalog: lookup, chat: scripted([{ name: "add_finding", args: { section: "grundlaggning", notering_id: RID_PLINT } }]) });
    doc = r4.doc;

    expect(doc.fastighetsuppgifter.byggnadsar).toBe("1971");
    expect(doc.riskanalys.map((r) => r.findings[0].notering_id)).toContain(RID_FRITIDSHUS);
    expect(doc.okular_besiktning.grundlaggning.findings.map((f) => f.notering_id)).toContain(RID_PLINT);

    // No shortening: the stored id resolves to the FULL catalog body, unmodified.
    const stored = byId.get(RID_PLINT)!;
    expect(stored.body.length).toBeGreaterThan(0);
    expect(JSON.stringify(doc.okular_besiktning.grundlaggning.findings[0])).not.toContain(stored.body);
  });
});
