import { describe, it, expect } from "vitest";
import { emptyCase } from "./template";
import { buildUtlatande, renderUtlatandeDocx, type EntryMap } from "./exportDocx";

const entries: EntryMap = new Map([
  ["grund__plint_001", { title: "Plintgrund ej åtkomlig", body: "Grunden var inte åtkomlig för besiktning." }],
]);

describe("exportDocx", () => {
  it("builds a Document without throwing for a populated case", () => {
    const c = emptyCase();
    c.parter_och_uppdrag.fastighet_namn = "Ornö 1100";
    c.fastighetsuppgifter.byggnadsar = "1971";
    c.okular_besiktning.grundlaggning.findings.push({ notering_id: "grund__plint_001", qualifier: "bakre kortsida" });
    c.riskanalys.push({ rubrik: "Risk – Plintgrund", findings: [{ notering_id: "grund__plint_001" }] });
    const doc = buildUtlatande(c, entries);
    expect(doc).toBeTruthy();
  });

  it("renders a non-empty .docx buffer", async () => {
    const buf = await renderUtlatandeDocx(emptyCase(), entries);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
    // .docx is a zip — first two bytes are "PK".
    expect(buf.subarray(0, 2).toString("latin1")).toBe("PK");
  });
});
