import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for webhook results
// In production, use a database
declare global {
  var webhookResults: Record<string, any>;
}

if (!global.webhookResults) {
  global.webhookResults = {};
}

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }

  const result = global.webhookResults[requestId];

  if (result) {
    // Extract media URL from stored result
    const mediaUrl =
      result?.images?.[0]?.url ||
      result?.video?.url ||
      result?.output?.[0]?.url ||
      null;

    if (mediaUrl) {
      return NextResponse.json({ media_url: mediaUrl, raw: result });
    }
  }

  // Fallback: Try to fetch directly from FAL (for local development)
  try {
    const responseUrl = `https://queue.fal.run/fal-ai/flux/dev/requests/${requestId}`;
    const r = await fetch(responseUrl, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
    });

    if (r.status === 200) {
      const out = await r.json();
      const mediaUrl =
        out?.images?.[0]?.url ||
        out?.video?.url ||
        out?.output?.[0]?.url ||
        null;

      if (mediaUrl) {
        // Store it for future requests
        global.webhookResults[requestId] = out;
        return NextResponse.json({ media_url: mediaUrl, raw: out });
      }
    }
  } catch (e) {
    // Ignore errors, fallback to pending
  }

  return NextResponse.json({ status: "pending" });
}
