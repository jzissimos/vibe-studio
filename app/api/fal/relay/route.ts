import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  const r = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Key ${process.env.FAL_KEY}`  },
    cache: "no-store",
  });

  const ct = r.headers.get("content-type") || "";
  const text = await r.text();

  if (ct.includes("application/json")) {
    try { return NextResponse.json(JSON.parse(text), { status: r.status }); } catch {}
  }
  return new NextResponse(text, { status: r.status, headers: { "content-type": ct || "text/plain" } });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
export async function HEAD(req: NextRequest) { return GET(req); }
