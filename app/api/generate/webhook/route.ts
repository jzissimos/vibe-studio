import { NextResponse } from "next/server";
import { cacheSet } from "@/lib/runCache";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id =
      body?.request_id ||
      body?.requestId ||
      body?.id ||
      null;

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing request_id" }, { status: 400 });
    }

    // Try to fetch the full result from FAL (some webhooks don't include video url)
    let finalPayload: any = body;
    try {
      const result = await fal.queue.result("fal-ai/bytedance/seedance/v1/pro/image-to-video", {
        requestId: id
      });
      if (result) finalPayload = result;
    } catch (e) {
      // keep original body; status route will retry if needed
    }

    cacheSet(id, finalPayload);

    const hasUrl = Boolean(
      finalPayload?.video?.url ||
      finalPayload?.data?.video?.url ||
      finalPayload?.data?.videos?.[0]?.url ||
      finalPayload?.videos?.[0]?.url ||
      finalPayload?.output?.[0]?.url ||
      finalPayload?.images?.[0]?.url
    );

    console.log("[FAL webhook] stored", id, hasUrl);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
