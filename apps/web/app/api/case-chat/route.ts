import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/noteringar";
import { runToolChat } from "@/lib/gemini";
import { runCaseChat, type ChatTurn } from "@/lib/case/agent";
import type { CatalogLookup } from "@/lib/case/edits";
import type { CaseDoc } from "@/lib/case/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { case: CaseDoc; message: string; history?: ChatTurn[] }

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  if (!body?.case || !body?.message) return NextResponse.json({ error: "case and message required" }, { status: 400 });

  const cat = await getCatalog();
  const byId = new Map(cat.entries.map((e) => [e.id, e]));
  const lookup: CatalogLookup = {
    has: (id) => byId.has(id),
    title: (id) => byId.get(id)?.title ?? id,
    search: (q) => {
      const needle = q.toLowerCase();
      return cat.entries
        .filter((e) => e.title && (e.title.toLowerCase().includes(needle) || e.id.toLowerCase().includes(needle) || e.category.toLowerCase().includes(needle)))
        .slice(0, 8)
        .map((e) => ({ id: e.id, title: e.title }));
    },
  };
  const grounding = cat.entries.filter((e) => e.title).map((e) => `${e.id} | ${e.category} | ${e.title}`).join("\n");

  try {
    const out = await runCaseChat({
      doc: body.case,
      message: body.message,
      history: body.history ?? [],
      catalog: lookup,
      grounding,
      chat: (sys, contents, tools) => runToolChat(sys, contents, tools),
    });
    return NextResponse.json({ reply: out.reply, edits: out.edits, case: out.doc });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
