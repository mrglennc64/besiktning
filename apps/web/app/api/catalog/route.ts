import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/noteringar";

export const runtime = "nodejs";

export async function GET() {
  const cat = await getCatalog();
  return NextResponse.json(cat.entries.map((e) => ({ id: e.id, title: e.title, body: e.body })));
}
