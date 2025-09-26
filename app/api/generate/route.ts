import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { MKB } from "@/lib/mkb";

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { modelId, prompt, params } = await req.json();
    const model = (MKB as any)[modelId];
    if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });

    // Use fal.subscribe() which handles async operations automatically
    const result = await fal.subscribe(modelId, {
      input: {
        prompt,
        ...model.defaultParams,
        ...params,
      },
    });

    // Extract the media URL from the result
    const mediaUrl =
      (result as any)?.data?.images?.[0]?.url ||
      (result as any)?.data?.video?.url ||
      (result as any)?.images?.[0]?.url ||
      (result as any)?.video?.url ||
      (result as any)?.output?.[0]?.url ||
      null;

    if (!mediaUrl) {
      return NextResponse.json({ error: "No media URL in result", raw: result }, { status: 502 });
    }

    return NextResponse.json({
      request_id: (result as any).request_id || (result as any).requestId || "completed",
      media_url: mediaUrl,
      media_type: model.type, // "image" or "video"
      raw: result
    });

  } catch (error: any) {
    console.error("FAL API error:", error);
    return NextResponse.json({
      error: "Failed to generate media",
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}
