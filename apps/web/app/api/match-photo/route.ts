import { NextResponse } from "next/server";
import { matchPhotoToNoteringar } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  image_base64: string;
  mime_type: string;
  category_filter?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image_base64 || !body.mime_type) {
    return NextResponse.json(
      { error: "Both image_base64 and mime_type are required" },
      { status: 400 },
    );
  }

  try {
    const matches = await matchPhotoToNoteringar(
      body.image_base64,
      body.mime_type,
      body.category_filter,
    );
    return NextResponse.json({ matches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
