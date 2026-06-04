import { describe, it, expect } from "vitest";
import { emptyCase } from "./template";
import { runCaseChat, type ToolChatFn } from "./agent";
import type { CatalogLookup } from "./edits";

const catalog: CatalogLookup = {
  has: (id) => id === "grund__plint_001",
  title: () => "Plintgrund ej åtkomlig",
  search: () => [{ id: "grund__plint_001", title: "Plintgrund ej åtkomlig" }],
};

it("maps a set_fact tool call to an edit and applies it", async () => {
  const fake: ToolChatFn = async (_sys, contents) => {
    // First call: emit a tool call. Second call (after functionResponse): final text.
    const hasResponse = JSON.stringify(contents).includes("functionResponse");
    return hasResponse
      ? { functionCalls: [], text: "Satte byggnadsår." }
      : { functionCalls: [{ name: "set_fact", args: { path: "fastighetsuppgifter.byggnadsar", value: "1971" } }], text: "" };
  };
  const out = await runCaseChat({ doc: emptyCase(), message: "byggår 1971", history: [], catalog, chat: fake });
  expect(out.doc.fastighetsuppgifter.byggnadsar).toBe("1971");
  expect(out.edits).toEqual([{ op: "set_fact", path: "fastighetsuppgifter.byggnadsar", value: "1971" }]);
  expect(out.reply).toContain("byggnadsår");
});

it("stops at the loop cap and still returns", async () => {
  const fake: ToolChatFn = async () => ({
    functionCalls: [{ name: "set_skick", args: { value: "normalt" } }], text: "",
  });
  const out = await runCaseChat({ doc: emptyCase(), message: "x", history: [], catalog, chat: fake, maxRounds: 3 });
  expect(out.doc.sammanfattning.skick_bedomning).toBe("normalt");
  expect(out.edits.length).toBeLessThanOrEqual(3);
});
