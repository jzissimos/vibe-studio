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

  // Pass through status; try JSON first, else return text
  const ct = r.headers.get("content-type") || "";
  const text = await r.text();
  if (ct.includes("application/json")) {
    try { return NextResponse.json(JSON.parse(text), { status: r.status }); }
    catch { /* fall through */ }
  }
  return new NextResponse(text, { status: r.status, headers: { "content-type": ct || "text/plain" } });
}
