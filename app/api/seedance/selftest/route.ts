import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { ensureFalImageUrl } from "@/lib/falImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 60s just in case, but we will return quickly.
export const maxDuration = 60;

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1502877338535-766e1452684a";
const DEFAULT_PROMPT = "cinematic dolly on a vintage car at sunset";

export async function POST(req: Request) {
  // TEMPORARY: Allow testing in production for this specific request
  const isTestRequest = req.headers.get("x-test-request") === "true";
  if (!isTestRequest) {
    return NextResponse.json({ error: "selftest disabled (use x-test-request header for testing)" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const imageUrl = String(body.imageUrl || DEFAULT_IMAGE);
    const prompt   = String(body.prompt   || DEFAULT_PROMPT);

    // Quick reachability check
    const head = await fetch(imageUrl, { method: "HEAD" });
    const okHead = head.ok && (head.headers.get("content-type") || "").startsWith("image/");
    if (!okHead) {
      return NextResponse.json({
        ok: false,
        stage: "head-check",
        error: "image not reachable or not an image",
        status: head.status,
        ctype: head.headers.get("content-type"),
        imageUrl
      }, { status: 400 });
    }

    const hasKey = !!process.env.FAL_KEY;

    // SUBMIT to queue (fast) instead of subscribe (long-running)
    const falImageUrl = imageUrl;

    const submit = await fal.queue.submit("fal-ai/bytedance/seedance/v1/pro/image-to-video", {
      input: {
        prompt,
        image_url: falImageUrl
      },
      webhookUrl: `${(process.env.VERCEL_URL ? ` https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/api/generate/webhook` ,
    });

    // Optional quick peek (non-blocking): one status check with tiny timeout budget
    // so the function still returns fast and doesn't exceed platform limits.
    let peek: any = null;
    try {
      const s = await fal.queue.status("fal-ai/bytedance/seedance/v1/pro/image-to-video", {
        requestId: submit.request_id
      });
      peek = { status: s?.status };
    } catch (e) {
      peek = { status: "UNKNOWN" };
    }

    return NextResponse.json({
      ok: true,
      message: "Seedance job submitted. Use /api/generate/status?request_id=... to poll until COMPLETED.",
      request_id: submit.request_id,
      peek,
      env: { FAL_KEY: hasKey },
      imageUrl,
      prompt
    }, { status: 200 });

  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: "exception", error: String(e?.message || e) }, { status: 500 });
  }
}
