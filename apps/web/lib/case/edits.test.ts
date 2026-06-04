import { describe, it, expect } from "vitest";
import { emptyCase } from "./template";
import { applyEdit, applyEdits, type CatalogLookup } from "./edits";

const catalog: CatalogLookup = {
  has: (id) => id === "grund__plint_001" || id === "risk__fritidshus_001",
  title: (id) =>
    id === "grund__plint_001" ? "Plintgrund ej åtkomlig" :
    id === "risk__fritidshus_001" ? "Risk – Fritidshus" : "",
  search: (q) => (q.toLowerCase().includes("plint")
    ? [{ id: "grund__plint_001", title: "Plintgrund ej åtkomlig" }] : []),
};

describe("set_fact", () => {
  it("sets an allowed fact path", () => {
    const r = applyEdit(emptyCase(), { op: "set_fact", path: "fastighetsuppgifter.byggnadsar", value: "1971" }, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.fastighetsuppgifter.byggnadsar).toBe("1971");
  });
  it("rejects a path outside the allowlist", () => {
    const r = applyEdit(emptyCase(), { op: "set_fact", path: "ansvar.ansvarstid_ar", value: "9" }, catalog);
    expect(r.ok).toBe(false);
  });
});

describe("add_finding", () => {
  it("appends a finding holding only the id + qualifier (no body)", () => {
    const r = applyEdit(emptyCase(), { op: "add_finding", section: "grundlaggning", notering_id: "grund__plint_001", qualifier: "bakre kortsida" }, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const f = r.doc.okular_besiktning.grundlaggning.findings[0];
      expect(f).toEqual({ notering_id: "grund__plint_001", qualifier: "bakre kortsida" });
      expect("body" in f).toBe(false);
    }
  });
  it("routes invandiga_ytor.<room> to a room bucket", () => {
    const r = applyEdit(emptyCase(), { op: "add_finding", section: "invandiga_ytor.kok", notering_id: "grund__plint_001" }, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.okular_besiktning.invandiga_ytor.kok.findings[0].notering_id).toBe("grund__plint_001");
  });
  it("rejects an unknown notering_id with suggestions", () => {
    const r = applyEdit(emptyCase(), { op: "add_finding", section: "grundlaggning", notering_id: "plint" }, catalog);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.suggestions?.[0].id).toBe("grund__plint_001");
  });
});

describe("add_risk", () => {
  it("appends a risk item with rubrik defaulting to the catalog title", () => {
    const r = applyEdit(emptyCase(), { op: "add_risk", notering_id: "risk__fritidshus_001" }, catalog);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.riskanalys[0].rubrik).toBe("Risk – Fritidshus");
      expect(r.doc.riskanalys[0].findings[0].notering_id).toBe("risk__fritidshus_001");
    }
  });
});

describe("applyEdits", () => {
  it("applies a sequence and returns per-edit summaries; bad edits don't mutate", () => {
    const { doc, results } = applyEdits(emptyCase(), [
      { op: "set_fact", path: "fastighetsuppgifter.byggnadsar", value: "1971" },
      { op: "add_finding", section: "grundlaggning", notering_id: "nope" },
    ], catalog);
    expect(doc.fastighetsuppgifter.byggnadsar).toBe("1971");
    expect(doc.okular_besiktning.grundlaggning.findings).toHaveLength(0);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
  });
});
