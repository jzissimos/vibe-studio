import { NextRequest, NextResponse } from "next/server";
import { MKB } from "@/lib/mkb";

export async function POST(req: NextRequest) {
  const { modelId, prompt, params, useWebhook } = await req.json();
  const model = (MKB as any)[modelId];
  if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });

  // Always use webhook for reliability
  const submitUrl = new URL(`https://queue.fal.run/${modelId}` );
  submitUrl.searchParams.set("fal_webhook", `https://ai-cinematographer-cexz02g5k-jzs-projects-65e2ee01.vercel.app/api/fal/webhook` );

  const r = await fetch(submitUrl, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}` ,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...model.defaultParams, ...params, prompt }),
  });

  const data = await r.json();
  const request_id = data?.request_id || data?.id || data?.request?.id || null;

  if (!request_id) {
    return NextResponse.json({ error: "No request_id from provider", raw: data }, { status: 502 });
  }

  // Check if result is already available (fast completion)
  const existingResult = globalThis.webhookResults?.[request_id];
  if (existingResult) {
    const mediaUrl =
      existingResult?.images?.[0]?.url ||
      existingResult?.video?.url ||
      existingResult?.output?.[0]?.url ||
      null;

    if (mediaUrl) {
      return NextResponse.json({ request_id, media_url: mediaUrl, raw: existingResult });
    }
  }

  // For local development: Try to check status directly from FAL
  try {
    const statusUrl = `https://queue.fal.run/fal-ai/flux/dev/requests/${request_id}/status`;
    const statusRes = await fetch(statusUrl, {
      method: "POST", // FAL requires POST for status
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
    });

    if (statusRes.status === 200) {
      const statusData = await statusRes.json();
      if (statusData?.status === 'COMPLETED') {
        // Fetch the result
        const resultUrl = `https://queue.fal.run/fal-ai/flux/dev/requests/${request_id}`;
        const resultRes = await fetch(resultUrl, {
          method: "POST", // FAL requires POST for results too
          headers: { Authorization: `Key ${process.env.FAL_KEY}` },
        });

        if (resultRes.status === 200) {
          const resultData = await resultRes.json();
          const mediaUrl =
            resultData?.images?.[0]?.url ||
            resultData?.video?.url ||
            resultData?.output?.[0]?.url ||
            null;

          if (mediaUrl) {
            // Store for future reference
            globalThis.webhookResults = globalThis.webhookResults || {};
            globalThis.webhookResults[request_id] = resultData;
            return NextResponse.json({ request_id, media_url: mediaUrl, raw: resultData });
          }
        }
      }
    }
  } catch (e) {
    // Ignore direct API errors, continue with webhook approach
  }

  // Return pending status - client can poll or wait for webhook
  return NextResponse.json({ request_id, pending: true, webhook_enabled: true });
}
