import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for webhook results
// In production, use a database
declare global {
  var webhookResults: Record<string, any>;
}

if (!global.webhookResults) {
  global.webhookResults = {};
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const requestId = data?.request_id;
    const status = data?.status;

    console.log("Webhook received:", { requestId, status, data });

    if (requestId && status === 'COMPLETED') {
      // Store the completed result
      global.webhookResults[requestId] = data;

      // Extract media URL
      const mediaUrl =
        data?.images?.[0]?.url ||
        data?.video?.url ||
        data?.output?.[0]?.url ||
        null;

      if (mediaUrl) {
        console.log("Job completed with media URL:", mediaUrl);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
