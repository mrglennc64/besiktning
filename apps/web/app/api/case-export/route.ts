import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCatalog } from "@/lib/noteringar";
import { renderUtlatandeDocx, type EntryMap } from "@/lib/case/exportDocx";
import type { CaseDoc } from "@/lib/case/types";

/** Try to load the SynaHus logo from public/; returns undefined if absent. */
async function loadLogo(): Promise<Uint8Array | undefined> {
  for (const ext of [".png", ".jpg"]) {
    try {
      const buf = await readFile(path.join(process.cwd(), "public", `synahus-logo${ext}`));
      return new Uint8Array(buf);
    } catch {
      // ignore and try next extension
    }
  }
  return undefined;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { case: CaseDoc; filename?: string }

export async function POST(req: Request) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return new Response("bad json", { status: 400 }); }
  if (!body?.case) return new Response("case required", { status: 400 });

  const cat = await getCatalog();
  const entries: EntryMap = new Map(cat.entries.map((e) => [e.id, { title: e.title, body: e.body }]));

  const logo = await loadLogo();
  const buf = logo
    ? await renderUtlatandeDocx(body.case, entries, { logo })
    : await renderUtlatandeDocx(body.case, entries);
  const name = (body.filename || "utlatande").replace(/[^a-z0-9_-]/gi, "_");

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${name}.docx"`,
    },
  });
}
