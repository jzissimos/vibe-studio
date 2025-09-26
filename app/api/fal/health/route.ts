import { NextResponse } from "next/server";
export async function GET() {
  const k = process.env.FAL_KEY || "";
  return NextResponse.json({
    falKeyLoaded: Boolean(k),
    preview: k ? k.slice(0, 6) + ":***" : null,
    node: process.version,
  });
}
